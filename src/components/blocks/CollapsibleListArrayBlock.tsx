'use client';

import { useState, useCallback, useMemo } from 'react';
import { ContentBlock, RichText, BlockType, ProjectSettings } from '@/lib/types';
import AddBlockMenu from '@/components/AddBlockMenu';
import BlockSettingsMenu from '@/components/BlockSettingsMenu';
import OverlayCommentModal from '@/components/OverlayCommentModal';
import OverlayCommentIndicator from '@/components/OverlayCommentIndicator';
import { useOverlayComment } from '@/hooks/useOverlayComment';
import HeaderBlock from '@/components/blocks/HeaderBlock';
import TextBlock from '@/components/blocks/TextBlock';
import ListBlock from '@/components/blocks/ListBlock';
import DividerBlock from '@/components/blocks/DividerBlock';
import CollapsibleListBlock from '@/components/blocks/CollapsibleListBlock';
import TextBlockContent from '@/components/blocks/TextBlockContent';
import MarkdownBlock from '@/components/blocks/MarkdownBlock';

// Simple nested block renderer for tab content
interface NestedBlockRendererProps {
  block: ContentBlock;
  index: number;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  projectSettings?: ProjectSettings | null;
  // Add these new props for nested block handling
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
}

function NestedBlockRenderer({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  projectSettings,
  // Add these new props for nested block handling
  onAddNestedBlock,
  onUpdateNestedBlock,
  onDeleteNestedBlock,
  onReorderNestedBlocks,
  renderNestedBlock
}: NestedBlockRendererProps) {
  if (!block || !block.type) {
    return <div className="text-slate-400 text-sm">Invalid block</div>;
  }

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
    case 'markdown':
      BlockComponent = MarkdownBlock;
      break;
    default:
      return <div className="text-slate-400 text-sm">Unknown block type: {block.type}</div>;
  }

  // Base props that all block components expect
  const baseProps = {
    block,
    onUpdate,
    onDelete,
    onDragStart: () => {},
    onDragEnd: () => {},
    isDragging: false,
    projectSettings
  };

  // Optional props that only some components use
  const moveProps = (typeof onMoveUp === 'function' && typeof onMoveDown === 'function') ? {
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
  } : {};

  // Helper function to get default content for new blocks
  const getDefaultContentForNested = (type: BlockType) => {
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
          textContent: { spans: [{ text: 'Write your content here...' }] }
        };
      case 'markdown':
        return {
          markdownContent: '# New Markdown Block\n\nDouble-click to edit...'
        };
      default:
        return {};
    }
  };

  // Add nested block handlers specifically for collapsible-list blocks
  const nestedBlockProps = (block.type === 'collapsible-list') ? {
    onAddNestedBlock: (_parentBlockId: string, type: BlockType, position?: number) => {
      // Handle adding nested blocks within this specific collapsible list
      const currentNestedBlocks = block.content?.nestedBlocks || [];
      const newPosition = position !== undefined ? position : currentNestedBlocks.length;

      const newNestedBlock: ContentBlock = {
        id: crypto.randomUUID(),
        composableId: block.composableId,
        type,
        position: newPosition,
        parentBlockId: block.id,
        content: getDefaultContentForNested(type),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update the nested blocks for this specific collapsible list
      const updatedNestedBlocks = [...currentNestedBlocks];
      // Shift existing blocks if inserting in middle
      if (position !== undefined && position < currentNestedBlocks.length) {
        updatedNestedBlocks.forEach((nestedBlock, index) => {
          if (index >= position) {
            nestedBlock.position = nestedBlock.position + 1;
          }
        });
      }
      updatedNestedBlocks.splice(newPosition, 0, newNestedBlock);

      // Update this collapsible list block
      const updatedBlock = {
        ...block,
        content: {
          ...block.content,
          nestedBlocks: updatedNestedBlocks
        }
      };

      onUpdate(updatedBlock);
    },
    onUpdateNestedBlock: (nestedBlock: ContentBlock) => {
      // Handle updating nested blocks within this specific collapsible list
      const currentNestedBlocks = block.content?.nestedBlocks || [];
      const updatedNestedBlocks = currentNestedBlocks.map(nb =>
        nb.id === nestedBlock.id ? nestedBlock : nb
      );

      const updatedBlock = {
        ...block,
        content: {
          ...block.content,
          nestedBlocks: updatedNestedBlocks
        }
      };

      onUpdate(updatedBlock);
    },
    onDeleteNestedBlock: (nestedBlockId: string) => {
      // Handle deleting nested blocks within this specific collapsible list
      const currentNestedBlocks = block.content?.nestedBlocks || [];
      const updatedNestedBlocks = currentNestedBlocks
        .filter(nb => nb.id !== nestedBlockId)
        .map((nb, index) => ({ ...nb, position: index }));

      const updatedBlock = {
        ...block,
        content: {
          ...block.content,
          nestedBlocks: updatedNestedBlocks
        }
      };

      onUpdate(updatedBlock);
    },
    onReorderNestedBlocks,
    renderNestedBlock: (nestedBlock: ContentBlock, index: number, moveProps?: {
      onMoveUp: () => void;
      onMoveDown: () => void;
      canMoveUp: boolean;
      canMoveDown: boolean;
    }) => {
      // Custom renderer for nested blocks within collapsible lists
      // This ensures nested blocks have proper update handlers to persist changes
      const handleNestedBlockUpdate = (updatedBlock: ContentBlock) => {
        // Update the collapsible list's nested blocks
        const currentNestedBlocks = block.content?.nestedBlocks || [];
        const updatedNestedBlocks = currentNestedBlocks.map(nb =>
          nb.id === updatedBlock.id ? updatedBlock : nb
        );

        // Update the collapsible list block itself
        const updatedCollapsibleListBlock = {
          ...block,
          content: {
            ...block.content,
            nestedBlocks: updatedNestedBlocks
          }
        };

        // Call the collapsible list's update handler to propagate changes upward
        onUpdate(updatedCollapsibleListBlock);
      };

      const handleNestedBlockDelete = (blockId: string) => {
        // Remove the block from collapsible list's nested blocks
        const currentNestedBlocks = block.content?.nestedBlocks || [];
        const updatedNestedBlocks = currentNestedBlocks
          .filter(nb => nb.id !== blockId)
          .map((nb, idx) => ({ ...nb, position: idx }));

        // Update the collapsible list block itself
        const updatedCollapsibleListBlock = {
          ...block,
          content: {
            ...block.content,
            nestedBlocks: updatedNestedBlocks
          }
        };

        // Call the collapsible list's update handler to propagate changes upward
        onUpdate(updatedCollapsibleListBlock);
      };

      return (
        <NestedBlockRenderer
          block={nestedBlock}
          index={index}
          onUpdate={handleNestedBlockUpdate}
          onDelete={() => handleNestedBlockDelete(nestedBlock.id)}
          onMoveUp={moveProps?.onMoveUp || (() => {})}
          onMoveDown={moveProps?.onMoveDown || (() => {})}
          canMoveUp={moveProps?.canMoveUp || false}
          canMoveDown={moveProps?.canMoveDown || false}
          projectSettings={projectSettings}
          onAddNestedBlock={onAddNestedBlock}
          onUpdateNestedBlock={onUpdateNestedBlock}
          onDeleteNestedBlock={onDeleteNestedBlock}
          onReorderNestedBlocks={onReorderNestedBlocks}
          renderNestedBlock={renderNestedBlock}
        />
      );
    }
  } : {};


  return (
    <BlockComponent
      {...baseProps}
      {...moveProps}
      {...nestedBlockProps}
    />
  );
}

