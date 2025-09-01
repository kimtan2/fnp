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
  error?: string;
  error_description?: string;
}

class GoogleDriveService {
  private isSignedIn = false;
  private accessToken: string | null = null;
  private tokenClient: { callback: (tokenResponse: TokenResponse) => void; requestAccessToken: () => void; } | null | undefined = null;

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
      // FIXED: Use broader scope to ensure we can create files
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appfolder',
      callback: (tokenResponse: TokenResponse) => {
        if (tokenResponse.error) {
          console.error('Token error:', tokenResponse.error, tokenResponse.error_description);
          return;
        }
        this.accessToken = tokenResponse.access_token;
        this.isSignedIn = true;
        console.log('Successfully authenticated with Google Drive');
      },
      error_callback: (error: Error) => {
        console.error('Auth error:', error);
        this.isSignedIn = false;
        this.accessToken = null;
      }
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

      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error('Token client not initialized'));
          return;
        }
        const originalCallback = this.tokenClient.callback;
        this.tokenClient.callback = (tokenResponse: TokenResponse) => {
          if (tokenResponse.error) {
            console.error('Sign-in error:', tokenResponse.error, tokenResponse.error_description);
            reject(new Error(`Authentication failed: ${tokenResponse.error_description || tokenResponse.error}`));
            return;
          }
          
          this.accessToken = tokenResponse.access_token;
          this.isSignedIn = true;
          originalCallback(tokenResponse);
          
          // Test the token by making a simple API call
          this.testConnection().then(success => {
            if (success) {
              console.log('Google Drive connection tested successfully');
              resolve(true);
            } else {
              console.error('Google Drive connection test failed');
              resolve(false);
            }
          }).catch(error => {
            console.error('Google Drive connection test error:', error);
            resolve(false);
          });
        };

        if (this.tokenClient) {
          this.tokenClient.requestAccessToken();
        } else {
          reject(new Error('Token client not initialized'));
        }
      });
    } catch (error) {
      console.error('Sign-in failed:', error);
      return false;
    }
  }

  private async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Connected as:', result.user?.emailAddress);
        return true;
      } else {
        console.error('Connection test failed:', response.status, await response.text());
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
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

    console.log('Starting upload for file:', filename);
    console.log('File size:', content.length, 'bytes');

    // Use multipart upload directly for better reliability
    try {
      return await this.uploadFileMultipart(filename, content);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  private async uploadFileMultipart(filename: string, content: string): Promise<string> {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: filename,
      // FIXED: Don't specify parents to put in root folder (more visible)
      // This way files will be in the main Drive and easier to find
      description: 'FNP App Backup File'
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      close_delim;

    console.log('Uploading with metadata:', metadata);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Multipart upload failed:', response.status, errorData);
      
      if (response.status === 403) {
        throw new Error(`Upload failed (403 Forbidden). Please check: 1) Google Drive API is enabled, 2) Correct OAuth scopes, 3) Storage quota. Error: ${errorData}`);
      } else if (response.status === 401) {
        throw new Error('Authentication expired. Please sign in again.');
      } else {
        throw new Error(`Upload failed with status ${response.status}: ${errorData}`);
      }
    }

    const result = await response.json();
    console.log('Upload successful (multipart method):', result);
    return result.id;
  }

  private async updateFileMetadata(fileId: string, filename: string): Promise<void> {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: filename,
          parents: ['appDataFolder']
        })
      });

      if (!response.ok) {
        console.error('Failed to update file metadata:', await response.text());
      } else {
        console.log('File metadata updated successfully');
      }
    } catch (error) {
      console.error('Error updating file metadata:', error);
    }
  }

  async listBackupFiles(): Promise<GoogleDriveFile[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    console.log('Listing backup files...');

    try {
      // FIXED: Correct search queries based on Google Drive API documentation
      const searchQueries = [
        // Search everywhere for our backup files (most reliable)
        `name contains 'fnp-backup-' and trashed=false`,
        // Search specifically in appDataFolder (correct name)
        `'appDataFolder' in parents and name contains 'fnp-backup-' and trashed=false`,
        // Search by exact name pattern
        `name contains 'fnp-backup-' and name contains '.json' and trashed=false`
      ];

      let allFiles: GoogleDriveFile[] = [];

      for (const query of searchQueries) {
        try {
          console.log(`Trying query: ${query}`);
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size,parents)&orderBy=modifiedTime desc`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`
              }
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.files && result.files.length > 0) {
              console.log(`Found ${result.files.length} files with query: ${query}`, result.files);
              allFiles = allFiles.concat(result.files);
            } else {
              console.log(`No files found with query: ${query}`);
            }
          } else {
            const errorText = await response.text();
            console.warn(`Query failed: ${query}`, response.status, errorText);
          }
        } catch (error) {
          console.warn(`Query error: ${query}`, error);
        }
      }

      // Remove duplicates based on file ID
      const uniqueFiles = allFiles.filter((file, index, self) => 
        index === self.findIndex(f => f.id === file.id)
      );

      console.log(`Found ${uniqueFiles.length} unique backup files:`, uniqueFiles);
      return uniqueFiles;
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    console.log('Downloading file:', fileId);

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

      const content = await response.text();
      console.log('Download successful, content length:', content.length);
      return content;
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

  // ADDED: Debug method to check what files exist
  async debugListAllFiles(): Promise<unknown[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?fields=files(id,name,parents,modifiedTime,size)&pageSize=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('All files in Drive:', result.files);
        return result.files || [];
      } else {
        console.error('Debug list failed:', response.status, await response.text());
        return [];
      }
    } catch (error) {
      console.error('Debug list error:', error);
      return [];
    }
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
            error_callback?: (error: Error) => void;
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