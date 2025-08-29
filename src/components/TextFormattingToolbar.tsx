'use client';

import { useState } from 'react';
import { TextStyle } from '@/lib/types';

interface TextFormattingToolbarProps {
  position: { x: number; y: number };
  onFormat: (style: Partial<TextStyle>) => void;
  onClose: () => void;
}

const textColors = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F59E0B', 
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'
];

const backgroundColors = [
  'transparent', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5', 
  '#E0E7FF', '#F3E8FF', '#FCE7F3', '#FED7AA', '#F3F4F6'
];

export default function TextFormattingToolbar({ 
  position, 
  onFormat, 
  onClose 
}: TextFormattingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'background' | null>(null);

  const handleFormat = (style: Partial<TextStyle>) => {
    onFormat(style);
    setShowColorPicker(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Toolbar */}
      <div
        className="fixed z-50 bg-slate-800 text-white rounded-lg shadow-xl px-2 py-1 flex items-center space-x-1"
        style={{
          left: position.x - 120, // Center the toolbar
          top: position.y - 50
        }}
      >
        {/* Bold */}
        <button
          onClick={() => handleFormat({ bold: true })}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          onClick={() => handleFormat({ italic: true })}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16M6 20l4-16" />
          </svg>
        </button>

        {/* Underline */}
        <button
          onClick={() => handleFormat({ underline: true })}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
          </svg>
        </button>

        {/* Strikethrough */}
        <button
          onClick={() => handleFormat({ strikethrough: true })}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M9 5a3 3 0 013 0m0 14a3 3 0 01-3 0" />
          </svg>
        </button>

        <div className="w-px h-6 bg-slate-600" />

        {/* Text Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Text Color"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h16a2 2 0 002-2v-4a2 2 0 00-2-2H7" />
            </svg>
          </button>
          
          {showColorPicker === 'text' && (
            <div className="absolute top-10 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 grid grid-cols-5 gap-1">
              {textColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleFormat({ color })}
                  className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Background Color"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h16a2 2 0 002-2v-4a2 2 0 00-2-2H7" />
            </svg>
          </button>
          
          {showColorPicker === 'background' && (
            <div className="absolute top-10 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 grid grid-cols-5 gap-1">
              {backgroundColors.map((color, index) => (
                <button
                  key={color}
                  onClick={() => handleFormat({ backgroundColor: color === 'transparent' ? undefined : color })}
                  className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform relative"
                  style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                >
                  {color === 'transparent' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-red-500 rotate-45"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}