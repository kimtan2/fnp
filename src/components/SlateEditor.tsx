'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms, Text, Range } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { RichText, TextStyle, Comment, ProjectSettings } from '@/lib/types';
import { unifiedDB } from '@/lib/unified-db';
import CommentModal from './CommentModal';
import CommentViewer from './CommentViewer';

interface SlateEditorProps {
  content: RichText;
  onChange: (content: RichText) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  blockId?: string;
  composableId?: string;
  projectSettings?: ProjectSettings | null;
}

interface CustomElement {
  type: 'paragraph';
  children: CustomText[];
}

interface CustomText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  link?: string;
  commentId?: string;
}

declare module 'slate' {
  interface CustomTypes {
    Editor: Editor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const withCustom = (editor: Editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (SlateElement.isElement(node) && node.type !== 'paragraph') {
      Transforms.setNodes(editor, { type: 'paragraph' }, { at: path });
      return;
    }

    normalizeNode(entry);
  };

  return editor;
};

const Element = ({ attributes, children }: RenderElementProps) => {
  return <p {...attributes}>{children}</p>;
};

const Leaf = ({ attributes, children, leaf, comments }: RenderLeafProps & { comments?: Comment[] }) => {
  const style: React.CSSProperties = {};
  
  if (leaf.bold) {
    style.fontWeight = 'bold';
  }
  
  if (leaf.italic) {
    style.fontStyle = 'italic';
  }
  
  if (leaf.underline) {
    style.textDecoration = style.textDecoration ? `${style.textDecoration} underline` : 'underline';
  }
  
  if (leaf.strikethrough) {
    style.textDecoration = style.textDecoration ? `${style.textDecoration} line-through` : 'line-through';
  }

  if (leaf.color) {
    style.color = leaf.color;
  }

  if (leaf.code) {
    return (
      <code 
        {...attributes}
        className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono"
        style={style}
      >
        {children}
      </code>
    );
  }

  if (leaf.link) {
    let linkClassName = 'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer';
    const linkStyle = { ...style };
    
    if (leaf.commentId) {
      const comment = comments?.find((c: Comment) => c.id === leaf.commentId);
      const commentColor = comment?.color || '#FEF08A';
      linkClassName += ' border-b-2';
      linkStyle.backgroundColor = `${commentColor}40`;
      linkStyle.borderBottomColor = commentColor;
    }
    
    return (
      <a 
        {...attributes}
        href={leaf.link}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        style={linkStyle}
        data-comment-id={leaf.commentId}
      >
        {children}
      </a>
    );
  }

  if (leaf.commentId) {
    const comment = comments?.find((c: Comment) => c.id === leaf.commentId);
    const commentColor = comment?.color || '#FEF08A';
    
    
    return (
      <span 
        {...attributes} 
        className="cursor-pointer border-b-2 transition-colors"
        style={{
          ...style,
          backgroundColor: `${commentColor}40`,
          borderBottomColor: commentColor
        }}
        data-comment-id={leaf.commentId}
        title="Click to view comment"
      >
        {children}
      </span>
    );
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

const ToolbarButton = ({ 
  active, 
  onToggle, 
  children, 
  title 
}: { 
  active: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    title={title}
    className={`p-1.5 rounded text-sm font-medium transition-colors ${
      active 
        ? 'bg-slate-600 text-white' 
        : 'text-slate-300 hover:bg-slate-600 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const FloatingToolbar = ({ 
  editor, 
  blockId, 
  composableId, 
  projectSettings,
  onCommentCreate 
}: { 
  editor: Editor;
  blockId?: string;
  composableId?: string;
  projectSettings?: ProjectSettings | null;
  onCommentCreate?: (selectedText: string, textPosition: { start: number; end: number }) => void;
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const isBoldActive = () => {
    const marks = Editor.marks(editor);
    return marks?.bold === true;
  };

  const isItalicActive = () => {
    const marks = Editor.marks(editor);
    return marks?.italic === true;
  };

  const isUnderlineActive = () => {
    const marks = Editor.marks(editor);
    return marks?.underline === true;
  };

  const isStrikethroughActive = () => {
    const marks = Editor.marks(editor);
    return marks?.strikethrough === true;
  };

  const isCodeActive = () => {
    const marks = Editor.marks(editor);
    return marks?.code === true;
  };

  const isColorActive = (color: string) => {
    const marks = Editor.marks(editor);
    return marks?.color === color;
  };

  const isLinkActive = () => {
    const marks = Editor.marks(editor);
    return !!marks?.link;
  };

  const toggleFormat = (format: keyof CustomText) => {
    const isActive = Editor.marks(editor)?.[format] === true;
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const toggleColor = (color: string) => {
    const currentColor = Editor.marks(editor)?.color;
    if (currentColor === color) {
      Editor.removeMark(editor, 'color');
    } else {
      Editor.addMark(editor, 'color', color);
    }
    setShowColorPicker(false);
  };

  const toggleLink = () => {
    const currentLink = Editor.marks(editor)?.link;
    if (currentLink) {
      Editor.removeMark(editor, 'link');
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      setLinkUrl('');
      setShowLinkInput(true);
    }
  };

  const applyLink = () => {
    if (linkUrl.trim()) {
      let url = linkUrl.trim();
      // Add https:// if no protocol is specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      Editor.addMark(editor, 'link', url);
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleComment = () => {
    const { selection } = editor;
    if (!selection || Range.isCollapsed(selection) || !onCommentCreate || !blockId || !composableId) {
      return;
    }

    const selectedText = Editor.string(editor, selection);
    if (!selectedText.trim()) return;

    // Calculate text position within the block
    const start = selection.anchor.offset;
    const end = selection.focus.offset;
    const textPosition = {
      start: Math.min(start, end),
      end: Math.max(start, end)
    };

    onCommentCreate(selectedText, textPosition);
  };

  useEffect(() => {
    const updateToolbar = () => {
      const { selection } = editor;
      const toolbar = toolbarRef.current;

      if (!toolbar) return;

      if (
        !selection ||
        !ReactEditor.isFocused(editor) ||
        Range.isCollapsed(selection) ||
        Editor.string(editor, selection) === ''
      ) {
        setVisible(false);
        setShowColorPicker(false);
        setShowLinkInput(false);
        return;
      }

      const domSelection = window.getSelection();
      const domRange = domSelection?.getRangeAt(0);
      const rect = domRange?.getBoundingClientRect();

      if (rect) {
        setVisible(true);
        toolbar.style.opacity = '1';
        toolbar.style.top = `${rect.top + window.pageYOffset - toolbar.offsetHeight - 8}px`;
        toolbar.style.left = `${rect.left + window.pageXOffset - toolbar.offsetWidth / 2 + rect.width / 2}px`;
      }
    };

    // Update toolbar position on selection change
    const handleSelectionChange = () => {
      setTimeout(updateToolbar, 0);
    };

    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
        setShowLinkInput(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also update on editor changes
    updateToolbar();

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editor]);

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-50 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg border border-slate-600 p-1 flex items-center gap-1 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ top: '-1000px', left: '-1000px' }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
    >
      <ToolbarButton
        active={isBoldActive()}
        onToggle={() => toggleFormat('bold')}
        title="Bold (⌘+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      
      <ToolbarButton
        active={isItalicActive()}
        onToggle={() => toggleFormat('italic')}
        title="Italic (⌘+I)"
      >
        <em>I</em>
      </ToolbarButton>
      
      <ToolbarButton
        active={isUnderlineActive()}
        onToggle={() => toggleFormat('underline')}
        title="Underline (⌘+U)"
      >
        <u>U</u>
      </ToolbarButton>
      
      <ToolbarButton
        active={isStrikethroughActive()}
        onToggle={() => toggleFormat('strikethrough')}
        title="Strikethrough (⌘+Shift+X)"
      >
        <s>S</s>
      </ToolbarButton>

      <div className="w-px h-4 bg-slate-500 mx-1" />
      
      <ToolbarButton
        active={isCodeActive()}
        onToggle={() => toggleFormat('code')}
        title="Inline Code (⌘+E)"
      >
        <code className="font-mono text-xs">&lt;/&gt;</code>
      </ToolbarButton>

      <div className="w-px h-4 bg-slate-500 mx-1" />

      {/* Color picker */}
      <div className="relative">
        <ToolbarButton
          active={showColorPicker || !!Editor.marks(editor)?.color}
          onToggle={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h16M7 21v-4a2 2 0 012-2h4a2 2 0 012 2v4M7 5h16" />
          </svg>
        </ToolbarButton>
        
        {showColorPicker && (
          <div className="absolute top-8 left-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-1">
            <button
              onClick={() => toggleColor('#ef4444')}
              className={`w-6 h-6 rounded bg-red-500 border-2 ${
                isColorActive('#ef4444') ? 'border-white' : 'border-slate-600'
              }`}
              title="Red"
            />
            <button
              onClick={() => toggleColor('#eab308')}
              className={`w-6 h-6 rounded bg-yellow-500 border-2 ${
                isColorActive('#eab308') ? 'border-white' : 'border-slate-600'
              }`}
              title="Yellow"
            />
            <button
              onClick={() => toggleColor('#22c55e')}
              className={`w-6 h-6 rounded bg-green-500 border-2 ${
                isColorActive('#22c55e') ? 'border-white' : 'border-slate-600'
              }`}
              title="Green"
            />
            <button
              onClick={() => {
                Editor.removeMark(editor, 'color');
                setShowColorPicker(false);
              }}
              className="w-6 h-6 rounded bg-slate-400 border-2 border-slate-600 flex items-center justify-center"
              title="Remove Color"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Link button */}
      <div className="relative">
        <ToolbarButton
          active={isLinkActive()}
          onToggle={toggleLink}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>

        {showLinkInput && (
          <div className="absolute top-8 left-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-2 min-w-[200px]">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-2 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyLink();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              autoFocus
            />
            <button
              onClick={applyLink}
              className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              ✓
            </button>
          </div>
        )}
      </div>

      {/* Comment button */}
      {blockId && composableId && projectSettings && (
        <>
          <div className="w-px h-4 bg-slate-500 mx-1" />
          <ToolbarButton
            active={false}
            onToggle={handleComment}
            title="Add Comment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ToolbarButton>
        </>
      )}
    </div>
  );
};

export default function SlateEditor({
  content,
  onChange,
  placeholder = 'Type something...',
  className = '',
  multiline = false,
  blockId,
  composableId,
  projectSettings
}: SlateEditorProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [viewerComments, setViewerComments] = useState<Comment[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCommentViewer, setShowCommentViewer] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedTextPosition, setSelectedTextPosition] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [editingComment, setEditingComment] = useState<Comment | undefined>();

  const editor = useMemo(
    () => withCustom(withHistory(withReact(createEditor()))),
    []
  );

  const convertRichTextToSlate = useCallback((richText: RichText): Descendant[] => {
    if (!richText.spans || richText.spans.length === 0) {
      return [{ type: 'paragraph', children: [{ text: '' }] }];
    }

    // Group spans by paragraphs (split by newlines)
    const paragraphs: CustomElement[] = [];
    let currentParagraph: CustomText[] = [];

    for (const span of richText.spans) {
      const textParts = span.text.split('\n');
      
      for (let i = 0; i < textParts.length; i++) {
        const part = textParts[i];
        
        if (part || i === 0) { // Include empty parts except the first one after a split
          currentParagraph.push({
            text: part,
            bold: span.style?.bold,
            italic: span.style?.italic,
            underline: span.style?.underline,
            strikethrough: span.style?.strikethrough,
            code: span.style?.code,
            color: span.style?.color,
            link: span.style?.link,
            commentId: span.style?.commentId,
          });
        }
        
        // If this isn't the last part, we have a newline, so finish this paragraph
        if (i < textParts.length - 1) {
          paragraphs.push({
            type: 'paragraph',
            children: currentParagraph.length > 0 ? currentParagraph : [{ text: '' }]
          });
          currentParagraph = [];
        }
      }
    }

    // Add the final paragraph
    if (currentParagraph.length > 0 || paragraphs.length === 0) {
      paragraphs.push({
        type: 'paragraph',
        children: currentParagraph.length > 0 ? currentParagraph : [{ text: '' }]
      });
    }

    return paragraphs;
  }, []);

  const convertSlateToRichText = useCallback((nodes: Descendant[]): RichText => {
    const spans: Array<{ text: string; style?: TextStyle }> = [];
    
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const node = nodes[nodeIndex];
      
      if (SlateElement.isElement(node)) {
        for (const child of node.children) {
          if (Text.isText(child)) {
            const style: TextStyle = {};
            if (child.bold) style.bold = true;
            if (child.italic) style.italic = true;
            if (child.underline) style.underline = true;
            if (child.strikethrough) style.strikethrough = true;
            if (child.code) style.code = true;
            if (child.color) style.color = child.color;
            if (child.link) style.link = child.link;
            if (child.commentId) style.commentId = child.commentId;

            spans.push({
              text: child.text,
              style: Object.keys(style).length > 0 ? style : undefined
            });
          }
        }
        
        // Add newline after each paragraph except the last one
        if (nodeIndex < nodes.length - 1) {
          spans.push({
            text: '\n',
            style: undefined
          });
        }
      }
    }

    // Ensure we always have at least one span
    if (spans.length === 0) {
      spans.push({ text: '', style: undefined });
    }

    return { spans };
  }, []);

  const initialValue = useMemo(() => convertRichTextToSlate(content), [content, convertRichTextToSlate]);
  
  // Create a stable key based on content to force re-render when content structure changes significantly
  const editorKey = useMemo(() => {
    return JSON.stringify(content.spans?.map(s => ({ text: s.text, hasStyle: !!s.style })) || []);
  }, [content]);

  // Load comments when blockId changes
  useEffect(() => {
    const loadComments = async () => {
      if (blockId) {
        try {
          const blockComments = await unifiedDB.getCommentsByBlock(blockId);
          setComments(blockComments);
        } catch (error) {
          console.error('Failed to load comments:', error);
        }
      }
    };

    loadComments();
  }, [blockId]);

  const handleCommentCreate = (selectedText: string, textPosition: { start: number; end: number }) => {
    setSelectedText(selectedText);
    setSelectedTextPosition(textPosition);
    setEditingComment(undefined);
    setShowCommentModal(true);
  };

  const handleCommentSave = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingComment) {
        // Update existing comment
        const updatedComment = { ...editingComment, ...commentData };
        await unifiedDB.updateComment(updatedComment);
        setComments(comments.map(c => c.id === editingComment.id ? updatedComment : c));
      } else {
        // Create new comment
        const newComment = await unifiedDB.addComment(commentData);
        setComments([...comments, newComment]);
        
        // Add commentId to the selected text
        const { selection } = editor;
        if (selection) {
          Editor.addMark(editor, 'commentId', newComment.id);
        }
      }
      setShowCommentModal(false);
    } catch (error) {
      console.error('Failed to save comment:', error);
    }
  };

  const handleCommentEdit = (comment: Comment) => {
    setEditingComment(comment);
    
    // Get the selected text based on comment position
    const textSpans = content.spans || [];
    let currentPos = 0;
    let selectedText = '';
    
    for (const span of textSpans) {
      const spanEnd = currentPos + span.text.length;
      if (comment.position && currentPos <= comment.position.start && spanEnd >= comment.position.end) {
        const startInSpan = Math.max(0, comment.position.start - currentPos);
        const endInSpan = Math.min(span.text.length, comment.position.end - currentPos);
        selectedText = span.text.substring(startInSpan, endInSpan);
        break;
      }
      currentPos = spanEnd;
    }
    
    setSelectedText(selectedText);
    setSelectedTextPosition(comment.position || { start: 0, end: 0 });
    setShowCommentModal(true);
    setShowCommentViewer(false); // Close the viewer when editing
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      await unifiedDB.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      setViewerComments(viewerComments.filter(c => c.id !== commentId));
      
      // Remove commentId from text
      // This would require more complex logic to find and remove the mark
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleCommentResolve = async (commentId: string, resolved: boolean) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const updatedComment = { ...comment, resolved };
        await unifiedDB.updateComment(updatedComment);
        setComments(comments.map(c => c.id === commentId ? updatedComment : c));
        setViewerComments(viewerComments.map(c => c.id === commentId ? updatedComment : c));
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleCommentClick = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    
    if (comment) {
      const commentsForText = comments.filter(c => 
        c.position?.start === comment.position?.start && 
        c.position?.end === comment.position?.end
      );
      
      // Get the selected text based on comment position
      const textSpans = content.spans || [];
      let currentPos = 0;
      let selectedText = '';
      
      for (const span of textSpans) {
        const spanEnd = currentPos + span.text.length;
        if (comment.position && currentPos <= comment.position.start && spanEnd >= comment.position.end) {
          const startInSpan = Math.max(0, comment.position.start - currentPos);
          const endInSpan = Math.min(span.text.length, comment.position.end - currentPos);
          selectedText = span.text.substring(startInSpan, endInSpan);
          break;
        }
        currentPos = spanEnd;
      }

      setSelectedText(selectedText);
      setSelectedTextPosition(comment.position || { start: 0, end: 0 });
      setViewerComments(commentsForText);
      setShowCommentViewer(true);
    }
  };

  const handleAddCommentFromViewer = () => {
    // Close the viewer and open the comment modal to add a new comment
    // Use the current selectedText and selectedTextPosition from the viewer context
    setShowCommentViewer(false);
    setEditingComment(undefined);
    setShowCommentModal(true);
  };

  const handleChange = useCallback((value: Descendant[]) => {
    const newContent = convertSlateToRichText(value);
    onChange(newContent);
  }, [onChange, convertSlateToRichText]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!event.metaKey && !event.ctrlKey) {
      return;
    }

    switch (event.key) {
      case 'b': {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.bold === true;
        if (isActive) {
          Editor.removeMark(editor, 'bold');
        } else {
          Editor.addMark(editor, 'bold', true);
        }
        break;
      }
      case 'i': {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.italic === true;
        if (isActive) {
          Editor.removeMark(editor, 'italic');
        } else {
          Editor.addMark(editor, 'italic', true);
        }
        break;
      }
      case 'u': {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.underline === true;
        if (isActive) {
          Editor.removeMark(editor, 'underline');
        } else {
          Editor.addMark(editor, 'underline', true);
        }
        break;
      }
      case 'e': {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.code === true;
        if (isActive) {
          Editor.removeMark(editor, 'code');
        } else {
          Editor.addMark(editor, 'code', true);
        }
        break;
      }
      case 'x': {
        if (event.shiftKey) {
          event.preventDefault();
          const isActive = Editor.marks(editor)?.strikethrough === true;
          if (isActive) {
            Editor.removeMark(editor, 'strikethrough');
          } else {
            Editor.addMark(editor, 'strikethrough', true);
          }
        }
        break;
      }
      case 'k': {
        event.preventDefault();
        const currentLink = Editor.marks(editor)?.link;
        if (currentLink) {
          Editor.removeMark(editor, 'link');
        } else {
          // You could implement a more sophisticated link dialog here
          const url = prompt('Enter URL:');
          if (url) {
            let formattedUrl = url.trim();
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
              formattedUrl = 'https://' + formattedUrl;
            }
            Editor.addMark(editor, 'link', formattedUrl);
          }
        }
        break;
      }
    }

    if (!multiline && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
    }
  }, [editor, multiline]);

  return (
    <>
      <div 
        className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden ${className || 'bg-white dark:bg-slate-900'}`}
        onClick={(e) => {
          // Handle clicks on commented text
          const target = e.target as HTMLElement;
          const commentId = target.getAttribute('data-comment-id') || 
                           target.closest('[data-comment-id]')?.getAttribute('data-comment-id');
          if (commentId) {
            e.preventDefault();
            e.stopPropagation();
            handleCommentClick(commentId);
          }
        }}
      >
        <div className="p-3 relative">
          <Slate 
            key={editorKey}
            editor={editor} 
            initialValue={initialValue}
            onChange={handleChange}
          >
            <FloatingToolbar 
              editor={editor} 
              blockId={blockId}
              composableId={composableId}
              projectSettings={projectSettings}
              onCommentCreate={handleCommentCreate}
            />
            <div className="relative">
              <Editable
                renderElement={Element}
                renderLeaf={(props) => <Leaf {...props} comments={comments} />}
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => {
                  // Handle clicks on commented text
                  const target = e.target as HTMLElement;
                  const commentId = target.getAttribute('data-comment-id') || 
                                   target.closest('[data-comment-id]')?.getAttribute('data-comment-id');
                  if (commentId) {
                    // Use setTimeout to allow the click to complete first
                    setTimeout(() => {
                      handleCommentClick(commentId);
                    }, 0);
                  }
                }}
                className={`outline-none resize-none w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 ${multiline ? 'min-h-[120px]' : ''}`}
                style={{
                  lineHeight: '1.5',
                }}
              />
              
              {/* Comment indicators on the right */}
              <div className="absolute right-0 top-0 flex flex-col gap-2 pointer-events-none pr-2 pt-1">
                {comments.filter(comment => comment.showIndicator).map((comment) => (
                  <div
                    key={comment.id}
                    className="w-6 h-6 rounded-full border-2 border-slate-400 dark:border-slate-500 shadow-md"
                    style={{ backgroundColor: comment.color || '#FEF08A' }}
                    title={`Comment by ${comment.authorName}: ${comment.content.substring(0, 50)}...`}
                  />
                ))}
              </div>
            </div>
          </Slate>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && blockId && composableId && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          onSave={handleCommentSave}
          selectedText={selectedText}
          blockId={blockId}
          composableId={composableId}
          projectSettings={projectSettings}
          existingComment={editingComment}
          textPosition={selectedTextPosition}
        />
      )}

      {/* Comment Viewer */}
      {showCommentViewer && (
        <CommentViewer
          comments={viewerComments}
          isOpen={showCommentViewer}
          onClose={() => setShowCommentViewer(false)}
          onEditComment={handleCommentEdit}
          onDeleteComment={handleCommentDelete}
          onResolveComment={handleCommentResolve}
          onAddComment={handleAddCommentFromViewer}
          selectedText={selectedText}
        />
      )}
    </>
  );
}