interface CollapsibleListArrayTab {
  id: string;
  title: RichText;
  isExpanded: boolean;
  nestedBlocks: ContentBlock[];
  color?: string;
}

interface CollapsibleListArrayBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
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
  projectSettings?: ProjectSettings | null;
}

export default function CollapsibleListArrayBlock({
  block,
  onUpdate,
  onDelete,
  isDragging,
  onAddNestedBlock,
  onUpdateNestedBlock,
  onDeleteNestedBlock,
  onReorderNestedBlocks,
  renderNestedBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  projectSettings
}: CollapsibleListArrayBlockProps) {
  // Initialize tabs from block content or create default tab - memoized to prevent re-creation
  const tabs = useMemo(() => {
    if (block.content?.tabs && Array.isArray(block.content.tabs)) {
      return block.content.tabs as CollapsibleListArrayTab[];
    }
    return [
      {
        id: crypto.randomUUID(),
        title: { spans: [{ text: 'Tab 1' }] },
        isExpanded: true,
        nestedBlocks: [],
        color: '#3B82F6'
      }
    ] as CollapsibleListArrayTab[];
  }, [block.content?.tabs]);
  
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id || '');
  const [showAddMenu, setShowAddMenu] = useState<{ tabId: string; position: number; show: boolean }>({ tabId: '', position: -1, show: false });
  const [showSettings, setShowSettings] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState<string>('');
  const [editingTabColor, setEditingTabColor] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const overlayComment = useOverlayComment(block, onUpdate);

  const activeTab = useMemo(() => {
    return tabs.find(tab => tab.id === activeTabId) || tabs[0] || null;
  }, [tabs, activeTabId]);

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

  // Helper function to update tabs and persist changes
  const updateTabs = useCallback((newTabs: CollapsibleListArrayTab[]) => {
    onUpdate({
      ...block,
      content: {
        ...block.content,
        tabs: newTabs
      }
    });
  }, [block, onUpdate]);

  const addTab = () => {
    const newTab: CollapsibleListArrayTab = {
      id: crypto.randomUUID(),
      title: { spans: [{ text: `Tab ${tabs.length + 1}` }] },
      isExpanded: false,
      nestedBlocks: [],
      color: '#3B82F6'
    };
    
    const newTabs = [...tabs, newTab];
    updateTabs(newTabs);
    setActiveTabId(newTab.id);
  };

  const deleteTab = (tabId: string) => {
    setShowDeleteConfirm(tabId);
  };

  const confirmDeleteTab = () => {
    if (!showDeleteConfirm) return;
    
    const newTabs = tabs.filter(tab => tab.id !== showDeleteConfirm);
    
    // If we're deleting the active tab, switch to the first remaining tab
    if (activeTabId === showDeleteConfirm && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
    
    updateTabs(newTabs);
    setShowDeleteConfirm(null);
  };

  const cancelDeleteTab = () => {
    setShowDeleteConfirm(null);
  };

  const startEditingTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingTabId(tabId);
      setEditingTabTitle(tab.title.spans[0]?.text || '');
      setEditingTabColor(tab.color || '#3B82F6');
    }
  };

  const saveTabEditing = useCallback(() => {
    if (!editingTabId) return;
    
    const newTabs = tabs.map(tab => 
      tab.id === editingTabId 
        ? { 
            ...tab, 
            title: { spans: [{ text: editingTabTitle }] },
            color: editingTabColor
          } 
        : tab
    );
    updateTabs(newTabs);
    setEditingTabId(null);
    setEditingTabTitle('');
    setEditingTabColor('');
  }, [editingTabId, editingTabTitle, editingTabColor, tabs, updateTabs]);

  const cancelTabEditing = () => {
    setEditingTabId(null);
    setEditingTabTitle('');
    setEditingTabColor('');
  };

  const handleTabClick = useCallback((tabId: string) => {
    if (!tabId) return;
    
    // Auto-expand clicked tab and collapse others
    const newTabs = tabs.map(tab => ({
      ...tab,
      isExpanded: tab.id === tabId
    }));
    updateTabs(newTabs);
    setActiveTabId(tabId);
  }, [tabs, updateTabs]);

  const handleTabDragStart = (tabId: string) => {
    setDraggedTabId(tabId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    
    if (!draggedTabId || draggedTabId === targetTabId) {
      setDraggedTabId(null);
      return;
    }

    const draggedIndex = tabs.findIndex(tab => tab.id === draggedTabId);
    const targetIndex = tabs.findIndex(tab => tab.id === targetTabId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTabs = [...tabs];
    const [draggedTab] = newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);
    
    updateTabs(newTabs);
    setDraggedTabId(null);
  };


  const handleAddNestedBlockToTab = (type: BlockType, position?: number) => {
    if (!activeTab) return;
    
    const nestedBlocks = activeTab.nestedBlocks || [];
    const newPosition = position !== undefined ? position : nestedBlocks.length;

    // Create new nested block
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      composableId: block.composableId,
      type,
      position: newPosition,
      parentBlockId: block.id, // Use main block ID as parent
      content: getDefaultContent(type),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update nested blocks in active tab
    const updatedNestedBlocks = [...nestedBlocks];
    // Shift existing blocks if inserting in middle
    if (position !== undefined && position < nestedBlocks.length) {
      updatedNestedBlocks.forEach((nestedBlock, index) => {
        if (index >= position) {
          nestedBlock.position = nestedBlock.position + 1;
        }
      });
    }
    updatedNestedBlocks.splice(newPosition, 0, newBlock);

    // Update the active tab
    const newTabs = tabs.map(tab =>
      tab.id === activeTab.id 
        ? { ...tab, nestedBlocks: updatedNestedBlocks }
        : tab
    );
    
    updateTabs(newTabs);
    setShowAddMenu({ tabId: '', position: -1, show: false });
  };


  const handleMoveNestedBlockUp = useCallback((nestedBlockId: string) => {
    if (!activeTab) return;
    
    const nestedBlocks = activeTab.nestedBlocks || [];
    const currentIndex = nestedBlocks.findIndex(nb => nb.id === nestedBlockId);
    if (currentIndex <= 0) return;
    
    const newNestedBlocks = [...nestedBlocks];
    [newNestedBlocks[currentIndex - 1], newNestedBlocks[currentIndex]] = 
      [newNestedBlocks[currentIndex], newNestedBlocks[currentIndex - 1]];
    
    // Update positions
    newNestedBlocks.forEach((nb, index) => {
      nb.position = index;
    });
    
    const newTabs = tabs.map(tab =>
      tab.id === activeTab.id ? { ...tab, nestedBlocks: newNestedBlocks } : tab
    );
    updateTabs(newTabs);
  }, [activeTab, tabs, updateTabs]);

  const handleMoveNestedBlockDown = useCallback((nestedBlockId: string) => {
    if (!activeTab) return;
    
    const nestedBlocks = activeTab.nestedBlocks || [];
    const currentIndex = nestedBlocks.findIndex(nb => nb.id === nestedBlockId);
    if (currentIndex >= nestedBlocks.length - 1) return;
    
    const newNestedBlocks = [...nestedBlocks];
    [newNestedBlocks[currentIndex], newNestedBlocks[currentIndex + 1]] = 
      [newNestedBlocks[currentIndex + 1], newNestedBlocks[currentIndex]];
    
    // Update positions
    newNestedBlocks.forEach((nb, index) => {
      nb.position = index;
    });
    
    const newTabs = tabs.map(tab =>
      tab.id === activeTab.id ? { ...tab, nestedBlocks: newNestedBlocks } : tab
    );
    updateTabs(newTabs);
  }, [activeTab, tabs, updateTabs]);

  // Handler to properly update nested blocks within tabs using parent's system
  const handleUpdateNestedBlockInTab = useCallback((updatedNestedBlock: ContentBlock) => {
    if (!updatedNestedBlock || !updatedNestedBlock.id) return;
    
    // First update the tab structure locally
    const newTabs = tabs.map(tab => {
      if (tab.nestedBlocks && Array.isArray(tab.nestedBlocks) && tab.nestedBlocks.some(nb => nb && nb.id === updatedNestedBlock.id)) {
        const updatedNestedBlocks = tab.nestedBlocks.map(nb =>
          nb && nb.id === updatedNestedBlock.id ? updatedNestedBlock : nb
        );
        return { ...tab, nestedBlocks: updatedNestedBlocks };
      }
      return tab;
    });
    
    // Update the tabs and save changes
    updateTabs(newTabs);
    
    // Also call parent's handler if available for proper integration
    if (onUpdateNestedBlock) {
      onUpdateNestedBlock(updatedNestedBlock);
    }
  }, [tabs, updateTabs, onUpdateNestedBlock]);

  // Handler to properly delete nested blocks within tabs using parent's system
  const handleDeleteNestedBlockInTab = useCallback((nestedBlockId: string) => {
    if (!nestedBlockId) return;
    
    // First update the tab structure locally
    const newTabs = tabs.map(tab => {
      if (tab.nestedBlocks && Array.isArray(tab.nestedBlocks) && tab.nestedBlocks.some(nb => nb && nb.id === nestedBlockId)) {
        const updatedNestedBlocks = tab.nestedBlocks
          .filter(nb => nb && nb.id !== nestedBlockId)
          .map((nb, index) => ({ ...nb, position: index }));
        return { ...tab, nestedBlocks: updatedNestedBlocks };
      }
      return tab;
    });
    
    // Update the tabs and save changes
    updateTabs(newTabs);
    
    // Also call parent's handler if available for proper integration
    if (onDeleteNestedBlock) {
      onDeleteNestedBlock(nestedBlockId);
    }
  }, [tabs, updateTabs, onDeleteNestedBlock]);

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
          textContent: { spans: [{ text: 'Write your content here...' }] }
        };
      case 'markdown':
        return {
          markdownContent: '# New Markdown Block\n\nDouble-click to edit...'
        };
      default:
        return {};
    }
  };

  if (!activeTab) {
    return (
      <div className="p-4 text-center text-slate-500">
        No tabs available
      </div>
    );
  }

  return (
    <div 
      className={`group relative py-1 ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Overlay Comment Indicator */}
      <OverlayCommentIndicator
        hasComment={!!block.overlayComment}
        onClick={() => overlayComment.setShowOverlayComment(true)}
      />

      {/* Status display (always visible) */}
      {block.status && (
        <div className="absolute -right-20 top-2">
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getStatusColor(block.status) }}
          >
            {block.status}
          </div>
        </div>
      )}

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
            onAddOverlayComment={overlayComment.handleAddOverlayComment}
            projectSettings={projectSettings}
          />
        )}
      </div>

      {/* Horizontal tabs */}
      <div className="flex items-center space-x-1 mb-3 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center space-x-1 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div key={tab.id} className="relative flex-shrink-0">
              <button
                draggable
                onDragStart={() => handleTabDragStart(tab.id)}
                onDragOver={handleTabDragOver}
                onDrop={(e) => handleTabDrop(e, tab.id)}
                onClick={() => handleTabClick(tab.id)}
                onDoubleClick={() => startEditingTab(tab.id)}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTabId === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-l border-r border-t border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={{ 
                  borderBottomColor: activeTabId === tab.id ? 'transparent' : undefined,
                  backgroundColor: activeTabId === tab.id ? undefined : `${tab.color}20`
                }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tab.color }}
                  />
                  <span className={`${draggedTabId === tab.id ? 'opacity-50' : ''}`}>
                    {tab.title.spans[0]?.text || `Tab ${tabs.indexOf(tab) + 1}`}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTab(tab.id);
                      }}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </button>
              
              {/* Edit tab form */}
              {editingTabId === tab.id && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg p-3 z-50 min-w-48">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingTabTitle}
                      onChange={(e) => setEditingTabTitle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Tab title"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTabEditing();
                        if (e.key === 'Escape') cancelTabEditing();
                      }}
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingTabColor}
                        onChange={(e) => setEditingTabColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={saveTabEditing}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelTabEditing}
                          className="px-2 py-1 text-xs bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Add tab button */}
          <button
            onClick={addTab}
            className="px-2 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-dashed border-slate-300 dark:border-slate-600 rounded-t-lg transition-colors"
          >
            + Add Tab
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab && (
          <div className={`tab-panel ${activeTab.isExpanded ? 'expanded' : ''}`}>
            <div className="pl-6 border-l-2 max-h-96  min-h-96 overflow-y-auto" style={{ borderColor: `${activeTab.color}40` }}>
              {/* Empty state when no nested blocks */}
              {(!activeTab.nestedBlocks || activeTab.nestedBlocks.length === 0) && (
                <div className="py-4">
                  <div className="group/empty flex items-center">
                    <div className="flex-shrink-0 w-6 flex justify-center">
                      <button
                        className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm"
                        onClick={() => setShowAddMenu({ tabId: activeTab.id, position: 0, show: !showAddMenu.show })}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      
                      {showAddMenu.show && showAddMenu.tabId === activeTab.id && showAddMenu.position === 0 && (
                        <div className="absolute top-6 left-0 z-50">
                          <AddBlockMenu
                            onAddBlock={(type) => handleAddNestedBlockToTab(type, 0)}
                            onClose={() => setShowAddMenu({ tabId: '', position: -1, show: false })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="text-slate-400 text-sm">
                        Click + to add content
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Render nested blocks */}
              {activeTab.nestedBlocks && Array.isArray(activeTab.nestedBlocks) && activeTab.nestedBlocks.length > 0 && (
                <div className="space-y-1">
                  {activeTab.nestedBlocks.filter(nb => nb && nb.id).map((nestedBlock, index) => (
                    <div key={nestedBlock.id} className="relative">
                      {/* Plus icon above each nested block */}
                      <div className="group/spacer absolute -top-3 left-0 right-0 h-6 flex items-center z-10">
                        <div className="flex-shrink-0 w-6 flex justify-center">
                          <button
                            className="w-4 h-4 opacity-0 group-hover/spacer:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm z-20 relative"
                            onClick={() => setShowAddMenu({ tabId: activeTab.id, position: index, show: !showAddMenu.show })}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          
                          {showAddMenu.show && showAddMenu.tabId === activeTab.id && showAddMenu.position === index && (
                            <div className="absolute top-6 left-0 z-50">
                              <AddBlockMenu
                                onAddBlock={(type) => handleAddNestedBlockToTab(type, index)}
                                onClose={() => setShowAddMenu({ tabId: '', position: -1, show: false })}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Render the nested block */}
                      {nestedBlock && nestedBlock.id ? (
                        <div className="nested-block-wrapper" data-block-id={nestedBlock.id}>
                          <NestedBlockRenderer
                            block={nestedBlock}
                            index={index}
                            onUpdate={handleUpdateNestedBlockInTab}
                            onDelete={() => handleDeleteNestedBlockInTab(nestedBlock.id)}
                            onMoveUp={() => handleMoveNestedBlockUp(nestedBlock.id)}
                            onMoveDown={() => handleMoveNestedBlockDown(nestedBlock.id)}
                            canMoveUp={index > 0}
                            canMoveDown={index < (activeTab.nestedBlocks?.length || 0) - 1}
                            projectSettings={projectSettings}
                            // Add these nested block handlers
                            onAddNestedBlock={onAddNestedBlock}
                            onUpdateNestedBlock={onUpdateNestedBlock}
                            onDeleteNestedBlock={onDeleteNestedBlock}
                            onReorderNestedBlocks={onReorderNestedBlocks}
                            renderNestedBlock={renderNestedBlock}
                          />
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm">Invalid nested block</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Final plus icon for adding at the end */}
              {activeTab.nestedBlocks && activeTab.nestedBlocks.length > 0 && (
                <div className="group/final py-2 mt-1">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-6 flex justify-center">
                      <button
                        className="w-4 h-4 opacity-0 group-hover/final:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm relative z-10"
                        onClick={() => setShowAddMenu({ tabId: activeTab.id, position: activeTab.nestedBlocks?.length || 0, show: !showAddMenu.show })}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      
                      {showAddMenu.show && showAddMenu.tabId === activeTab.id && showAddMenu.position === (activeTab.nestedBlocks?.length || 0) && (
                        <div className="absolute top-6 left-0 z-50">
                          <AddBlockMenu
                            onAddBlock={(type) => handleAddNestedBlockToTab(type)}
                            onClose={() => setShowAddMenu({ tabId: '', position: -1, show: false })}
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={cancelDeleteTab} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-50 p-6 min-w-80">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Delete Tab?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this tab? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteTab}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTab}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

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