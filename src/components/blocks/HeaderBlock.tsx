'use client';

import { useState } from 'react';
import { ContentBlock, HeaderSize } from '@/lib/content';
import SimpleRichTextEditor from '@/components/SimpleRichTextEditor';
import { RichText } from '@/lib/content';

interface HeaderBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function HeaderBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: HeaderBlockProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const headerSize = block.content.headerSize || 'h1';
  const headerText = block.content.headerText || { spans: [] };

  const handleTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        headerText: newText
      }
    });
  };

  const handleSizeChange = (size: HeaderSize) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        headerSize: size
      }
    });
    setShowSizeMenu(false);
  };

  const getHeaderStyles = (size: HeaderSize) => {
    switch (size) {
      case 'h1':
        return 'text-3xl font-bold text-slate-900 dark:text-white';
      case 'h2':
        return 'text-2xl font-semibold text-slate-800 dark:text-slate-100';
      case 'h3':
        return 'text-xl font-medium text-slate-700 dark:text-slate-200';
      default:
        return 'text-3xl font-bold text-slate-900 dark:text-white';
    }
  };

  const getSizeLabel = (size: HeaderSize) => {
    switch (size) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      default: return 'Heading 1';
    }
  };

  return (
    <div 
      className={`group relative py-2 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div 
        className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        onMouseDown={onDragStart}
      >
        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </div>

      {/* Header size selector */}
      <div className="absolute -right-20 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <div className="relative">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
          >
            {getSizeLabel(headerSize)}
          </button>
          
          {showSizeMenu && (
            <div className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
              {(['h1', 'h2', 'h3'] as HeaderSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    headerSize === size ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {getSizeLabel(size)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Delete block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Header content */}
      <SimpleRichTextEditor
        content={headerText}
        onChange={handleTextChange}
        placeholder="Enter header text..."
        className={getHeaderStyles(headerSize)}
        tag={headerSize}
      />

      {/* Click backdrop to close size menu */}
      {showSizeMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowSizeMenu(false)}
        />
      )}
    </div>
  );
}