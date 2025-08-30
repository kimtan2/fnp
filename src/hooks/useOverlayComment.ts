'use client';

import { useState } from 'react';
import { ContentBlock } from '@/lib/types';

export function useOverlayComment(block: ContentBlock, onUpdate: (block: ContentBlock) => void) {
  const [showOverlayComment, setShowOverlayComment] = useState(false);
  const [editingOverlayComment, setEditingOverlayComment] = useState(false);
  const [overlayCommentText, setOverlayCommentText] = useState(block.overlayComment || '');

  const handleAddOverlayComment = () => {
    setEditingOverlayComment(true);
  };

  const handleSaveOverlayComment = () => {
    onUpdate({
      ...block,
      overlayComment: overlayCommentText
    });
    setEditingOverlayComment(false);
  };

  const handleCancelOverlayComment = () => {
    setOverlayCommentText(block.overlayComment || '');
    setEditingOverlayComment(false);
  };

  const handleDeleteOverlayComment = () => {
    onUpdate({
      ...block,
      overlayComment: undefined
    });
    setOverlayCommentText('');
    setShowOverlayComment(false);
  };

  return {
    showOverlayComment,
    setShowOverlayComment,
    editingOverlayComment,
    setEditingOverlayComment,
    overlayCommentText,
    setOverlayCommentText,
    handleAddOverlayComment,
    handleSaveOverlayComment,
    handleCancelOverlayComment,
    handleDeleteOverlayComment
  };
}