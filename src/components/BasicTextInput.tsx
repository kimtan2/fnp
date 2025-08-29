'use client';

import { useState, useEffect, useRef } from 'react';
import { RichText } from '@/lib/types';

interface BasicTextInputProps {
  content: RichText;
  onChange: (content: RichText) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'div';
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export default function BasicTextInput({
  content,
  onChange,
  placeholder = 'Type something...',
  className = '',
  multiline = false,
  tag = 'div',
  onKeyDown
}: BasicTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousContentRef = useRef<string>('');
  
  // Get plain text from content
  const getPlainText = () => {
    return content.spans?.map(span => span.text).join('') || '';
  };

  const [text, setText] = useState(getPlainText());

  // Update local text when content changes from outside
  useEffect(() => {
    const plainText = getPlainText();
    const contentString = JSON.stringify(content.spans);
    
    // Only update if content actually changed from outside (not from user typing)
    if (contentString !== previousContentRef.current && plainText !== text) {
      setText(plainText);
    }
    previousContentRef.current = contentString;
  }, [content]);

  const handleChange = (newText: string) => {
    setText(newText);
    const newContent: RichText = {
      spans: newText ? [{ text: newText }] : []
    };
    onChange(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Call parent onKeyDown first if provided
    if (onKeyDown) {
      onKeyDown(e);
      // If parent prevented default, don't continue
      if (e.defaultPrevented) {
        return;
      }
    }
    
    // Allow Shift+Enter for new lines, prevent Enter alone if not multiline
    if (e.key === 'Enter') {
      if (multiline && e.shiftKey) {
        // Allow Shift+Enter for new line
        return;
      } else if (!multiline) {
        e.preventDefault();
      }
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 40)}px`;
  };

  // Effect to adjust textarea height when content changes
  useEffect(() => {
    if (textareaRef.current && (multiline || text.includes('\n'))) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [text, multiline]);

  // Use textarea for multiline or when text contains newlines
  if (multiline || text.includes('\n')) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          handleChange(e.target.value);
          adjustTextareaHeight(e.target);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none border-none outline-none bg-transparent w-full ${className}`}
        style={{ 
          minHeight: multiline ? '120px' : '40px',
          overflow: 'hidden'
        }}
        onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
      />
    );
  }

  // For headers, use appropriate heading tag with input styling
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
    const HeadingComponent = tag as 'h1' | 'h2' | 'h3';
    return (
      <HeadingComponent className={`${className} m-0 p-0`}>
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border-none outline-none bg-transparent font-inherit text-inherit placeholder-slate-400 dark:placeholder-slate-500"
        />
      </HeadingComponent>
    );
  }

  // Default: text input that can become textarea if needed
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full border-none outline-none bg-transparent placeholder-slate-400 dark:placeholder-slate-500 ${className}`}
    />
  );
}