import { Project } from '@/lib/db';
import { Composable } from '@/lib/composables';

interface ComposableHeaderProps {
  project: Project;
  composable: Composable;
  onBack: () => void;
}

export default function ComposableHeader({ project, composable, onBack }: ComposableHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'todo':
        return 'bg-slate-500';
      case 'in progress':
        return 'bg-yellow-500';
      case 'done':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: project.color }}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-4l-5-4-1.5 7L12 7l-1.5 1L5 7l14 4z"
                  />
                </svg>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <span>{project.name}</span>
                <span>/</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: composable.color }}
                  />
                  <span className="font-medium text-slate-800 dark:text-white">
                    {composable.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span 
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(composable.status)}`}
            >
              {composable.status}
            </span>
            
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Notion-like editor</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}