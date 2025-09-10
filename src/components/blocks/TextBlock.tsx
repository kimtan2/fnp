'use client';

import { useState } from 'react';
import { ContentBlock, RichText, ProjectSettings } from '@/lib/types';
import SlateEditor from '@/components/SlateEditor';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';
import OverlayCommentModal from '@/components/OverlayCommentModal';
import OverlayCommentIndicator from '@/components/OverlayCommentIndicator';
import { useOverlayComment } from '@/hooks/useOverlayComment';

interface TextBlockProps {
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

export default function TextBlock({
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
}: TextBlockProps) {
  const text = block.content.text || { spans: [] };
  const backText = block.content.rückseiteTtext || { spans: [] };
  const [showSettings, setShowSettings] = useState(false);
  const overlayComment = useOverlayComment(block, onUpdate);

  const getStatusColor = (status: string) => {
    // Use custom color from settings if available
    const customColor = projectSettings?.statusColors?.[status];
    if (customColor) {
      return customColor;
    }
    
    // Fallback to hardcoded colors for legacy support
    switch (status.toLowerCase()) {
      case 'to-do':
        return '#6B7280';
      case 'sofort':
        return '#EF4444';
      case 'projekt':
        return '#3B82F6';
      case 'ministerium überwachung':
        return '#8B5CF6';
      // Legacy support
      case 'todo':
        return '#6B7280';
      case 'in progress':
        return '#F59E0B';
      case 'done':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  const handleTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        text: newText
      }
    });
  };

  const handleBackTextChange = (newText: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        rückseiteTtext: newText
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
      className={`relative flex items-start py-1 group ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Side indicator for Rückseite */}
      {block.hasRückseite && (
        <div className="absolute -left-6 top-0 text-xs text-slate-400 font-mono">
          {block.isFlipped ? 'R' : 'V'}
        </div>
      )}
      
      {/* Overlay Comment Indicator */}
      <OverlayCommentIndicator
        hasComment={!!block.overlayComment}
        onClick={() => overlayComment.setShowOverlayComment(true)}
      />

      {/* Status display (always visible) */}
      {block.status && (
        <div className="absolute -right-20 top-0">
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getStatusColor(block.status) }}
          >
            {block.status}
          </div>
        </div>
      )}

      {/* Settings button and flip button */}
      <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
        {/* Flip button */}
        {block.hasRückseite && (
          <button
            onClick={handleFlip}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Flip card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
            projectSettings={projectSettings}
          />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1">
        {!block.hasRückseite || !block.isFlipped ? (
          <SlateEditor
            content={text}
            onChange={handleTextChange}
            placeholder="Type something..."
            className="border-none bg-transparent"
            multiline={true}
            blockId={block.id}
            composableId={block.composableId}
            projectSettings={projectSettings}
          />
        ) : (
          <SlateEditor
            content={backText}
            onChange={handleBackTextChange}
            placeholder="Type back side content..."
            className="border-none bg-transparent"
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