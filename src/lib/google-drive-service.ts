export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

class GoogleDriveService {
  private isSignedIn = false;
  private accessToken: string | null = null;

  async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('gapi can only be loaded in browser environment'));
        return;
      }

      if (window.gapi) {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
          }).then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();
            this.isSignedIn = authInstance.isSignedIn.get();
            if (this.isSignedIn) {
              this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            }
            resolve();
          }).catch(reject);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
          }).then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();
            this.isSignedIn = authInstance.isSignedIn.get();
            if (this.isSignedIn) {
              this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            }
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Sign-in can only be performed in browser environment');
      }

      if (!window.gapi?.auth2) {
        await this.initializeGapi();
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn({
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      this.isSignedIn = true;
      this.accessToken = user.getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('Sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (window.gapi?.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
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
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: { client_id: string }) => Promise<{
          isSignedIn: { get: () => boolean };
          currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
          signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
          signOut: () => Promise<void>;
          getAuthInstance: () => {
            isSignedIn: { get: () => boolean };
            currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
            signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
            signOut: () => Promise<void>;
          };
        }>;
        getAuthInstance: () => {
          isSignedIn: { get: () => boolean };
          currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
          signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
          signOut: () => Promise<void>;
        };
      };
    };
  }

  const gapi: {
    load: (api: string, callback: () => void) => void;
    auth2: {
      init: (config: { client_id: string }) => Promise<{
        isSignedIn: { get: () => boolean };
        currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
        signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
        signOut: () => Promise<void>;
        getAuthInstance: () => {
          isSignedIn: { get: () => boolean };
          currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
          signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
          signOut: () => Promise<void>;
        };
      }>;
      getAuthInstance: () => {
        isSignedIn: { get: () => boolean };
        currentUser: { get: () => { getAuthResponse: () => { access_token: string } } };
        signIn: (config: { scope: string }) => Promise<{ getAuthResponse: () => { access_token: string } }>;
        signOut: () => Promise<void>;
      };
    };
  };
}