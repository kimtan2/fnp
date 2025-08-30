'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentBlock } from '@/lib/types';

interface BlockSettingsMenuProps {
  block: ContentBlock;
  onDelete: () => void;
  onUpdate: (block: ContentBlock) => void;
  onClose: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const BLOCK_COLORS = [
  { name: 'Default', value: '', bg: 'bg-white', border: 'border-slate-200' },
  { name: 'Gray', value: 'gray', bg: 'bg-gray-50', border: 'border-gray-200' },
  { name: 'Red', value: 'red', bg: 'bg-red-50', border: 'border-red-200' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-50', border: 'border-orange-200' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { name: 'Green', value: 'green', bg: 'bg-green-50', border: 'border-green-200' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-50', border: 'border-purple-200' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-50', border: 'border-pink-200' },
];

export default function BlockSettingsMenu({ block, onDelete, onUpdate, onClose, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: BlockSettingsMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const copyBlockId = async () => {
    try {
      await navigator.clipboard.writeText(block.id);
      // Could show a toast notification here
      console.log('Block ID copied to clipboard:', block.id);
    } catch (err) {
      console.error('Failed to copy block ID:', err);
    }
    onClose();
  };

  const handleColorChange = (color: string) => {
    const updatedBlock = {
      ...block,
      content: {
        ...block.content,
        backgroundColor: color
      }
    };
    onUpdate(updatedBlock);
    setShowColorPicker(false);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete();
    onClose();
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const currentColor = block.content.backgroundColor || '';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 min-w-48 py-1"
    >
      {/* Move Up option */}
      {onMoveUp && (
        <button
          onClick={() => {
            onMoveUp();
            onClose();
          }}
          disabled={!canMoveUp}
          className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 ${
            !canMoveUp 
              ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' 
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>Move Up</span>
        </button>
      )}

      {/* Move Down option */}
      {onMoveDown && (
        <button
          onClick={() => {
            onMoveDown();
            onClose();
          }}
          disabled={!canMoveDown}
          className={`w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 ${
            !canMoveDown 
              ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' 
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Move Down</span>
        </button>
      )}

      {/* Divider */}
      {(onMoveUp || onMoveDown) && <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>}

      {/* Delete option */}
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 text-red-600 dark:text-red-400"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </button>

      {/* Copy ID option */}
      <button
        onClick={copyBlockId}
        className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 text-slate-700 dark:text-slate-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>Copy ID</span>
      </button>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>

      {/* Color options */}
      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-2 text-slate-700 dark:text-slate-300"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
        <span>Change Color</span>
        <svg className={`w-4 h-4 ml-auto transition-transform ${showColorPicker ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Color picker */}
      {showColorPicker && (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-3 gap-2 mt-2">
            {BLOCK_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`w-full h-8 rounded border-2 ${color.bg} ${color.border} hover:scale-105 transition-transform ${
                  currentColor === color.value ? 'ring-2 ring-blue-500' : ''
                }`}
                title={color.name}
              >
                {color.name === 'Default' && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    Default
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-slate-900 dark:text-slate-100">
                Delete Block
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete this block? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}