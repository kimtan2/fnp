'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';

interface ProjectWidgetProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function ProjectWidget({ project, onUpdate, onDelete }: ProjectWidgetProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editColor, setEditColor] = useState(project.color);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const widgetRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', 
    '#10B981', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#84CC16', '#F43F5E', '#8B5CF6'
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || showMenu) return;
    
    const rect = widgetRef.current?.getBoundingClientRect();
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
      if (isDragging && widgetRef.current) {
        const container = widgetRef.current.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newX = e.clientX - containerRect.left - dragOffset.x;
          const newY = e.clientY - containerRect.top - dragOffset.y;
          
          const maxX = containerRect.width - 120;
          const maxY = containerRect.height - 120;
          
          const constrainedX = Math.max(0, Math.min(newX, maxX));
          const constrainedY = Math.max(0, Math.min(newY, maxY));
          
          onUpdate({
            ...project,
            position: { x: constrainedX, y: constrainedY }
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        const dragDuration = Date.now() - dragStartTime;
        if (dragDuration < 200) {
          router.push(`/project/${project.id}`);
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
  }, [isDragging, dragOffset, project, onUpdate]);

  const handleEditSubmit = () => {
    if (editName.trim()) {
      onUpdate({
        ...project,
        name: editName.trim(),
        color: editColor
      });
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleEditCancel = () => {
    setEditName(project.name);
    setEditColor(project.color);
    setIsEditing(false);
  };

  return (
    <>
      <div
        ref={widgetRef}
        className={`absolute w-32 h-32 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-move ${
          isDragging ? 'scale-105 shadow-2xl' : ''
        }`}
        style={{
          left: project.position.x,
          top: project.position.y,
          backgroundColor: project.color,
          transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center relative">
          <div className="text-center p-4">
            <h3 className="text-white font-semibold text-sm leading-tight text-center break-words">
              {project.name}
            </h3>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-colors"
          >
            <svg
              className="w-3 h-3 text-gray-600"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="2" r="1.5"/>
              <circle cx="8" cy="8" r="1.5"/>
              <circle cx="8" cy="14" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {showMenu && (
        <div
          className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
          style={{
            left: project.position.x + 140,
            top: project.position.y,
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
              onDelete(project.id);
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
                Edit Project
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                    autoFocus
                  />
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