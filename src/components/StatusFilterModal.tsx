'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentBlock, ProjectSettings } from '@/lib/types';
import { unifiedDB } from '@/lib/unified-db';

interface StatusFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  settings: ProjectSettings | null;
}

interface FilteredItem {
  id: string;
  title: string;
  type: 'composable' | 'item';
  status: string;
  composableId: string;
  composableTitle: string;
}

export default function StatusFilterModal({
  isOpen,
  onClose,
  projectId,
  settings
}: StatusFilterModalProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<FilteredItem[]>([]);
  const [loading, setLoading] = useState(false);

  const statusTypes = settings?.statusTypes || ['Projekt', 'Sofort', 'Beobachten', 'To-Do', 'Ministerium Überwachung'];

  const getStatusColor = (status: string) => {
    // Use custom color from settings if available
    const customColor = settings?.statusColors?.[status];
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

  const filterByStatus = async (status: string) => {
    if (!status) {
      setFilteredItems([]);
      return;
    }

    setLoading(true);
    try {
      // Get all composables for the project
      const composables = await unifiedDB.getComposablesByProject(projectId);
      
      // Get all blocks for all composables
      const allBlocks: ContentBlock[] = [];
      for (const composable of composables) {
        const blocks = await unifiedDB.getBlocksByComposable(composable.id);
        allBlocks.push(...blocks);
      }

      const items: FilteredItem[] = [];

      // Filter composables by status
      const filteredComposables = composables.filter(c => c.status === status);
      for (const composable of filteredComposables) {
        items.push({
          id: composable.id,
          title: composable.title,
          type: 'composable',
          status: composable.status,
          composableId: composable.id,
          composableTitle: composable.title
        });
      }

      // Filter blocks by status
      const filteredBlocks = allBlocks.filter(b => b.status === status);
      for (const block of filteredBlocks) {
        const composable = composables.find(c => c.id === block.composableId);
        if (composable) {
          // Get block title based on type
          let blockTitle = '';
          switch (block.type) {
            case 'header':
              blockTitle = block.content.headerText?.spans.map(s => s.text).join('') || 'Header Block';
              break;
            case 'text':
              blockTitle = block.content.text?.spans.map(s => s.text).join('').substring(0, 50) + '...' || 'Text Block';
              break;
            case 'text-block':
              blockTitle = block.content.textContent?.spans.map(s => s.text).join('').substring(0, 50) + '...' || 'Text Block';
              break;
            case 'collapsible-list':
              blockTitle = block.content.title?.spans.map(s => s.text).join('') || 'Collapsible List';
              break;
            default:
              blockTitle = `${block.type} Block`;
          }

          items.push({
            id: block.id,
            title: blockTitle,
            type: 'item',
            status: block.status!,
            composableId: composable.id,
            composableTitle: composable.title
          });
        }
      }

      setFilteredItems(items);
    } catch (error) {
      console.error('Failed to filter items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStatus) {
      filterByStatus(selectedStatus);
    } else {
      setFilteredItems([]);
    }
  }, [selectedStatus, projectId]);

  const handleItemClick = (item: FilteredItem) => {
    if (item.type === 'composable') {
      // Navigate to composable
      router.push(`/project/${projectId}/composable/${item.composableId}`);
    } else {
      // Navigate to composable and highlight the specific item
      router.push(`/project/${projectId}/composable/${item.composableId}#${item.id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Filter by Status
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Status selector */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Select Status to Filter:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {statusTypes.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(status) }}
                    ></span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {selectedStatus && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Items with status &quot;{selectedStatus}&quot; ({filteredItems.length}):
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No items found with status &quot;{selectedStatus}&quot;
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredItems.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleItemClick(item)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getStatusColor(item.status) }}
                            ></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                              {item.type}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 dark:text-white">{item.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            in {item.composableTitle}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedStatus && (
            <div className="text-slate-500 dark:text-slate-400 text-center py-8">
              Select a status to filter items
            </div>
          )}
        </div>
      </div>
    </div>
  );
}