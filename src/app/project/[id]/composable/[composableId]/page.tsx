'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Composable, Project, ContentBlock, BlockType } from '@/lib/types';
import { unifiedDB } from '@/lib/unified-db';
import ComposableHeader from '@/components/ComposableHeader';
import BlockEditor from '@/components/BlockEditor';

export default function ComposableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const composableId = params.composableId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [composable, setComposable] = useState<Composable | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComposableData();
  }, [projectId, composableId]);

  const loadComposableData = async () => {
    try {
      setLoading(true);
      const [projectData, composablesData, blocksData] = await Promise.all([
        unifiedDB.getAllProjects().then(projects => projects.find(p => p.id === projectId)),
        unifiedDB.getComposablesByProject(projectId).then(composables => composables.find(c => c.id === composableId)),
        unifiedDB.getBlocksByComposable(composableId)
      ]);

      if (!projectData) {
        router.push('/');
        return;
      }

      if (!composablesData) {
        router.push(`/project/${projectId}`);
        return;
      }

      setProject(projectData);
      setComposable(composablesData);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Failed to load composable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async (type: BlockType, position?: number) => {
    if (!composable) return;

    try {
      const newPosition = position !== undefined ? position : blocks.length;
      
      // Shift existing blocks down if inserting in middle
      if (position !== undefined && position < blocks.length) {
        const updatedBlocks = blocks.map(block => 
          block.position >= position 
            ? { ...block, position: block.position + 1 }
            : block
        );
        
        await Promise.all(updatedBlocks.map(block => unifiedDB.updateBlock(block)));
        setBlocks(updatedBlocks);
      }

      const newBlock = await unifiedDB.addBlock({
        composableId,
        type,
        position: newPosition,
        content: getDefaultContent(type)
      });

      setBlocks(prev => [...prev, newBlock].sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Failed to add block:', error);
    }
  };

  const handleUpdateBlock = async (block: ContentBlock) => {
    try {
      await unifiedDB.updateBlock(block);
      setBlocks(prev => prev.map(b => b.id === block.id ? block : b));
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await unifiedDB.deleteBlock(blockId);
      const remainingBlocks = blocks.filter(b => b.id !== blockId);
      
      // Reorder remaining blocks
      const reorderedBlocks = remainingBlocks.map((block, index) => ({
        ...block,
        position: index
      }));
      
      await Promise.all(reorderedBlocks.map(block => unifiedDB.updateBlock(block)));
      setBlocks(reorderedBlocks);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleReorderBlocks = async (newOrder: string[]) => {
    try {
      await unifiedDB.reorderBlocks(composableId, newOrder);
      const reorderedBlocks = blocks.map(block => {
        const newPosition = newOrder.indexOf(block.id);
        return { ...block, position: newPosition };
      }).sort((a, b) => a.position - b.position);
      
      setBlocks(reorderedBlocks);
    } catch (error) {
      console.error('Failed to reorder blocks:', error);
    }
  };

  const getDefaultContent = (type: BlockType) => {
    switch (type) {
      case 'header':
        return {
          headerSize: 'h1' as const,
          headerText: { spans: [{ text: 'New Header' }] }
        };
      case 'text':
        return {
          text: { spans: [{ text: 'Type your text here...' }] }
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
          title: { spans: [{ text: 'Collapsible Section' }] },
          isExpanded: false,
          items: [
            { id: crypto.randomUUID(), content: { spans: [{ text: 'Item 1' }] } }
          ]
        };
      case 'text-block':
        return {
          textContent: { spans: [{ text: 'Write your longer text content here. This block is perfect for paragraphs, detailed explanations, and extended writing.' }] }
        };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project || !composable) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      <ComposableHeader
        project={project}
        composable={composable}
        onBack={() => router.push(`/project/${projectId}`)}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <BlockEditor
            blocks={blocks}
            onAddBlock={handleAddBlock}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onReorderBlocks={handleReorderBlocks}
          />
        </div>
      </main>
    </div>
  );
}