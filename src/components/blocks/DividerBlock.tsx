'use client';

import { useState } from 'react';
import { ContentBlock, DividerStyle } from '@/lib/types';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';

interface DividerBlockProps {
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

export default function DividerBlock({
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
}: DividerBlockProps) {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
     
    >

      {/* Style selector and settings */}
      <div className="absolute -right-28 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
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

        {/* Settings button */}
        <div className="relative">
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
            />
          )}
        </div>
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