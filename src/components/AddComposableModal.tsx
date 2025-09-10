'use client';

import { useState } from 'react';
import { Composable, ProjectSettings } from '@/lib/types';

interface AddComposableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComposable: (composable: Omit<Composable, 'id' | 'createdAt' | 'projectId'>) => void;
  settings: ProjectSettings | null;
}

const colors = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', 
  '#10B981', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#84CC16', '#F43F5E', '#8B5CF6'
];

export default function AddComposableModal({ 
  isOpen, 
  onClose, 
  onAddComposable, 
  settings 
}: AddComposableModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('No Status');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const statusOptions = settings?.statusTypes || ['No Status', 'Projekt', 'Sofort', 'Beobachten', 'To-Do', 'Ministerium Überwachung'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && status) {
      onAddComposable({
        title: title.trim(),
        description: description.trim(),
        status,
        color: selectedColor,
        position: { x: 0, y: 0 }
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus(statusOptions[0] || 'No Status');
    setSelectedColor(colors[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Add New Composable
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter composable title..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
              >
                <option value="">Select status...</option>
                {statusOptions.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Choose Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all duration-200 ${
                      selectedColor === color
                        ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !status}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Add Composable
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}