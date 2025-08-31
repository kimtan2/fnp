export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

class GoogleDriveService {
  private isSignedIn = false;
  private accessToken: string | null = null;
  private tokenClient: any = null;

  async initializeGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('GIS can only be loaded in browser environment'));
        return;
      }

      if (window.google?.accounts?.oauth2) {
        this.initializeTokenClient();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.initializeTokenClient();
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  private initializeTokenClient(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (tokenResponse: TokenResponse) => {
        this.accessToken = tokenResponse.access_token;
        this.isSignedIn = true;
      },
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Sign-in can only be performed in browser environment');
      }

      if (!this.tokenClient) {
        await this.initializeGIS();
      }

      return new Promise((resolve) => {
        const originalCallback = this.tokenClient.callback;
        this.tokenClient.callback = (tokenResponse: TokenResponse) => {
          this.accessToken = tokenResponse.access_token;
          this.isSignedIn = true;
          originalCallback(tokenResponse);
          resolve(true);
        };

        this.tokenClient.requestAccessToken();
      });
    } catch (error) {
      console.error('Sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken);
      this.isSignedIn = false;
      this.accessToken = null;
    }
  }

  isAuthenticated(): boolean {
    return this.isSignedIn && this.accessToken !== null;
  }

  async uploadFile(filename: string, content: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const metadata = {
      name: filename,
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to Google Drive');
    }

    const result = await response.json();
    return result.id;
  }

  async listBackupFiles(): Promise<GoogleDriveFile[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name contains 'fnp-backup-' and parents in 'appDataFolder'&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list files from Google Drive');
    }

    const result = await response.json();
    return result.files || [];
  }

  async downloadFile(fileId: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download file from Google Drive');
    }

    return await response.text();
  }

  generateBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `fnp-backup-${timestamp}.json`;
  }
}

export const googleDriveService = new GoogleDriveService();

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: TokenResponse) => void;
          }) => {
            callback: (tokenResponse: TokenResponse) => void;
            requestAccessToken: () => void;
          };
          revoke: (accessToken: string) => void;
        };
      };
    };
  }
}