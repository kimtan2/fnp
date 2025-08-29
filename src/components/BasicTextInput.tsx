'use client';

import { useState, useEffect } from 'react';
import { RichText } from '@/lib/types';

interface BasicTextInputProps {
  content: RichText;
  onChange: (content: RichText) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'div';
}

export default function BasicTextInput({
  content,
  onChange,
  placeholder = 'Type something...',
  className = '',
  multiline = false,
  tag = 'div'
}: BasicTextInputProps) {
  // Get plain text from content
  const getPlainText = () => {
    return content.spans?.map(span => span.text).join('') || '';
  };

  const [text, setText] = useState(getPlainText());

  // Update local text when content changes from outside
  useEffect(() => {
    const plainText = getPlainText();
    if (plainText !== text) {
      setText(plainText);
    }
  }, [content.spans]);

  const handleChange = (newText: string) => {
    setText(newText);
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

  // Use appropriate input element based on requirements
  if (multiline) {
    return (
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`resize-none border-none outline-none bg-transparent ${className}`}
        style={{ minHeight: '120px' }}
      />
    );
  }

  // For headers, use appropriate heading tag with input styling
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
    const Component = tag;
    return (
      <Component className={className}>
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border-none outline-none bg-transparent font-inherit text-inherit"
        />
      </Component>
    );
  }

  // Default: simple text input
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full border-none outline-none bg-transparent ${className}`}
    />
  );
}