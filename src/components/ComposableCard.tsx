'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Composable, ProjectSettings } from '@/lib/types';

interface ComposableCardProps {
  composable: Composable;
  settings: ProjectSettings | null;
  onUpdate: (composable: Composable) => void;
  onDelete: (id: string) => void;
}

const colors = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', 
  '#10B981', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#84CC16', '#F43F5E', '#8B5CF6'
];

export default function ComposableCard({ 
  composable, 
  settings, 
  onUpdate, 
  onDelete 
}: ComposableCardProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(composable.title);
  const [editDescription, setEditDescription] = useState(composable.description);
  const [editStatus, setEditStatus] = useState(composable.status);
  const [editColor, setEditColor] = useState(composable.color);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const statusOptions = settings?.statusTypes || ['Projekt', 'Sofort', 'Beobachten', 'To-Do', 'Ministerium Überwachung'];

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || showMenu) return;
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setDragStartTime(Date.now());
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && cardRef.current) {
        const container = cardRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newX = e.clientX - containerRect.left - dragOffset.x;
          const newY = e.clientY - containerRect.top - dragOffset.y;
          
          const maxX = containerRect.width - 320;
          const maxY = containerRect.height - 200;
          
          const constrainedX = Math.max(0, Math.min(newX, maxX));
          const constrainedY = Math.max(0, Math.min(newY, maxY));
          
          onUpdate({
            ...composable,
            position: { x: constrainedX, y: constrainedY }
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const dragDuration = Date.now() - dragStartTime;
        if (dragDuration < 200) {
          router.push(`/project/${composable.projectId}/composable/${composable.id}`);
        }
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, composable, onUpdate]);

  const handleEditSubmit = () => {
    if (editTitle.trim() && editDescription.trim() && editStatus) {
      onUpdate({
        ...composable,
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
        color: editColor
      });
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleEditCancel = () => {
    setEditTitle(composable.title);
    setEditDescription(composable.description);
    setEditStatus(composable.status);
    setEditColor(composable.color);
    setIsEditing(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`absolute w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl border border-slate-200 dark:border-slate-700 cursor-move transition-all duration-200 ${
          isDragging ? 'scale-105 shadow-2xl rotate-2' : ''
        }`}
        style={{
          left: composable.position.x,
          top: composable.position.y
        }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="h-2 rounded-t-xl"
          style={{ backgroundColor: composable.color }}
        />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg leading-tight">
                {composable.title}
              </h3>
              {composable.status && composable.status !== 'No Status' && (
                <div className="flex items-center space-x-2 mt-1">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getStatusColor(composable.status) }}
                  >
                    {composable.status}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <circle cx="8" cy="2" r="1.5"/>
                <circle cx="8" cy="8" r="1.5"/>
                <circle cx="8" cy="14" r="1.5"/>
              </svg>
            </button>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {composable.description}
          </p>
          
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Created {composable.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {showMenu && (
        <div
          className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
          style={{
            left: composable.position.x + 320,
            top: composable.position.y,
          }}
        >
          <button
            onClick={() => {
              setIsEditing(true);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => {
              onDelete(composable.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
                Edit Composable
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    {statusOptions.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          editColor === color
                            ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleEditCancel}
                    className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
}