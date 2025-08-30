'use client';

import { useState, useCallback } from 'react';
import { ContentBlock, RichText, BlockType } from '@/lib/types';
import BasicTextInput from '@/components/BasicTextInput';
import AddBlockMenu from '@/components/AddBlockMenu';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';

interface CollapsibleListBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onAddNestedBlock?: (parentBlockId: string, type: BlockType, position?: number) => void;
  onUpdateNestedBlock?: (nestedBlock: ContentBlock) => void;
  onDeleteNestedBlock?: (nestedBlockId: string) => void;
  onReorderNestedBlocks?: (parentBlockId: string, newOrder: string[]) => void;
  renderNestedBlock?: (block: ContentBlock, index: number, moveProps?: {
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  }) => React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export default function CollapsibleListBlock({
  block,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
  onAddNestedBlock,
  onUpdateNestedBlock,
  onDeleteNestedBlock,
  onReorderNestedBlocks,
  renderNestedBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: CollapsibleListBlockProps) {
  const title = block.content.title || { spans: [{ text: 'Toggle section' }] };
  const isExpanded = block.content.isExpanded ?? false;
  const nestedBlocks = block.content.nestedBlocks || [];
  const [showAddMenu, setShowAddMenu] = useState<{ position: number; show: boolean }>({ position: -1, show: false });
  const [showSettings, setShowSettings] = useState(false);

  const handleTitleChange = (newTitle: RichText) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        title: newTitle
      }
    });
  };

  const handleMoveNestedBlockUp = useCallback((nestedBlockId: string) => {
    const currentIndex = nestedBlocks.findIndex(nb => nb.id === nestedBlockId);
    if (currentIndex <= 0) return; // Can't move up if it's the first nested block
    
    const newNestedBlocks = [...nestedBlocks];
    [newNestedBlocks[currentIndex - 1], newNestedBlocks[currentIndex]] = [newNestedBlocks[currentIndex], newNestedBlocks[currentIndex - 1]];
    
    // Update positions
    newNestedBlocks.forEach((nb, index) => {
      nb.position = index;
    });
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        nestedBlocks: newNestedBlocks
      }
    });
  }, [nestedBlocks, block, onUpdate]);

  const handleMoveNestedBlockDown = useCallback((nestedBlockId: string) => {
    const currentIndex = nestedBlocks.findIndex(nb => nb.id === nestedBlockId);
    if (currentIndex >= nestedBlocks.length - 1) return; // Can't move down if it's the last nested block
    
    const newNestedBlocks = [...nestedBlocks];
    [newNestedBlocks[currentIndex], newNestedBlocks[currentIndex + 1]] = [newNestedBlocks[currentIndex + 1], newNestedBlocks[currentIndex]];
    
    // Update positions
    newNestedBlocks.forEach((nb, index) => {
      nb.position = index;
    });
    
    onUpdate({
      ...block,
      content: {
        ...block.content,
        nestedBlocks: newNestedBlocks
      }
    });
  }, [nestedBlocks, block, onUpdate]);

  const toggleExpanded = () => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        isExpanded: !isExpanded,
        nestedBlocks: nestedBlocks // Explicitly preserve nested blocks
      }
    });
  };

  const handleAddNestedBlock = (type: BlockType, position?: number) => {
    if (onAddNestedBlock) {
      onAddNestedBlock(block.id, type, position);
    }
    setShowAddMenu({ position: -1, show: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Auto-expand and add first block when user presses Enter
      if (!isExpanded) {
        toggleExpanded();
        setTimeout(() => {
          handleAddNestedBlock('text', 0);
        }, 100);
      }
    }
  };

  return (
    <div 
      className={`group relative py-1 ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >

      {/* Settings button */}
      <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          />
        )}
      </div>

      {/* Toggle header with triangle and title */}
      <div className="flex items-start space-x-1">
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 p-0.5 mt-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <svg 
            className={`w-3 h-3 text-slate-500 dark:text-slate-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <BasicTextInput
            content={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            placeholder="Toggle section"
            className="text-slate-800 dark:text-slate-200"
            tag="div"
          />
        </div>
      </div>

      {/* Nested blocks content - Notion style */}
      {isExpanded && (
        <div className="ml-4 mt-1">
          {/* Empty state for nested blocks */}
          {nestedBlocks.length === 0 && (
            <div className="group/empty py-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-6 flex justify-center">
                  <button
                    className="w-4 h-4 opacity-0 group-hover/empty:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm relative z-10"
                    onClick={() => setShowAddMenu({ position: 0, show: !showAddMenu.show })}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  {showAddMenu.show && showAddMenu.position === 0 && (
                    <div className="absolute top-6 left-0 z-50">
                      <AddBlockMenu
                        onAddBlock={(type) => handleAddNestedBlock(type, 0)}
                        onClose={() => setShowAddMenu({ position: -1, show: false })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 ml-2">
                  <div className="text-slate-400 text-sm opacity-0 group-hover/empty:opacity-100 transition-opacity">
                    Click + to add content
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render nested blocks */}
          <div className="space-y-1">
            {nestedBlocks.map((nestedBlock, index) => (
              <div key={nestedBlock.id} className="relative">
                {/* Plus icon above each nested block */}
                <div className="group/spacer absolute -top-3 left-0 right-0 h-6 flex items-center z-10">
                  <div className="flex-shrink-0 w-6 flex justify-center">
                    <button
                      className="w-4 h-4 opacity-0 group-hover/spacer:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm z-20 relative"
                      onClick={() => setShowAddMenu({ position: index, show: !showAddMenu.show })}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    
                    {showAddMenu.show && showAddMenu.position === index && (
                      <div className="absolute top-6 left-0 z-50">
                        <AddBlockMenu
                          onAddBlock={(type) => handleAddNestedBlock(type, index)}
                          onClose={() => setShowAddMenu({ position: -1, show: false })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Render the nested block */}
                {renderNestedBlock ? renderNestedBlock(nestedBlock, index, {
                  onMoveUp: () => handleMoveNestedBlockUp(nestedBlock.id),
                  onMoveDown: () => handleMoveNestedBlockDown(nestedBlock.id),
                  canMoveUp: index > 0,
                  canMoveDown: index < nestedBlocks.length - 1
                }) : (
                  <div className="text-slate-400 text-sm">
                    Nested block rendering not implemented
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final plus icon for adding at the end */}
          {nestedBlocks.length > 0 && (
            <div className="group/final py-2 mt-1">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-6 flex justify-center">
                  <button
                    className="w-4 h-4 opacity-0 group-hover/final:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm relative z-10"
                    onClick={() => setShowAddMenu({ position: nestedBlocks.length, show: !showAddMenu.show })}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  {showAddMenu.show && showAddMenu.position === nestedBlocks.length && (
                    <div className="absolute top-6 left-0 z-50">
                      <AddBlockMenu
                        onAddBlock={(type) => handleAddNestedBlock(type)}
                        onClose={() => setShowAddMenu({ position: -1, show: false })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 ml-2">
                  <div className="text-slate-400 text-sm opacity-0 group-hover/final:opacity-100 transition-opacity">
                    Click + to add another block
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}