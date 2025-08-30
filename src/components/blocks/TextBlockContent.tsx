'use client';

import { useState } from 'react';
import { ContentBlock, RichText, ProjectSettings } from '@/lib/types';
import SlateEditor from '@/components/SlateEditor';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';
import OverlayCommentModal from '@/components/OverlayCommentModal';
import OverlayCommentIndicator from '@/components/OverlayCommentIndicator';
import { useOverlayComment } from '@/hooks/useOverlayComment';

interface TextBlockContentProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  projectSettings?: ProjectSettings | null;
}

export default function TextBlockContent({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  projectSettings
}: TextBlockContentProps) {
  const textContent = block.content.textContent || { spans: [{ text: '', style: undefined }] };
  const backTextContent = block.content.rückseiteTextContent || { spans: [{ text: '', style: undefined }] };
  const [showSettings, setShowSettings] = useState(false);
  const overlayComment = useOverlayComment(block, onUpdate);

  const handleTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        textContent: newText
      }
    });
  };

  const handleBackTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        rückseiteTextContent: newText
      }
    });
  };

  const handleFlip = () => {
    onUpdate({
      ...block,
      isFlipped: !block.isFlipped
    });
  };

  return (
    <div 
      className={`group relative py-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Side indicator for Rückseite */}
      {block.hasRückseite && (
        <div className="absolute -left-6 top-2 text-xs text-slate-400 font-mono">
          {block.isFlipped ? 'R' : 'V'}
        </div>
      )}
      
      {/* Overlay Comment Indicator */}
      <OverlayCommentIndicator
        hasComment={!!block.overlayComment}
        onClick={() => overlayComment.setShowOverlayComment(true)}
      />

      {/* Settings button and flip button */}
      <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
        {/* Flip button */}
        {block.hasRückseite && (
          <button
            onClick={handleFlip}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Flip card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Block settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {showSettings && (
          <BlockSettingsMenu
            block={block}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onClose={() => setShowSettings(false)}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onAddOverlayComment={overlayComment.handleAddOverlayComment}
          />
        )}
      </div>

      {/* Text block with rich text editor */}
      <div className={`rounded-lg border-2 border-slate-200 dark:border-slate-600 ${
        block.content.backgroundColor ? 
          `bg-${block.content.backgroundColor}-50 dark:bg-${block.content.backgroundColor}-900/20` : 
          'bg-slate-50 dark:bg-slate-800/50'
      } ${block.content.fixedHeight ? 'overflow-y-auto' : ''}`}
      style={block.content.fixedHeight ? { height: `${block.content.fixedHeight}px` } : undefined}>
        {!block.hasRückseite || !block.isFlipped ? (
          <SlateEditor
            key={`front-${block.id}`}
            content={textContent}
            onChange={handleTextChange}
            placeholder="Write your longer text content here. This block is perfect for paragraphs, detailed explanations, and extended writing..."
            className={`${block.content.backgroundColor ? 
              `bg-${block.content.backgroundColor}-50 dark:bg-${block.content.backgroundColor}-900/20` : 
              'bg-slate-50 dark:bg-slate-800/50'
            } ${block.content.fixedHeight ? 'h-full border-0 rounded-lg' : ''}`}
            multiline={true}
            blockId={block.id}
            composableId={block.composableId}
            projectSettings={projectSettings}
          />
        ) : (
          <SlateEditor
            key={`back-${block.id}`}
            content={backTextContent}
            onChange={handleBackTextChange}
            placeholder="Write back side content here..."
            className={`${block.content.backgroundColor ? 
              `bg-${block.content.backgroundColor}-50 dark:bg-${block.content.backgroundColor}-900/20` : 
              'bg-slate-50 dark:bg-slate-800/50'
            } ${block.content.fixedHeight ? 'h-full border-0 rounded-lg' : ''}`}
            multiline={true}
            blockId={block.id}
            composableId={block.composableId}
            projectSettings={projectSettings}
          />
        )}
      </div>

      {/* Overlay Comment Modal */}
      <OverlayCommentModal
        isOpen={overlayComment.showOverlayComment || overlayComment.editingOverlayComment}
        isEditing={overlayComment.editingOverlayComment}
        commentText={overlayComment.overlayCommentText}
        onCommentTextChange={overlayComment.setOverlayCommentText}
        onSave={overlayComment.handleSaveOverlayComment}
        onCancel={overlayComment.handleCancelOverlayComment}
        onEdit={() => overlayComment.setEditingOverlayComment(true)}
        onDelete={overlayComment.handleDeleteOverlayComment}
        onClose={() => {
          overlayComment.setShowOverlayComment(false);
          overlayComment.setEditingOverlayComment(false);
        }}
      />
    </div>
  );
}