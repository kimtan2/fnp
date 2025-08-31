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
    this.tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      // FIXED: Use proper scope for appDataFolder access
      scope: 'https://www.googleapis.com/auth/drive.appfolder',
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

    // FIXED: Improved upload method with proper error handling
    const metadata = {
      name: filename,
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload failed with status:', response.status, 'Response:', errorData);
        
        // FIXED: Better error handling with specific error types
        if (response.status === 403) {
          throw new Error(`Upload failed (403 Forbidden). This could be due to: 1) Insufficient permissions, 2) API not enabled, 3) Storage quota exceeded, or 4) Rate limit exceeded. Error: ${errorData}`);
        } else if (response.status === 401) {
          throw new Error('Authentication expired. Please sign in again.');
        } else {
          throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
        }
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async listBackupFiles(): Promise<GoogleDriveFile[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name contains 'fnp-backup-' and parents in 'appDataFolder'&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('List files failed:', response.status, errorData);
        
        if (response.status === 403) {
          throw new Error(`Failed to list files (403 Forbidden). Error: ${errorData}`);
        } else if (response.status === 401) {
          throw new Error('Authentication expired. Please sign in again.');
        } else {
          throw new Error(`Failed to list files with status ${response.status}: ${errorData}`);
        }
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Download failed:', response.status, errorData);
        
        if (response.status === 403) {
          throw new Error(`Failed to download file (403 Forbidden). Error: ${errorData}`);
        } else if (response.status === 401) {
          throw new Error('Authentication expired. Please sign in again.');
        } else {
          throw new Error(`Failed to download file with status ${response.status}: ${errorData}`);
        }
      }

      return await response.text();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
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