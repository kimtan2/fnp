'use client';

import { useState } from 'react';
import { ContentBlock, HeaderSize, RichText } from '@/lib/types';
import BasicTextInput from '@/components/BasicTextInput';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';

interface HeaderBlockProps {
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

export default function HeaderBlock({
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
}: HeaderBlockProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      className={`relative flex items-start py-2 ${isDragging ? 'opacity-50' : ''}`}
      
    >

      <div className="flex-1 relative">
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

        {/* Header content */}
        <BasicTextInput
          content={headerText}
          onChange={handleTextChange}
          placeholder="Enter header text..."
          className={getHeaderStyles(headerSize)}
          tag={headerSize}
        />
      </div>

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