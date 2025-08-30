'use client';

import { useState, useEffect } from 'react';
import { Comment, ProjectSettings } from '@/lib/types';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  selectedText: string;
  blockId: string;
  composableId: string;
  projectSettings: ProjectSettings | null;
  existingComment?: Comment;
  textPosition: { start: number; end: number };
}

export default function CommentModal({
  isOpen,
  onClose,
  onSave,
  selectedText,
  blockId,
  composableId,
  projectSettings,
  existingComment,
  textPosition
}: CommentModalProps) {
  const [authorType, setAuthorType] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (existingComment) {
      setAuthorType(existingComment.authorType);
      setAuthorName(existingComment.authorName);
      setContent(existingComment.content);
      setResolved(existingComment.resolved);
    } else {
      setAuthorType(projectSettings?.commentatorTypes[0] || '');
      setAuthorName('Anonymous'); // Default name
      setContent('');
      setResolved(false);
    }
  }, [existingComment, projectSettings, isOpen]);

  const handleSave = () => {
    if (!content.trim()) return;

    onSave({
      blockId,
      composableId,
      authorType,
      authorName: authorName.trim() || 'Anonymous',
      content: content.trim(),
      position: textPosition,
      resolved
    });

    handleClose();
  };

  const handleClose = () => {
    setAuthorType('');
    setAuthorName('');
    setContent('');
    setResolved(false);
    onClose();
  };

  if (!isOpen) return null;

  const commentatorTypes = projectSettings?.commentatorTypes || ['Developer', 'Designer', 'Product Manager', 'QA'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {existingComment ? 'Edit Comment' : 'Add Comment'}
            </h3>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          

          {/* Commentator type selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Commentator Type
            </label>
            <select
              value={authorType}
              onChange={(e) => setAuthorType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {commentatorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Author name - hidden but still used with default value */}

          {/* Comment content */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Comment
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Resolved checkbox (only for existing comments) */}
          {existingComment && (
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={(e) => setResolved(e.target.checked)}
                  className="mr-2 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Mark as resolved
                </span>
              </label>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
            >
              {existingComment ? 'Update' : 'Add'} Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
