'use client';

import { BlockType } from '@/lib/types';

interface AddBlockMenuProps {
  onAddBlock: (type: BlockType) => void;
  onClose: () => void;
}

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const blockOptions: BlockOption[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Start writing with plain text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    )
  },
  {
    type: 'header',
    label: 'Header',
    description: 'Big section heading',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M12 3v18M5 7h14" />
      </svg>
    )
  },
  {
    type: 'list',
    label: 'List',
    description: 'Create a simple list',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )
  },
  {
    type: 'text-block',
    label: 'Text Block',
    description: 'Larger text area for paragraphs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    type: 'collapsible-list',
    label: 'Collapsible List',
    description: 'Aufklappbare Liste - expandable section',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  },
  {
    type: 'collapsible-list-array',
    label: 'Collapsible List Array',
    description: 'Multiple tabbed sections with expandable content',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M7 4v16M17 4v16" />
      </svg>
    )
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  },
  {
    type: 'markdown',
    label: 'Markdown',
    description: 'Rich text with markdown formatting',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }
];

export default function AddBlockMenu({ onAddBlock, onClose }: AddBlockMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="absolute top-8 left-0 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 min-w-64 py-2">
        <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 mb-1">
          Basic Blocks
        </div>
        
        {blockOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => {
              onAddBlock(option.type);
              onClose();
            }}
            className="w-full flex items-start space-x-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
          >
            <div className="flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400">
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-white">
                {option.label}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}