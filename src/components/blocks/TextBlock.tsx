'use client';

import { ContentBlock, RichText } from '@/lib/content';
import SimpleRichTextEditor from '@/components/SimpleRichTextEditor';

interface TextBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function TextBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}: TextBlockProps) {
  const text = block.content.text || { spans: [] };

  const handleTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        text: newText
      }
    });
  };

  return (
    <div 
      className={`group relative py-1 ${isDragging ? 'opacity-50' : ''}`}
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

      {/* Delete button */}
      <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Text content */}
      <SimpleRichTextEditor
        content={text}
        onChange={handleTextChange}
        placeholder="Type something..."
        className="text-slate-700 dark:text-slate-200 leading-relaxed"
        tag="p"
      />
    </div>
  );
}