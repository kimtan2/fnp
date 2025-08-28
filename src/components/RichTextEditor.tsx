'use client';

import { useState, useRef, useEffect } from 'react';
import { RichText, RichTextSpan, TextStyle } from '@/lib/content';
import TextFormattingToolbar from '@/components/TextFormattingToolbar';

interface RichTextEditorProps {
  content: RichText;
  onChange: (content: RichText) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'div';
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Type something...',
  className = '',
  multiline = false,
  tag = 'div'
}: RichTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // Convert RichText to HTML
  const renderContent = () => {
    if (!content.spans || content.spans.length === 0) {
      return '';
    }

    return content.spans.map((span, index) => {
      const style: React.CSSProperties = {};
      
      if (span.style) {
        if (span.style.bold) style.fontWeight = 'bold';
        if (span.style.italic) style.fontStyle = 'italic';
        if (span.style.underline) style.textDecoration = (style.textDecoration || '') + ' underline';
        if (span.style.strikethrough) style.textDecoration = (style.textDecoration || '') + ' line-through';
        if (span.style.color) style.color = span.style.color;
        if (span.style.backgroundColor) style.backgroundColor = span.style.backgroundColor;
        if (span.style.fontSize) style.fontSize = `${span.style.fontSize}px`;
      }

      return (
        <span key={index} style={style}>
          {span.text}
        </span>
      );
    });
  };

  // Get plain text content
  const getPlainText = () => {
    return content.spans?.map(span => span.text).join('') || '';
  };

  // Handle text changes
  const handleTextChange = (newText: string) => {
    const newContent: RichText = {
      spans: newText ? [{ text: newText }] : []
    };
    onChange(newContent);
  };

  // Handle selection change
  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const text = getPlainText();
      
      if (range.startOffset !== range.endOffset) {
        setSelection({
          start: range.startOffset,
          end: range.endOffset
        });
        setShowToolbar(true);
        
        // Position toolbar
        const rect = range.getBoundingClientRect();
        setToolbarPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 10
        });
      } else {
        setShowToolbar(false);
        setSelection(null);
      }
    }
  };

  // Apply formatting to selected text
  const applyFormatting = (style: Partial<TextStyle>) => {
    if (!selection || !content.spans) return;

    const plainText = getPlainText();
    const selectedText = plainText.slice(selection.start, selection.end);
    
    const newSpans: RichTextSpan[] = [];
    
    // Add text before selection
    if (selection.start > 0) {
      newSpans.push({ text: plainText.slice(0, selection.start) });
    }
    
    // Add formatted selection
    newSpans.push({
      text: selectedText,
      style: { ...content.spans[0]?.style, ...style }
    });
    
    // Add text after selection
    if (selection.end < plainText.length) {
      newSpans.push({ text: plainText.slice(selection.end) });
    }
    
    onChange({ spans: newSpans });
    setShowToolbar(false);
    setSelection(null);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const Component = tag;

  return (
    <div className="relative">
      <Component
        ref={editorRef}
        className={`outline-none focus:ring-0 ${className}`}
        contentEditable
        suppressContentEditableWarning={true}
        onFocus={() => setIsEditing(true)}
        onBlur={() => {
          setIsEditing(false);
          setShowToolbar(false);
        }}
        onInput={(e) => {
          const target = e.target as HTMLElement;
          handleTextChange(target.textContent || '');
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        dangerouslySetInnerHTML={{
          __html: getPlainText() || `<span class="text-slate-400">${placeholder}</span>`
        }}
      />

      {showToolbar && (
        <TextFormattingToolbar
          position={toolbarPosition}
          onFormat={applyFormatting}
          onClose={() => setShowToolbar(false)}
        />
      )}
    </div>
  );
}