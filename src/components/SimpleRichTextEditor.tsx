'use client';

import { useRef } from 'react';
import { RichText } from '@/lib/content';

interface SimpleRichTextEditorProps {
  content: RichText;
  onChange: (content: RichText) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'div';
}

export default function SimpleRichTextEditor({
  content,
  onChange,
  placeholder = 'Type something...',
  className = '',
  multiline = false,
  tag = 'div'
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Get plain text content
  const getPlainText = () => {
    return content.spans?.map(span => span.text).join('') || '';
  };

  // Handle text changes
  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newText = target.textContent || '';
    
    const newContent: RichText = {
      spans: newText ? [{ text: newText }] : []
    };
    onChange(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const Component = tag;

  return (
    <Component
      ref={editorRef}
      className={`outline-none focus:ring-0 ${className}`}
      contentEditable
      suppressContentEditableWarning={true}
      onInput={handleTextChange}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      style={{
        minHeight: multiline ? '120px' : 'auto',
      }}
    >
      {getPlainText() || ''}
    </Component>
  );
}