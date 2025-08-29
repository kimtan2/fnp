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
    type: 'divider',
    label: 'Divider',
    description: 'Visually divide blocks',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
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