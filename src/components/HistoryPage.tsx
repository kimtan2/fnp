'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unifiedDB } from '@/lib/unified-db';
import { ContentBlock } from '@/lib/types';

interface HistoryPageProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface HistoryItem {
  id: string;
  type: 'block' | 'comment' | 'overlay-comment';
  date: Date;
  content: string;
  commentContent?: string;
  composableTitle?: string;
  composableId?: string;
  blockId?: string;
  projectName?: string;
  authorType?: string;
  authorName?: string;
}

export default function HistoryPage({ isOpen, onClose, projectId }: HistoryPageProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [filterType, setFilterType] = useState<'content' | 'commentators' | 'overlay-comments'>('content');
  const [selectedCommentator, setSelectedCommentator] = useState<string>('all');
  const [availableCommentators, setAvailableCommentators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getBlockContent = (block: ContentBlock): string => {
    switch (block.type) {
      case 'header':
        return block.content.headerText?.spans.map(s => s.text).join('') || 'Header';
      case 'text':
        return block.content.text?.spans.map(s => s.text).join('') || 'Text';
      case 'text-block':
        return block.content.textContent?.spans.map(s => s.text).join('') || 'Text Block';
      case 'list':
        return block.content.listItems?.map(item => 
          item.content.spans.map(s => s.text).join('')
        ).join(', ') || 'List';
      case 'markdown':
        return block.content.markdownContent || 'Markdown';
      case 'divider':
        return 'Divider';
      case 'collapsible-list':
        return block.content.title?.spans.map(s => s.text).join('') || 'Collapsible List';
      default:
        return 'Content Block';
    }
  };

  const loadHistoryItems = useCallback(async () => {
    setLoading(true);
    try {
      // Get only data for this specific project
      const [composables, projects] = await Promise.all([
        unifiedDB.getComposablesByProject(projectId),
        unifiedDB.getAllProjects()
      ]);

      const project = projects.find(p => p.id === projectId);
      
      // Get all blocks and comments for composables in this project
      const composableIds = composables.map(c => c.id);
      
      const [blocks, comments] = await Promise.all([
        Promise.all(composableIds.map(id => unifiedDB.getBlocksByComposable(id))).then(results => results.flat()),
        Promise.all(composableIds.map(id => unifiedDB.getCommentsByComposable(id))).then(results => results.flat())
      ]);

      const items: HistoryItem[] = [];
      const commentatorTypes = new Set<string>();

      // Create lookups
      const composableMap = new Map(composables.map(c => [c.id, c]));

      // Add blocks with overlay comments (exclude header and divider blocks)
      blocks.forEach(block => {
        // Skip header and divider blocks
        if (block.type === 'header' || block.type === 'divider') {
          return;
        }

        const composable = composableMap.get(block.composableId);
        
        if (block.overlayComment) {
          items.push({
            id: `block-overlay-${block.id}`,
            type: 'overlay-comment',
            date: block.updatedAt,
            content: getBlockContent(block),
            commentContent: block.overlayComment,
            composableTitle: composable?.title,
            composableId: block.composableId,
            blockId: block.id,
            projectName: project?.name
          });
        }

        items.push({
          id: `block-${block.id}`,
          type: 'block',
          date: block.updatedAt,
          content: getBlockContent(block),
          composableTitle: composable?.title,
          composableId: block.composableId,
          blockId: block.id,
          projectName: project?.name
        });
      });

      // Add comments
      comments.forEach(comment => {
        const composable = composableMap.get(comment.composableId);
        
        if (comment.authorType) {
          commentatorTypes.add(comment.authorType);
        }
        
        items.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          date: comment.updatedAt,
          content: 'Comment',
          commentContent: comment.content,
          composableTitle: composable?.title,
          composableId: comment.composableId,
          blockId: comment.blockId,
          projectName: project?.name,
          authorType: comment.authorType,
          authorName: comment.authorName
        });
      });

      // Set available commentators
      setAvailableCommentators(Array.from(commentatorTypes).sort());

      // Sort by date (newest first)
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Failed to load history items:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const filterItems = useCallback(() => {
    let filtered = [...historyItems];

    if (filterType === 'content') {
      // Show only content blocks (not comments)
      filtered = filtered.filter(item => item.type === 'block');
    } else if (filterType === 'commentators') {
      // Show only comments
      filtered = filtered.filter(item => item.type === 'comment');
      
      // Apply commentator filter if selected
      if (selectedCommentator !== 'all') {
        filtered = filtered.filter(item => item.authorType === selectedCommentator);
      }
    } else if (filterType === 'overlay-comments') {
      filtered = filtered.filter(item => item.type === 'overlay-comment');
    }

    setFilteredItems(filtered);
  }, [historyItems, filterType, selectedCommentator]);

  useEffect(() => {
    if (isOpen) {
      loadHistoryItems();
    }
  }, [isOpen, loadHistoryItems]);

  useEffect(() => {
    filterItems();
  }, [filterItems]);

  // Reset commentator filter when changing filter types
  useEffect(() => {
    if (filterType !== 'commentators') {
      setSelectedCommentator('all');
    }
  }, [filterType]);

  const handleHistoryItemClick = (item: HistoryItem) => {
    if (item.composableId) {
      // Navigate to the composable page
      const url = `/project/${projectId}/composable/${item.composableId}`;
      
      if (item.blockId) {
        // Add hash to scroll to specific block
        router.push(`${url}#block-${item.blockId}`);
      } else {
        router.push(url);
      }
      
      // Close the history modal
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const groupItemsByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    items.forEach(item => {
      const dateKey = item.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  };

  if (!isOpen) return null;

  const groupedItems = groupItemsByDate(filteredItems);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <svg
              className="w-6 h-6 text-slate-600 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              History
            </h2>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('content')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                filterType === 'content'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setFilterType('commentators')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                filterType === 'commentators'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Commentators
            </button>
            <button
              onClick={() => setFilterType('overlay-comments')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${
                filterType === 'overlay-comments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Overlay Comments
            </button>

            {/* Commentator filter dropdown - only show when commentators filter is selected */}
            {filterType === 'commentators' && availableCommentators.length > 0 && (
              <select
                value={selectedCommentator}
                onChange={(e) => setSelectedCommentator(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Commentators</option>
                {availableCommentators.map(commentator => (
                  <option key={commentator} value={commentator}>
                    {commentator}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium mb-1">No history items</p>
              <p className="text-sm">No items found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                    {new Date(dateKey).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  
                  <div className="space-y-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item)}
                        className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                item.type === 'comment' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : item.type === 'overlay-comment'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {item.type === 'comment' ? 'Comment' : item.type === 'overlay-comment' ? 'Overlay Comment' : 'Content'}
                              </span>
                              
                              {item.authorType && (
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium">
                                  {item.authorType}
                                </span>
                              )}
                            </div>

                            <p className="font-medium text-slate-800 dark:text-white mb-1">
                              {item.content}
                            </p>
                            
                            {item.commentContent && (
                              <p className="text-slate-600 dark:text-slate-300 text-sm bg-white dark:bg-slate-800 rounded p-2 border border-slate-200 dark:border-slate-600 mb-2">
                                &quot;{item.commentContent}&quot;
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                              {item.projectName && (
                                <span>{item.projectName}</span>
                              )}
                              {item.composableTitle && (
                                <span>• {item.composableTitle}</span>
                              )}
                              {item.authorName && (
                                <span>• {item.authorName}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-500 dark:text-slate-400 ml-4">
                            {formatDate(item.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}