'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentBlock } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';
import OverlayCommentModal from '@/components/OverlayCommentModal';
import OverlayCommentIndicator from '@/components/OverlayCommentIndicator';
import { useOverlayComment } from '@/hooks/useOverlayComment';

interface MarkdownBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export default function MarkdownBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: MarkdownBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.content.markdownContent || '');
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayComment = useOverlayComment(block, onUpdate);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editValue.length, editValue.length);
    }
  }, [isEditing, editValue]);

  const handleSave = () => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        markdownContent: editValue
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(block.content.markdownContent || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [isEditing, editValue]);

  const markdownContent = block.content.markdownContent || '';
  const isEmpty = !markdownContent.trim();

  return (
    <div
      className={`group relative py-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Overlay Comment Indicator */}
      <OverlayCommentIndicator
        hasComment={!!block.overlayComment}
        onClick={() => overlayComment.setShowOverlayComment(true)}
      />

      {/* Settings button */}
      <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Block settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {showSettings && (
          <BlockSettingsMenu
            block={block}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onClose={() => setShowSettings(false)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onAddOverlayComment={overlayComment.handleAddOverlayComment}
          />
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Write your markdown here..."
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            style={{ minHeight: '120px' }}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Press Ctrl+Enter (or Cmd+Enter) to save, Esc to cancel
          </div>
        </div>
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className={`cursor-text rounded-lg border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors ${
            isEmpty ? 'py-8' : 'py-2'
          }`}
        >
          {isEmpty ? (
            <div className="text-slate-400 dark:text-slate-500 italic flex items-center justify-center">
              Double-click to add markdown content...
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize link styling
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  // Customize code block styling
                  pre: ({ children }) => (
                    <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      );
                    }
                    return <code className={className}>{children}</code>;
                  },
                  // Customize table styling
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 bg-slate-100 dark:bg-slate-800 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                      {children}
                    </td>
                  ),
                  // Customize blockquote styling
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  )
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Overlay Comment Modal */}
      <OverlayCommentModal
        isOpen={overlayComment.showOverlayComment || overlayComment.editingOverlayComment}
        isEditing={overlayComment.editingOverlayComment}
        commentText={overlayComment.overlayCommentText}
        onCommentTextChange={overlayComment.setOverlayCommentText}
        onSave={overlayComment.handleSaveOverlayComment}
        onCancel={overlayComment.handleCancelOverlayComment}
        onEdit={() => overlayComment.setEditingOverlayComment(true)}
        onDelete={overlayComment.handleDeleteOverlayComment}
        onClose={() => {
          overlayComment.setShowOverlayComment(false);
          overlayComment.setEditingOverlayComment(false);
        }}
      />
    </div>
  );
}