'use client';

import { useState } from 'react';
import { ContentBlock, DividerStyle } from '@/lib/types';

interface DividerBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function DividerBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: DividerBlockProps) {
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const dividerStyle = block.content.dividerStyle || 'solid';

  const handleStyleChange = (style: DividerStyle) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        dividerStyle: style
      }
    });
    setShowStyleMenu(false);
  };

  const getDividerClass = (style: DividerStyle) => {
    switch (style) {
      case 'solid':
        return 'border-t border-slate-300 dark:border-slate-600';
      case 'dashed':
        return 'border-t border-dashed border-slate-300 dark:border-slate-600';
      case 'dotted':
        return 'border-t border-dotted border-slate-300 dark:border-slate-600 border-t-2';
      case 'double':
        return 'border-t-4 border-double border-slate-300 dark:border-slate-600';
      default:
        return 'border-t border-slate-300 dark:border-slate-600';
    }
  };

  const getStyleLabel = (style: DividerStyle) => {
    switch (style) {
      case 'solid': return 'Solid';
      case 'dashed': return 'Dashed';
      case 'dotted': return 'Dotted';
      case 'double': return 'Double';
      default: return 'Solid';
    }
  };

  return (
    <div 
      className={`group relative py-4 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >

      {/* Style selector and delete */}
      <div className="absolute -right-20 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
          >
            {getStyleLabel(dividerStyle)}
          </button>
          
          {showStyleMenu && (
            <div className="absolute top-8 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
              {(['solid', 'dashed', 'dotted', 'double'] as DividerStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => handleStyleChange(style)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3 ${
                    dividerStyle === style ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-8 h-0 ${getDividerClass(style)}`} />
                  <span>{getStyleLabel(style)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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

      {/* Divider line */}
      <div className={`w-full ${getDividerClass(dividerStyle)}`} />

      {/* Click backdrop to close style menu */}
      {showStyleMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowStyleMenu(false)}
        />
      )}
    </div>
  );
}