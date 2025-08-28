'use client';

import { useState, useEffect } from 'react';
import { Project, projectDB } from '@/lib/db';
import ProjectWidget from '@/components/ProjectWidget';
import AddProjectModal from '@/components/AddProjectModal';
import Header from '@/components/Header';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const loadedProjects = await projectDB.getAllProjects();
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleAddProject = async (name: string, color: string) => {
    try {
      const newProject = await projectDB.addProject({
        name,
        color,
        position: { x: Math.random() * 400, y: Math.random() * 300 }
      });
      setProjects(prev => [...prev, newProject]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleUpdateProject = async (project: Project) => {
    try {
      await projectDB.updateProject(project);
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectDB.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 p-6">
          <div className="w-full h-full relative">
            {projects.map((project) => (
              <ProjectWidget
                key={project.id}
                project={project}
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
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

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
}
