'use client';

import { useState, useCallback } from 'react';
import { ContentBlock, BlockType, ProjectSettings } from '@/lib/types';
import HeaderBlock from '@/components/blocks/HeaderBlock';
import TextBlock from '@/components/blocks/TextBlock';
import ListBlock from '@/components/blocks/ListBlock';
import DividerBlock from '@/components/blocks/DividerBlock';
import CollapsibleListBlock from '@/components/blocks/CollapsibleListBlock';
import TextBlockContent from '@/components/blocks/TextBlockContent';
import MarkdownBlock from '@/components/blocks/MarkdownBlock';
import AddBlockMenu from '@/components/AddBlockMenu';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onAddBlock: (type: BlockType, position?: number) => void;
  onUpdateBlock: (block: ContentBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onReorderBlocks: (newOrder: string[]) => void;
  projectSettings?: ProjectSettings | null;
}

export default function BlockEditor({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  projectSettings
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

  const handleAddNestedBlock = useCallback((parentBlockId: string, type: BlockType, position?: number) => {
    const parentBlock = blocks.find(b => b.id === parentBlockId);
    if (!parentBlock) return;

    const nestedBlocks = parentBlock.content.nestedBlocks || [];
    const newPosition = position !== undefined ? position : nestedBlocks.length;

    // Create new nested block
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      composableId: parentBlock.composableId,
      type,
      position: newPosition,
      parentBlockId,
      content: getDefaultContent(type),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update nested blocks in parent
    const updatedNestedBlocks = [...nestedBlocks];
    // Shift existing blocks if inserting in middle
    if (position !== undefined && position < nestedBlocks.length) {
      updatedNestedBlocks.forEach((block, index) => {
        if (index >= position) {
          block.position = block.position + 1;
        }
      });
    }
    updatedNestedBlocks.splice(newPosition, 0, newBlock);

    // Update parent block - this will save nested blocks as part of content
    const updatedParentBlock = {
      ...parentBlock,
      content: {
        ...parentBlock.content,
        nestedBlocks: updatedNestedBlocks
      }
    };

    onUpdateBlock(updatedParentBlock);
  }, [blocks, onUpdateBlock]);

  const handleUpdateNestedBlock = useCallback((updatedNestedBlock: ContentBlock) => {
    // Helper function to recursively update nested blocks
    const updateNestedBlockRecursively = (blocks: ContentBlock[], targetBlockId: string, updatedBlock: ContentBlock): ContentBlock[] => {
      return blocks.map(block => {
        // Check if this block contains the target nested block
        if (block.content.nestedBlocks?.some(nb => nb.id === targetBlockId)) {
          const updatedNestedBlocks = block.content.nestedBlocks.map(nb => 
            nb.id === targetBlockId ? updatedBlock : nb
          );
          
          return {
            ...block,
            content: {
              ...block.content,
              nestedBlocks: updatedNestedBlocks
            }
          };
        }
        
        // If this block has nested blocks, recursively search within them
        if (block.content.nestedBlocks && block.content.nestedBlocks.length > 0) {
          const updatedNestedBlocks = updateNestedBlockRecursively(block.content.nestedBlocks, targetBlockId, updatedBlock);
          
          // Check if any nested block was actually updated
          const wasUpdated = updatedNestedBlocks.some((nb, index) => 
            nb !== block.content.nestedBlocks![index]
          );
          
          if (wasUpdated) {
            return {
              ...block,
              content: {
                ...block.content,
                nestedBlocks: updatedNestedBlocks
              }
            };
          }
        }
        
        return block;
      });
    };
    
    // Find and update the top-level block that contains this nested block
    const updatedBlocks = updateNestedBlockRecursively(blocks, updatedNestedBlock.id, updatedNestedBlock);
    
    // Find the block that was actually updated and save it
    const updatedTopLevelBlock = updatedBlocks.find((block, index) => 
      block !== blocks[index]
    );
    
    if (updatedTopLevelBlock) {
      onUpdateBlock(updatedTopLevelBlock);
    }
  }, [blocks, onUpdateBlock]);

  const handleDeleteNestedBlock = useCallback((nestedBlockId: string) => {
    // Helper function to recursively delete nested blocks
    const deleteNestedBlockRecursively = (blocks: ContentBlock[], targetBlockId: string): ContentBlock[] => {
      return blocks.map(block => {
        // Check if this block contains the target nested block
        if (block.content.nestedBlocks?.some(nb => nb.id === targetBlockId)) {
          // Remove the nested block and reorder positions
          const updatedNestedBlocks = block.content.nestedBlocks
            .filter(nb => nb.id !== targetBlockId)
            .map((nb, index) => ({ ...nb, position: index }));
          
          return {
            ...block,
            content: {
              ...block.content,
              nestedBlocks: updatedNestedBlocks
            }
          };
        }
        
        // If this block has nested blocks, recursively search within them
        if (block.content.nestedBlocks && block.content.nestedBlocks.length > 0) {
          const updatedNestedBlocks = deleteNestedBlockRecursively(block.content.nestedBlocks, targetBlockId);
          
          // Check if any nested block was actually updated
          const wasUpdated = updatedNestedBlocks.some((nb, index) => 
            nb !== block.content.nestedBlocks![index]
          );
          
          if (wasUpdated) {
            return {
              ...block,
              content: {
                ...block.content,
                nestedBlocks: updatedNestedBlocks
              }
            };
          }
        }
        
        return block;
      });
    };
    
    // Find and update the top-level block that contains this nested block
    const updatedBlocks = deleteNestedBlockRecursively(blocks, nestedBlockId);
    
    // Find the block that was actually updated and save it
    const updatedTopLevelBlock = updatedBlocks.find((block, index) => 
      block !== blocks[index]
    );
    
    if (updatedTopLevelBlock) {
      onUpdateBlock(updatedTopLevelBlock);
    }
  }, [blocks, onUpdateBlock]);

  const handleReorderNestedBlocks = useCallback(async (parentBlockId: string, newOrder: string[]) => {
    const parentBlock = blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || !parentBlock.content.nestedBlocks) return;

    const reorderedNestedBlocks = parentBlock.content.nestedBlocks.map(block => {
      const newPosition = newOrder.indexOf(block.id);
      return { ...block, position: newPosition };
    }).sort((a, b) => a.position - b.position);

    const updatedParentBlock = {
      ...parentBlock,
      content: {
        ...parentBlock.content,
        nestedBlocks: reorderedNestedBlocks
      }
    };

    onUpdateBlock(updatedParentBlock);
  }, [blocks, onUpdateBlock]);

  const getDefaultContent = (type: BlockType) => {
    switch (type) {
      case 'header':
        return {
          headerSize: 'h1' as const,
          headerText: { spans: [{ text: 'New Header' }] }
        };
      case 'text':
        return {
          text: { spans: [] }
        };
      case 'list':
        return {
          listType: 'bullet' as const,
          listItems: [
            { id: crypto.randomUUID(), content: { spans: [{ text: 'First item' }] } }
          ]
        };
      case 'divider':
        return {
          dividerStyle: 'solid' as const
        };
      case 'collapsible-list':
        return {
          title: { spans: [{ text: 'Toggle section' }] },
          isExpanded: false,
          nestedBlocks: []
        };
      case 'text-block':
        return {
          textContent: { spans: [{ text: 'Write your longer text content here. This block is perfect for paragraphs, detailed explanations, and extended writing.' }] }
        };
      case 'markdown':
        return {
          markdownContent: '# New Markdown Block\n\nDouble-click to edit this markdown content...'
        };
      default:
        return {};
    }
  };

  const getBackgroundColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      gray: '#f8fafc',
      red: '#fef2f2',
      orange: '#fff7ed',
      yellow: '#fefce8',
      green: '#f0fdf4',
      blue: '#eff6ff',
      purple: '#faf5ff',
      pink: '#fdf2f8'
    };
    return colorMap[color] || 'transparent';
  };

  const handleMoveUp = useCallback((blockId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex <= 0) return; // Can't move up if it's the first block
    
    const newBlocks = [...blocks];
    [newBlocks[currentIndex - 1], newBlocks[currentIndex]] = [newBlocks[currentIndex], newBlocks[currentIndex - 1]];
    
    const newOrder = newBlocks.map(b => b.id);
    onReorderBlocks(newOrder);
  }, [blocks, onReorderBlocks]);

  const handleMoveDown = useCallback((blockId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex >= blocks.length - 1) return; // Can't move down if it's the last block
    
    const newBlocks = [...blocks];
    [newBlocks[currentIndex], newBlocks[currentIndex + 1]] = [newBlocks[currentIndex + 1], newBlocks[currentIndex]];
    
    const newOrder = newBlocks.map(b => b.id);
    onReorderBlocks(newOrder);
  }, [blocks, onReorderBlocks]);

  const renderBlock = (block: ContentBlock, index: number, isNested = false, parentBlockId?: string) => {
    const currentIndex = blocks.findIndex(b => b.id === block.id);
    const canMoveUp = !isNested && currentIndex > 0;
    const canMoveDown = !isNested && currentIndex < blocks.length - 1;
    
    const blockProps = {
      block,
      onUpdate: isNested ? handleUpdateNestedBlock : onUpdateBlock, // KEY FIX: Different handlers for nested vs top-level blocks
      onDelete: isNested ? () => handleDeleteNestedBlock(block.id) : () => onDeleteBlock(block.id),
      onDragStart: () => handleDragStart(block.id),
      onDragEnd: handleDragEnd,
      isDragging: draggedBlockId === block.id,
      onMoveUp: !isNested ? () => handleMoveUp(block.id) : undefined,
      onMoveDown: !isNested ? () => handleMoveDown(block.id) : undefined,
      canMoveUp,
      canMoveDown,
      projectSettings
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
        // Add nested block handlers for collapsible list
        if (isNested && parentBlockId) {
          // For nested collapsible blocks, create specialized handlers that work within the parent
          (blockProps as any).onAddNestedBlock = (nestedParentBlockId: string, type: BlockType, position?: number) => {
            // Find the top-level parent that contains this nested block
            const topLevelParent = blocks.find(b => 
              b.content.nestedBlocks?.some(nb => nb.id === block.id)
            );
            
            if (!topLevelParent) return;
            
            // Find the nested block within the parent and update its nested blocks
            const updatedNestedBlocks = topLevelParent.content.nestedBlocks?.map(nb => {
              if (nb.id === nestedParentBlockId) {
                const currentNested = nb.content.nestedBlocks || [];
                const newPosition = position !== undefined ? position : currentNested.length;
                
                const newNestedBlock: ContentBlock = {
                  id: crypto.randomUUID(),
                  composableId: nb.composableId,
                  type,
                  position: newPosition,
                  parentBlockId: nestedParentBlockId,
                  content: getDefaultContent(type),
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                // Shift existing blocks if inserting in middle
                const updatedCurrentNested = [...currentNested];
                if (position !== undefined && position < currentNested.length) {
                  updatedCurrentNested.forEach((nestedBlock, idx) => {
                    if (idx >= position) {
                      nestedBlock.position = nestedBlock.position + 1;
                    }
                  });
                }
                updatedCurrentNested.splice(newPosition, 0, newNestedBlock);
                
                return {
                  ...nb,
                  content: {
                    ...nb.content,
                    nestedBlocks: updatedCurrentNested
                  }
                };
              }
              return nb;
            });
            
            // Update the top-level parent
            const updatedParent = {
              ...topLevelParent,
              content: {
                ...topLevelParent.content,
                nestedBlocks: updatedNestedBlocks
              }
            };
            
            onUpdateBlock(updatedParent);
          };
          
          (blockProps as any).onUpdateNestedBlock = handleUpdateNestedBlock;
          (blockProps as any).onDeleteNestedBlock = handleDeleteNestedBlock;
          (blockProps as any).onReorderNestedBlocks = handleReorderNestedBlocks;
        } else {
          // For top-level collapsible blocks, use the regular handlers
          (blockProps as any).onAddNestedBlock = handleAddNestedBlock;
          (blockProps as any).onUpdateNestedBlock = handleUpdateNestedBlock;
          (blockProps as any).onDeleteNestedBlock = handleDeleteNestedBlock;
          (blockProps as any).onReorderNestedBlocks = handleReorderNestedBlocks;
        }
        (blockProps as any).renderNestedBlock = (nestedBlock: ContentBlock, nestedIndex: number, moveProps?: {
          onMoveUp: () => void;
          onMoveDown: () => void;
          canMoveUp: boolean;
          canMoveDown: boolean;
        }) => {
          // For nested blocks, we pass the move props if provided
          const nestedBlockProps = {
            ...renderBlock(nestedBlock, nestedIndex, true, block.id)?.props,
            onMoveUp: moveProps?.onMoveUp,
            onMoveDown: moveProps?.onMoveDown,
            canMoveUp: moveProps?.canMoveUp,
            canMoveDown: moveProps?.canMoveDown
          };
          
          // We need to render the block component directly since renderBlock returns JSX
          let NestedBlockComponent;
          switch (nestedBlock.type) {
            case 'header':
              NestedBlockComponent = HeaderBlock;
              break;
            case 'text':
              NestedBlockComponent = TextBlock;
              break;
            case 'list':
              NestedBlockComponent = ListBlock;
              break;
            case 'divider':
              NestedBlockComponent = DividerBlock;
              break;
            case 'collapsible-list':
              NestedBlockComponent = CollapsibleListBlock;
              break;
            case 'text-block':
              NestedBlockComponent = TextBlockContent;
              break;
            case 'markdown':
              NestedBlockComponent = MarkdownBlock;
              break;
            default:
              return null;
          }
          
          const baseProps = {
            block: nestedBlock,
            onUpdate: handleUpdateNestedBlock,
            onDelete: () => handleDeleteNestedBlock(nestedBlock.id),
            onDragStart: () => handleDragStart(nestedBlock.id),
            onDragEnd: handleDragEnd,
            isDragging: draggedBlockId === nestedBlock.id,
            onMoveUp: moveProps?.onMoveUp,
            onMoveDown: moveProps?.onMoveDown,
            canMoveUp: moveProps?.canMoveUp,
            canMoveDown: moveProps?.canMoveDown
          };
          
          // Add additional props for collapsible blocks
          if (nestedBlock.type === 'collapsible-list') {
            (baseProps as any).onAddNestedBlock = handleAddNestedBlock;
            (baseProps as any).onUpdateNestedBlock = handleUpdateNestedBlock;
            (baseProps as any).onDeleteNestedBlock = handleDeleteNestedBlock;
            (baseProps as any).onReorderNestedBlocks = handleReorderNestedBlocks;
            (baseProps as any).renderNestedBlock = (deepNestedBlock: ContentBlock, deepNestedIndex: number) => renderBlock(deepNestedBlock, deepNestedIndex, true, nestedBlock.id);
          }
          
          return (
            <div key={nestedBlock.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg -mx-2 px-2">
              <NestedBlockComponent {...baseProps} />
            </div>
          );
        };
        break;
      case 'text-block':
        BlockComponent = TextBlockContent;
        break;
      case 'markdown':
        BlockComponent = MarkdownBlock;
        break;
      default:
        return null;
    }

    // For nested blocks, render without the hover controls (they're handled by parent)
    if (isNested) {
      return (
        <div key={block.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg -mx-2 px-2">
          <BlockComponent key={block.id} {...blockProps} />
        </div>
      );
    }

    return (
      <div key={block.id} className="relative">
        {/* Hover area above block for plus icon */}
        <div 
          className="group/spacer absolute -top-3 left-0 right-0 h-6 flex items-center z-10"
        >
          <div className="flex-shrink-0 w-6 flex justify-center">
            <button
              className="w-4 h-4 opacity-0 group-hover/spacer:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm z-20 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddMenu({ position: index, show: !showAddMenu.show });
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {showAddMenu.show && showAddMenu.position === index && (
              <div className="absolute top-6 left-0 z-50">
                <AddBlockMenu
                  onAddBlock={(type) => {
                    onAddBlock(type, index);
                    setShowAddMenu({ position: -1, show: false });
                  }}
                  onClose={() => setShowAddMenu({ position: -1, show: false })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Drop indicator */}
        <div
          className={`absolute inset-x-0 -top-1 h-0.5 bg-blue-500 transition-opacity z-20 ${
            dragOverPosition === index ? 'opacity-100' : 'opacity-0'
          }`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        />
        
        {/* Drop zone area - larger hit target */}
        <div
          className="absolute inset-x-0 -top-4 h-8"
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        />
        
        {/* Block with hover controls */}
        <div className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg -mx-2 px-2 flex items-start">
          {/* Left side plus icon when hovering block directly */}
          <div className="flex-shrink-0 mr-2 mt-2">
            <button
              className="w-4 h-4 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddMenu({ position: index, show: !showAddMenu.show });
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex-1" style={{ backgroundColor: block.content.backgroundColor ? getBackgroundColor(block.content.backgroundColor) : 'transparent' }}>
            <BlockComponent key={block.id} {...blockProps} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-64">
      {/* Empty state - Notion-style completely clean */}
      {blocks.length === 0 && (
        <div className="py-16">
          {/* Invisible click area to start typing */}
          <div 
            className="text-center"
            onClick={() => onAddBlock('text')}
          >
            <div className="text-4xl font-light text-slate-300 dark:text-slate-600 mb-4 cursor-text select-none">
              Neue Seite
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-sm opacity-60 cursor-text select-none">
              Erste Schritte mit
            </div>
          </div>
        </div>
      )}

      {/* Top drop zone for first position */}
      <div className="relative">
        <div
          className={`absolute inset-x-0 -top-2 h-0.5 bg-blue-500 transition-opacity z-20 ${
            dragOverPosition === 0 && blocks.length > 0 ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className="absolute inset-x-0 -top-4 h-8"
          onDragOver={(e) => handleDragOver(e, 0)}
          onDrop={(e) => handleDrop(e, 0)}
        />
      </div>

      {/* Render blocks with proper spacing */}
      <div className="space-y-1">
        {blocks.map((block, index) => renderBlock(block, index, false, undefined))}
      </div>

      {/* Final hover area for adding blocks at end - extends infinitely */}
      {blocks.length > 0 && (
        <div className="group/final relative py-3 min-h-[200px]">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-6 flex justify-center">
              <button
                className="w-4 h-4 opacity-0 group-hover/final:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm relative z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddMenu({ position: blocks.length, show: !showAddMenu.show });
                }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              {showAddMenu.show && showAddMenu.position === blocks.length && (
                <div className="absolute top-6 left-0 z-50">
                  <AddBlockMenu
                    onAddBlock={(type) => {
                      onAddBlock(type);
                      setShowAddMenu({ position: -1, show: false });
                    }}
                    onClose={() => setShowAddMenu({ position: -1, show: false })}
                  />
                </div>
              )}
            </div>
            <div className="flex-1 ml-2">
              <div className="text-slate-400 text-sm opacity-0 group-hover/final:opacity-100 transition-opacity">Click + to add a new block</div>
            </div>
          </div>
          
          {/* Drop area for final position */}
          <div
            className="absolute inset-0"
            onDragOver={(e) => handleDragOver(e, blocks.length)}
            onDrop={(e) => handleDrop(e, blocks.length)}
          />
          
          {/* Drop indicator for final position */}
          <div
            className={`absolute inset-x-0 top-0 h-0.5 bg-blue-500 transition-opacity z-20 ${
              dragOverPosition === blocks.length ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      )}
    </div>
  );
}