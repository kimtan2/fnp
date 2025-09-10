'use client';

import { useState, useEffect } from 'react';
import { ProjectSettings } from '@/lib/types';

const STATUS_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

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
  const [statusColors, setStatusColors] = useState<{ [status: string]: string }>({});
  const [commentatorTypes, setCommentatorTypes] = useState<string[]>([]);
  const [newStatusType, setNewStatusType] = useState('');
  const [newCommentatorType, setNewCommentatorType] = useState('');

  useEffect(() => {
    if (settings) {
      setStatusTypes([...settings.statusTypes]);
      setStatusColors({ ...settings.statusColors });
      setCommentatorTypes([...settings.commentatorTypes]);
    }
  }, [settings]);

  const handleSave = () => {
    if (settings) {
      onUpdateSettings({
        ...settings,
        statusTypes,
        statusColors,
        commentatorTypes
      });
    }
  };

  const handleClose = () => {
    if (settings) {
      setStatusTypes([...settings.statusTypes]);
      setStatusColors({ ...settings.statusColors });
      setCommentatorTypes([...settings.commentatorTypes]);
    }
    setNewStatusType('');
    setNewCommentatorType('');
    onClose();
  };

  const addStatusType = () => {
    if (newStatusType.trim() && !statusTypes.includes(newStatusType.trim())) {
      const newStatus = newStatusType.trim();
      setStatusTypes([...statusTypes, newStatus]);
      // Set default color for new status
      setStatusColors({ ...statusColors, [newStatus]: '#3B82F6' });
      setNewStatusType('');
    }
  };

  const removeStatusType = (index: number) => {
    const statusToRemove = statusTypes[index];
    setStatusTypes(statusTypes.filter((_, i) => i !== index));
    // Remove color mapping for removed status
    const newColors = { ...statusColors };
    delete newColors[statusToRemove];
    setStatusColors(newColors);
  };

  const updateStatusColor = (status: string, color: string) => {
    setStatusColors({ ...statusColors, [status]: color });
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
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: statusColors[status] || '#3B82F6' }}
                        />
                        <span className="text-slate-800 dark:text-white font-medium">{status}</span>
                      </div>
                      <button
                        onClick={() => removeStatusType(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateStatusColor(status, color)}
                          className={`w-6 h-6 rounded-full transition-all ${
                            statusColors[status] === color 
                              ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-700 scale-110' 
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={`Set ${status} color`}
                        />
                      ))}
                    </div>
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