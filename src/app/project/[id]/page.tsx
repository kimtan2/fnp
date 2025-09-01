'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Composable, ProjectSettings } from '@/lib/types';
import { unifiedDB } from '@/lib/unified-db';
import ProjectHeader from '@/components/ProjectHeader';
import ComposableCard from '@/components/ComposableCard';
import AddComposableModal from '@/components/AddComposableModal';
import ProjectSettingsModal from '@/components/ProjectSettingsModal';
import HistoryPage from '@/components/HistoryPage';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [composables, setComposables] = useState<Composable[]>([]);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, composablesData, settingsData] = await Promise.all([
        unifiedDB.getAllProjects().then(projects => projects.find(p => p.id === projectId)),
        unifiedDB.getComposablesByProject(projectId),
        unifiedDB.getProjectSettings(projectId)
      ]);

      if (!projectData) {
        router.push('/');
        return;
      }

      setProject(projectData);
      setComposables(composablesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComposable = async (composableData: Omit<Composable, 'id' | 'createdAt' | 'projectId'>) => {
    try {
      const newComposable = await unifiedDB.addComposable({
        ...composableData,
        projectId
      });
      setComposables(prev => [...prev, newComposable]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add composable:', error);
    }
  };

  const handleUpdateComposable = async (composable: Composable) => {
    try {
      await unifiedDB.updateComposable(composable);
      setComposables(prev => prev.map(c => c.id === composable.id ? composable : c));
    } catch (error) {
      console.error('Failed to update composable:', error);
    }
  };

  const handleDeleteComposable = async (id: string) => {
    try {
      await unifiedDB.deleteComposable(id);
      setComposables(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete composable:', error);
    }
  };

  const handleUpdateSettings = async (newSettings: ProjectSettings) => {
    try {
      await unifiedDB.updateProjectSettings(projectId, newSettings);
      setSettings(newSettings);
      setIsSettingsModalOpen(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ProjectHeader
        project={project}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onHistoryClick={() => setIsHistoryModalOpen(true)}
        onBack={() => router.push('/')}
      />
      
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 p-6">
          <div className="w-full h-full relative">
            {composables.map((composable) => (
              <ComposableCard
                key={composable.id}
                composable={composable}
                settings={settings}
                onUpdate={handleUpdateComposable}
                onDelete={handleDeleteComposable}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </main>

      <AddComposableModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddComposable={handleAddComposable}
        settings={settings}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <HistoryPage
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}