'use client';

import { useState, useEffect } from 'react';
import { ProjectSettings } from '@/lib/composables';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings | null;
  onUpdateSettings: (settings: ProjectSettings) => void;
}

export default function ProjectSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings 
}: ProjectSettingsModalProps) {
  const [statusTypes, setStatusTypes] = useState<string[]>([]);
  const [commentatorTypes, setCommentatorTypes] = useState<string[]>([]);
  const [newStatusType, setNewStatusType] = useState('');
  const [newCommentatorType, setNewCommentatorType] = useState('');

  useEffect(() => {
    if (settings) {
      setStatusTypes([...settings.statusTypes]);
      setCommentatorTypes([...settings.commentatorTypes]);
    }
  }, [settings]);

  const handleSave = () => {
    if (settings) {
      onUpdateSettings({
        ...settings,
        statusTypes,
        commentatorTypes
      });
    }
  };

  const handleClose = () => {
    if (settings) {
      setStatusTypes([...settings.statusTypes]);
      setCommentatorTypes([...settings.commentatorTypes]);
    }
    setNewStatusType('');
    setNewCommentatorType('');
    onClose();
  };

  const addStatusType = () => {
    if (newStatusType.trim() && !statusTypes.includes(newStatusType.trim())) {
      setStatusTypes([...statusTypes, newStatusType.trim()]);
      setNewStatusType('');
    }
  };

  const removeStatusType = (index: number) => {
    setStatusTypes(statusTypes.filter((_, i) => i !== index));
  };

  const addCommentatorType = () => {
    if (newCommentatorType.trim() && !commentatorTypes.includes(newCommentatorType.trim())) {
      setCommentatorTypes([...commentatorTypes, newCommentatorType.trim()]);
      setNewCommentatorType('');
    }
  };

  const removeCommentatorType = (index: number) => {
    setCommentatorTypes(commentatorTypes.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Project Settings
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
                Status Types
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Define the different status options for your composables.
              </p>
              
              <div className="space-y-3">
                {statusTypes.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-slate-800 dark:text-white">{status}</span>
                    <button
                      onClick={() => removeStatusType(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStatusType}
                    onChange={(e) => setNewStatusType(e.target.value)}
                    placeholder="Add new status type..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addStatusType()}
                  />
                  <button
                    onClick={addStatusType}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
                Commentator Types
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Define the different types of commentators for your project.
              </p>
              
              <div className="space-y-3">
                {commentatorTypes.map((commentator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-slate-800 dark:text-white">{commentator}</span>
                    <button
                      onClick={() => removeCommentatorType(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentatorType}
                    onChange={(e) => setNewCommentatorType(e.target.value)}
                    placeholder="Add new commentator type..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addCommentatorType()}
                  />
                  <button
                    onClick={addCommentatorType}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}