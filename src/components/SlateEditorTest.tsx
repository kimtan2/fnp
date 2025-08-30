'use client';

import { useState } from 'react';
import SlateEditor from './SlateEditor';
import { RichText } from '@/lib/types';

export default function SlateEditorTest() {
  const [content, setContent] = useState<RichText>({
    spans: [
      { text: 'This is a test with ' },
      { text: 'bold', style: { bold: true } },
      { text: ' and ' },
      { text: 'italic', style: { italic: true } },
      { text: ' text.' }
    ]
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Slate Editor Test</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Rich Text Editor:</h2>
        <SlateEditor
          content={content}
          onChange={setContent}
          placeholder="Type something with rich formatting..."
          multiline={true}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Keyboard Shortcuts:</h2>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li><kbd>⌘/Ctrl + B</kbd> - Bold</li>
          <li><kbd>⌘/Ctrl + I</kbd> - Italic</li>
          <li><kbd>⌘/Ctrl + U</kbd> - Underline</li>
          <li><kbd>⌘/Ctrl + Shift + X</kbd> - Strikethrough</li>
          <li><kbd>⌘/Ctrl + E</kbd> - Inline Code</li>
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Current Content (JSON):</h2>
        <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  );
}