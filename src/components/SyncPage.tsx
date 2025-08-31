'use client';

import { useState, useEffect } from 'react';
import { syncService } from '@/lib/sync-service';
import { googleDriveService, type GoogleDriveFile } from '@/lib/google-drive-service';

interface SyncPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncPage({ isOpen, onClose }: SyncPageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [backupFiles, setBackupFiles] = useState<GoogleDriveFile[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<{ conflicts: string[], imported: number } | null>(null);

  useEffect(() => {
    if (isOpen && googleDriveService.isAuthenticated()) {
      setIsAuthenticated(true);
      loadBackupFiles();
    }
  }, [isOpen]);

  const loadBackupFiles = async () => {
    try {
      const files = await googleDriveService.listBackupFiles();
      setBackupFiles(files);
    } catch (error) {
      console.error('Failed to load backup files:', error);
      setMessage('Failed to load backup files');
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setMessage('');
    
    try {
      if (!googleDriveService.isAuthenticated()) {
        await googleDriveService.initializeGIS();
        const success = await googleDriveService.signIn();
        if (!success) {
          setMessage('Failed to authenticate with Google Drive');
          return;
        }
        setIsAuthenticated(true);
      }

      const jsonData = await syncService.exportToJSON();
      const filename = googleDriveService.generateBackupFilename();
      
      await googleDriveService.uploadFile(filename, jsonData);
      setMessage('Data successfully uploaded to Google Drive');
      await loadBackupFiles();
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage('Failed to upload data to Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    setIsDownloading(true);
    setMessage('');
    
    try {
      const jsonData = await googleDriveService.downloadFile(fileId);
      const result = await syncService.importFromJSON(jsonData);
      
      if (result.conflicts.length > 0) {
        setConflictData(result);
        setShowConflictDialog(true);
      } else {
        setMessage(`Successfully imported ${result.imported} items from ${filename}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      setMessage('Failed to download and import data');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!conflictData) return;
    
    setIsDownloading(true);
    try {
      await syncService.clearAllData();
      setMessage(`Replaced all data. Imported ${conflictData.imported} items.`);
      setShowConflictDialog(false);
      setConflictData(null);
    } catch (error) {
      console.error('Replace failed:', error);
      setMessage('Failed to replace data');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  if (showConflictDialog && conflictData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Data Conflicts Detected
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Some data already exists. {conflictData.imported} items were imported successfully.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                Conflicts:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                {conflictData.conflicts.slice(0, 5).map((conflict, index) => (
                  <li key={index}>• {conflict}</li>
                ))}
                {conflictData.conflicts.length > 5 && (
                  <li>• ... and {conflictData.conflicts.length - 5} more</li>
                )}
              </ul>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConflictDialog(false);
                  setConflictData(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Keep Current
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={isDownloading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {isDownloading ? 'Replacing...' : 'Replace All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Sync Data
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('Failed') || message.includes('failed') 
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white">
              Upload to Google Drive
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Export all your current data as a single file to your Google Drive account.
            </p>
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {isUploading ? 'Uploading...' : 'Connect to Google Drive & Upload'}
            </button>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
              Download from Google Drive
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Restore data from a previous backup stored in your Google Drive.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Available backups:
              </p>
              {isAuthenticated && backupFiles.length > 0 ? (
                <div className="space-y-2">
                  {backupFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {file.name.replace('fnp-backup-', '').replace('.json', '')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(file.modifiedTime).toLocaleString()} • {file.size} bytes
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id, file.name)}
                        disabled={isDownloading}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded transition-colors duration-200"
                      >
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {isAuthenticated ? 'No backups found.' : 'Connect to Google Drive first.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}