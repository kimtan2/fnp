// Unified Database for Projects, Composables, and Content
import type { 
  Project,
  Composable, 
  ProjectSettings,
  ContentBlock,
  Comment
} from './types';

class UnifiedDB {
  private dbName = 'ProjectsDB';
  private version = 3; // Updated version to handle all stores
  
  // Store names
  private projectsStore = 'projects';
  private composablesStore = 'composables';
  private settingsStore = 'projectSettings';
  private blocksStore = 'contentBlocks';
  private commentsStore = 'comments';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Projects store
        if (!db.objectStoreNames.contains(this.projectsStore)) {
          const projectStore = db.createObjectStore(this.projectsStore, { keyPath: 'id' });
          projectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Composables store  
        if (!db.objectStoreNames.contains(this.composablesStore)) {
          const composableStore = db.createObjectStore(this.composablesStore, { keyPath: 'id' });
          composableStore.createIndex('projectId', 'projectId', { unique: false });
          composableStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Settings store
        if (!db.objectStoreNames.contains(this.settingsStore)) {
          const settingsStore = db.createObjectStore(this.settingsStore, { keyPath: 'id' });
          settingsStore.createIndex('projectId', 'projectId', { unique: true });
        }
        
        // Content blocks store
        if (!db.objectStoreNames.contains(this.blocksStore)) {
          const blocksStore = db.createObjectStore(this.blocksStore, { keyPath: 'id' });
          blocksStore.createIndex('composableId', 'composableId', { unique: false });
          blocksStore.createIndex('position', 'position', { unique: false });
        }
        
        // Comments store
        if (!db.objectStoreNames.contains(this.commentsStore)) {
          const commentsStore = db.createObjectStore(this.commentsStore, { keyPath: 'id' });
          commentsStore.createIndex('blockId', 'blockId', { unique: false });
          commentsStore.createIndex('composableId', 'composableId', { unique: false });
        }
      };
    });
  }

  // Projects methods
  async getAllProjects(): Promise<Project[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.projectsStore, 'readonly');
      const store = transaction.objectStore(this.projectsStore);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result.map((project: Project & { createdAt: string | Date }) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.projectsStore, 'readwrite');
      const store = transaction.objectStore(this.projectsStore);
      const request = store.add(newProject);

      request.onsuccess = () => resolve(newProject);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProject(project: Project): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.projectsStore, 'readwrite');
      const store = transaction.objectStore(this.projectsStore);
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.projectsStore, 'readwrite');
      const store = transaction.objectStore(this.projectsStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Composables methods
  async getComposablesByProject(projectId: string): Promise<Composable[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composablesStore, 'readonly');
      const store = transaction.objectStore(this.composablesStore);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const composables = request.result.map((composable: Composable & { createdAt: string | Date }) => ({
          ...composable,
          createdAt: new Date(composable.createdAt)
        }));
        resolve(composables);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addComposable(composable: Omit<Composable, 'id' | 'createdAt'>): Promise<Composable> {
    const newComposable: Composable = {
      ...composable,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      position: { x: Math.random() * 400, y: Math.random() * 300 }
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composablesStore, 'readwrite');
      const store = transaction.objectStore(this.composablesStore);
      const request = store.add(newComposable);

      request.onsuccess = () => resolve(newComposable);
      request.onerror = () => reject(request.error);
    });
  }

  async updateComposable(composable: Composable): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composablesStore, 'readwrite');
      const store = transaction.objectStore(this.composablesStore);
      const request = store.put(composable);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteComposable(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composablesStore, 'readwrite');
      const store = transaction.objectStore(this.composablesStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllComposables(): Promise<Composable[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composablesStore, 'readonly');
      const store = transaction.objectStore(this.composablesStore);
      const request = store.getAll();

      request.onsuccess = () => {
        const composables = request.result.map((composable: Composable & { createdAt: string | Date }) => ({
          ...composable,
          createdAt: new Date(composable.createdAt)
        }));
        resolve(composables);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Settings methods
  async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.settingsStore, 'readonly');
      const store = transaction.objectStore(this.settingsStore);
      const index = store.index('projectId');
      const request = index.get(projectId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            ...result,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt)
          });
        } else {
          const defaultSettings: ProjectSettings = {
            id: crypto.randomUUID(),
            projectId,
            statusTypes: ['Projekt', 'Sofort', 'Beobachten', 'To-Do', 'Ministerium Überwachung'],
            statusColors: {
              'Projekt': '#3B82F6',
              'Sofort': '#EF4444', 
              'To-Do': '#6B7280',
              'Ministerium Überwachung': '#8B5CF6'
            },
            commentatorTypes: ['Developer', 'Designer', 'Product Manager', 'QA'],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          resolve(defaultSettings);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateProjectSettings(projectId: string, settings: Omit<ProjectSettings, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<ProjectSettings> {
    const existingSettings = await this.getProjectSettings(projectId);
    
    const updatedSettings: ProjectSettings = {
      id: existingSettings?.id || crypto.randomUUID(),
      projectId,
      ...settings,
      createdAt: existingSettings?.createdAt || new Date(),
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.settingsStore, 'readwrite');
      const store = transaction.objectStore(this.settingsStore);
      const request = store.put(updatedSettings);

      request.onsuccess = () => resolve(updatedSettings);
      request.onerror = () => reject(request.error);
    });
  }

  // Content blocks methods
  async getBlocksByComposable(composableId: string): Promise<ContentBlock[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readonly');
      const store = transaction.objectStore(this.blocksStore);
      const index = store.index('composableId');
      const request = index.getAll(composableId);

      request.onsuccess = () => {
        const blocks = request.result.map((block: ContentBlock & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...block,
          createdAt: new Date(block.createdAt),
          updatedAt: new Date(block.updatedAt)
        }));
        
        // KEY FIX: Filter out nested blocks - they should only exist within parent blocks
        const topLevelBlocks = blocks.filter(block => !block.parentBlockId);
        
        topLevelBlocks.sort((a, b) => a.position - b.position);
        resolve(topLevelBlocks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addBlock(block: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentBlock> {
    const newBlock: ContentBlock = {
      ...block,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readwrite');
      const store = transaction.objectStore(this.blocksStore);
      const request = store.add(newBlock);

      request.onsuccess = () => resolve(newBlock);
      request.onerror = () => reject(request.error);
    });
  }

  async updateBlock(block: ContentBlock): Promise<void> {
    const updatedBlock = {
      ...block,
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readwrite');
      const store = transaction.objectStore(this.blocksStore);
      const request = store.put(updatedBlock);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBlock(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readwrite');
      const store = transaction.objectStore(this.blocksStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async reorderBlocks(composableId: string, blockIds: string[]): Promise<void> {
    const blocks = await this.getBlocksByComposable(composableId);
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readwrite');
      const store = transaction.objectStore(this.blocksStore);
      
      let completed = 0;
      const total = blockIds.length;

      blockIds.forEach((blockId, index) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
          const updatedBlock = {
            ...block,
            position: index,
            updatedAt: new Date()
          };
          
          const request = store.put(updatedBlock);
          request.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          request.onerror = () => reject(request.error);
        }
      });
    });
  }

  async getAllBlocks(): Promise<ContentBlock[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStore, 'readonly');
      const store = transaction.objectStore(this.blocksStore);
      const request = store.getAll();

      request.onsuccess = () => {
        const blocks = request.result.map((block: ContentBlock & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...block,
          createdAt: new Date(block.createdAt),
          updatedAt: new Date(block.updatedAt)
        }));
        resolve(blocks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Comments methods
  async getCommentsByBlock(blockId: string): Promise<Comment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readonly');
      const store = transaction.objectStore(this.commentsStore);
      const index = store.index('blockId');
      const request = index.getAll(blockId);

      request.onsuccess = () => {
        const comments = request.result.map((comment: Comment & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }));
        resolve(comments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCommentsByComposable(composableId: string): Promise<Comment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readonly');
      const store = transaction.objectStore(this.commentsStore);
      const index = store.index('composableId');
      const request = index.getAll(composableId);

      request.onsuccess = () => {
        const comments = request.result.map((comment: Comment & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }));
        resolve(comments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readwrite');
      const store = transaction.objectStore(this.commentsStore);
      const request = store.add(newComment);

      request.onsuccess = () => resolve(newComment);
      request.onerror = () => reject(request.error);
    });
  }

  async updateComment(comment: Comment): Promise<void> {
    const updatedComment = {
      ...comment,
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readwrite');
      const store = transaction.objectStore(this.commentsStore);
      const request = store.put(updatedComment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteComment(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readwrite');
      const store = transaction.objectStore(this.commentsStore);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllComments(): Promise<Comment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStore, 'readonly');
      const store = transaction.objectStore(this.commentsStore);
      const request = store.getAll();

      request.onsuccess = () => {
        const comments = request.result.map((comment: Comment & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }));
        resolve(comments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjectSettings(): Promise<ProjectSettings[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.settingsStore, 'readonly');
      const store = transaction.objectStore(this.settingsStore);
      const request = store.getAll();

      request.onsuccess = () => {
        const settings = request.result.map((setting: ProjectSettings & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...setting,
          createdAt: new Date(setting.createdAt),
          updatedAt: new Date(setting.updatedAt)
        }));
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const unifiedDB = new UnifiedDB();