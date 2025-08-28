'use client';

import { useState, useCallback } from 'react';
import { ContentBlock, BlockType } from '@/lib/content';
import HeaderBlock from '@/components/blocks/HeaderBlock';
import TextBlock from '@/components/blocks/TextBlock';
import ListBlock from '@/components/blocks/ListBlock';
import DividerBlock from '@/components/blocks/DividerBlock';
import CollapsibleListBlock from '@/components/blocks/CollapsibleListBlock';
import TextBlockContent from '@/components/blocks/TextBlockContent';
import AddBlockMenu from '@/components/AddBlockMenu';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onAddBlock: (type: BlockType, position?: number) => void;
  onUpdateBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onReorderBlocks: (newOrder: string[]) => void;
}

export default function BlockEditor({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks
}: BlockEditorProps) {
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<{ position: number; show: boolean }>({ position: -1, show: false });

  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    setDragOverPosition(position);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropPosition: number) => {
    e.preventDefault();
    
    if (!draggedBlockId) return;

    const draggedBlock = blocks.find(b => b.id === draggedBlockId);
    if (!draggedBlock) return;

    const newBlocks = [...blocks];
    const draggedIndex = newBlocks.findIndex(b => b.id === draggedBlockId);
    
    // Remove dragged block from its current position
    newBlocks.splice(draggedIndex, 1);
    
    // Insert at new position
    const adjustedDropPosition = draggedIndex < dropPosition ? dropPosition - 1 : dropPosition;
    newBlocks.splice(adjustedDropPosition, 0, draggedBlock);
    
    // Update order
    const newOrder = newBlocks.map(b => b.id);
    onReorderBlocks(newOrder);
    
    setDraggedBlockId(null);
    setDragOverPosition(null);
  }, [blocks, draggedBlockId, onReorderBlocks]);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverPosition(null);
  }, []);

  const renderBlock = (block: ContentBlock, index: number) => {
    const commonProps = {
      key: block.id,
      block,
      onUpdate: onUpdateBlock,
      onDelete: () => onDeleteBlock(block.id),
      onDragStart: () => handleDragStart(block.id),
      onDragEnd: handleDragEnd,
      isDragging: draggedBlockId === block.id
    };

    let BlockComponent;
    switch (block.type) {
      case 'header':
        BlockComponent = HeaderBlock;
        break;
      case 'text':
        BlockComponent = TextBlock;
        break;
      case 'list':
        BlockComponent = ListBlock;
        break;
      case 'divider':
        BlockComponent = DividerBlock;
        break;
      case 'collapsible-list':
        BlockComponent = CollapsibleListBlock;
        break;
      case 'text-block':
        BlockComponent = TextBlockContent;
        break;
      default:
        return null;
    }

    return (
      <div key={block.id} className="relative group">
        {/* Drop indicator */}
        <div
          className={`absolute inset-x-0 -top-1 h-0.5 bg-blue-500 transition-opacity ${
            dragOverPosition === index ? 'opacity-100' : 'opacity-0'
          }`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        />
        
        {/* Add block button */}
        <div 
          className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseEnter={() => setShowAddMenu({ position: index, show: true })}
          onMouseLeave={() => setShowAddMenu({ position: -1, show: false })}
        >
          <button
            className="w-6 h-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            onClick={() => setShowAddMenu({ position: index, show: !showAddMenu.show })}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {showAddMenu.show && showAddMenu.position === index && (
            <AddBlockMenu
              onAddBlock={(type) => {
                onAddBlock(type, index);
                setShowAddMenu({ position: -1, show: false });
              }}
              onClose={() => setShowAddMenu({ position: -1, show: false })}
            />
          )}
        </div>

        <BlockComponent {...commonProps} />
      </div>
    );
  };

  return (
    <div className="space-y-4 min-h-screen">
      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-slate-400 dark:text-slate-500 mb-6">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Start creating your content</p>
            <p className="text-sm">Click the button below to add your first block</p>
          </div>
          <button
            onClick={() => onAddBlock('text')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add your first block
          </button>
        </div>
      )}

      {/* Render blocks */}
      {blocks.map(renderBlock)}

      {/* Final drop area */}
      {blocks.length > 0 && (
        <div
          className={`h-8 border-2 border-dashed transition-colors ${
            dragOverPosition === blocks.length 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          onDragOver={(e) => handleDragOver(e, blocks.length)}
          onDrop={(e) => handleDrop(e, blocks.length)}
        />
      )}

      {/* Add block at end */}
      <div className="flex items-center justify-center py-8">
        <button
          onClick={() => setShowAddMenu({ position: blocks.length, show: !showAddMenu.show })}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors relative"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          
          {showAddMenu.show && showAddMenu.position === blocks.length && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
              <AddBlockMenu
                onAddBlock={(type) => {
                  onAddBlock(type);
                  setShowAddMenu({ position: -1, show: false });
                }}
                onClose={() => setShowAddMenu({ position: -1, show: false })}
              />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}