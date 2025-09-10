'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentBlock, ProjectSettings, Composable, Project, Comment } from '@/lib/types';
import { unifiedDB } from '@/lib/unified-db';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  id: string;
  date: Date;
  action: 'created' | 'updated';
  entityType: 'project' | 'composable' | 'block' | 'comment' | 'settings';
  entityTitle: string;
  entityId: string;
  composableId?: string;
  composableTitle?: string;
  projectId: string;
  projectName: string;
}

export default function HistoryModal({
  isOpen,
  onClose
}: HistoryModalProps) {
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const entries: HistoryEntry[] = [];

      // Get all data from the database
      const [projects, composables, blocks, comments, projectSettings] = await Promise.all([
        unifiedDB.getAllProjects(),
        unifiedDB.getAllComposables(),
        unifiedDB.getAllBlocks(),
        unifiedDB.getAllComments(),
        unifiedDB.getAllProjectSettings()
      ]);

      // Create a map of project IDs to project names for quick lookup
      const projectMap = new Map<string, Project>();
      projects.forEach(project => projectMap.set(project.id, project));

      // Create a map of composable IDs to composables for quick lookup
      const composableMap = new Map<string, Composable>();
      composables.forEach(composable => composableMap.set(composable.id, composable));

      // Add project entries
      projects.forEach(project => {
        entries.push({
          id: `project-${project.id}`,
          date: project.createdAt,
          action: 'created',
          entityType: 'project',
          entityTitle: project.name,
          entityId: project.id,
          projectId: project.id,
          projectName: project.name
        });
      });

      // Add composable entries
      composables.forEach(composable => {
        const project = projectMap.get(composable.projectId);
        if (project) {
          entries.push({
            id: `composable-${composable.id}`,
            date: composable.createdAt,
            action: 'created',
            entityType: 'composable',
            entityTitle: composable.title,
            entityId: composable.id,
            composableId: composable.id,
            composableTitle: composable.title,
            projectId: project.id,
            projectName: project.name
          });
        }
      });

      // Add block entries
      blocks.forEach(block => {
        const composable = composableMap.get(block.composableId);
        const project = composable ? projectMap.get(composable.projectId) : null;
        
        if (composable && project) {
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
            case 'list':
              blockTitle = 'List Block';
              break;
            case 'divider':
              blockTitle = 'Divider Block';
              break;
            case 'markdown':
              blockTitle = block.content.markdownContent?.substring(0, 50) + '...' || 'Markdown Block';
              break;
            default:
              blockTitle = `${block.type} Block`;
          }

          // Add creation entry
          entries.push({
            id: `block-created-${block.id}`,
            date: block.createdAt,
            action: 'created',
            entityType: 'block',
            entityTitle: blockTitle,
            entityId: block.id,
            composableId: composable.id,
            composableTitle: composable.title,
            projectId: project.id,
            projectName: project.name
          });

          // Add update entry if different from creation date
          if (block.updatedAt && block.updatedAt.getTime() !== block.createdAt.getTime()) {
            entries.push({
              id: `block-updated-${block.id}`,
              date: block.updatedAt,
              action: 'updated',
              entityType: 'block',
              entityTitle: blockTitle,
              entityId: block.id,
              composableId: composable.id,
              composableTitle: composable.title,
              projectId: project.id,
              projectName: project.name
            });
          }
        }
      });

      // Add comment entries
      comments.forEach(comment => {
        const composable = composableMap.get(comment.composableId);
        const project = composable ? projectMap.get(composable.projectId) : null;
        
        if (composable && project) {
          const commentTitle = comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '');

          // Add creation entry
          entries.push({
            id: `comment-created-${comment.id}`,
            date: comment.createdAt,
            action: 'created',
            entityType: 'comment',
            entityTitle: `Comment: ${commentTitle}`,
            entityId: comment.id,
            composableId: composable.id,
            composableTitle: composable.title,
            projectId: project.id,
            projectName: project.name
          });

          // Add update entry if different from creation date
          if (comment.updatedAt && comment.updatedAt.getTime() !== comment.createdAt.getTime()) {
            entries.push({
              id: `comment-updated-${comment.id}`,
              date: comment.updatedAt,
              action: 'updated',
              entityType: 'comment',
              entityTitle: `Comment: ${commentTitle}`,
              entityId: comment.id,
              composableId: composable.id,
              composableTitle: composable.title,
              projectId: project.id,
              projectName: project.name
            });
          }
        }
      });

      // Add project settings entries
      projectSettings.forEach(settings => {
        const project = projectMap.get(settings.projectId);
        if (project) {
          // Add creation entry
          entries.push({
            id: `settings-created-${settings.id}`,
            date: settings.createdAt,
            action: 'created',
            entityType: 'settings',
            entityTitle: 'Project Settings',
            entityId: settings.id,
            projectId: project.id,
            projectName: project.name
          });

          // Add update entry if different from creation date
          if (settings.updatedAt && settings.updatedAt.getTime() !== settings.createdAt.getTime()) {
            entries.push({
              id: `settings-updated-${settings.id}`,
              date: settings.updatedAt,
              action: 'updated',
              entityType: 'settings',
              entityTitle: 'Project Settings',
              entityId: settings.id,
              projectId: project.id,
              projectName: project.name
            });
          }
        }
      });

      // Sort by date (newest first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistoryEntries(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleHistoryClick = (entry: HistoryEntry) => {
    if (entry.entityType === 'project') {
      // Navigate to project page
      router.push(`/project/${entry.projectId}`);
    } else if (entry.composableId) {
      // Navigate to the composable
      router.push(`/project/${entry.projectId}/composable/${entry.composableId}`);
    } else {
      // Fallback to project page
      router.push(`/project/${entry.projectId}`);
    }
    onClose();
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4l-5-4-1.5 7L12 7l-1.5 1L5 7l14 4z" />
          </svg>
        );
      case 'composable':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'block':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      case 'comment':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getActionBadge = (action: string) => {
    if (action === 'created') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Created
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Updated
        </span>
      );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              History
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
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Recent changes across all projects ({historyEntries.length} entries)
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="text-slate-500 dark:text-slate-400 text-center py-8">
              No history entries found
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {historyEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleHistoryClick(entry)}
                  className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getEntityIcon(entry.entityType)}
                        {getActionBadge(entry.action)}
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                          {entry.entityType}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-white mb-1">
                        {entry.entityTitle}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {entry.composableTitle ? (
                          <>in {entry.composableTitle} • {entry.projectName}</>
                        ) : (
                          <>in {entry.projectName}</>
                        )}
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
      </div>
    </div>
  );
}