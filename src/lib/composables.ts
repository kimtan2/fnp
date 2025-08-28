export interface Composable {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  color: string;
  position: { x: number; y: number };
  createdAt: Date;
}

export interface ProjectSettings {
  id: string;
  projectId: string;
  statusTypes: string[];
  commentatorTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

class ComposableDB {
  private dbName = 'ProjectsDB';
  private version = 2;
  private composableStoreName = 'composables';
  private settingsStoreName = 'projectSettings';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.composableStoreName)) {
          const composableStore = db.createObjectStore(this.composableStoreName, { keyPath: 'id' });
          composableStore.createIndex('projectId', 'projectId', { unique: false });
          composableStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.settingsStoreName)) {
          const settingsStore = db.createObjectStore(this.settingsStoreName, { keyPath: 'id' });
          settingsStore.createIndex('projectId', 'projectId', { unique: true });
        }
      };
    });
  }

  async getComposablesByProject(projectId: string): Promise<Composable[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composableStoreName, 'readonly');
      const store = transaction.objectStore(this.composableStoreName);
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
      const transaction = db.transaction(this.composableStoreName, 'readwrite');
      const store = transaction.objectStore(this.composableStoreName);
      const request = store.add(newComposable);

      request.onsuccess = () => resolve(newComposable);
      request.onerror = () => reject(request.error);
    });
  }

  async updateComposable(composable: Composable): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composableStoreName, 'readwrite');
      const store = transaction.objectStore(this.composableStoreName);
      const request = store.put(composable);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteComposable(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.composableStoreName, 'readwrite');
      const store = transaction.objectStore(this.composableStoreName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProjectSettings(projectId: string): Promise<ProjectSettings | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.settingsStoreName, 'readonly');
      const store = transaction.objectStore(this.settingsStoreName);
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
            statusTypes: ['Todo', 'In Progress', 'Done'],
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
      const transaction = db.transaction(this.settingsStoreName, 'readwrite');
      const store = transaction.objectStore(this.settingsStoreName);
      const request = store.put(updatedSettings);

      request.onsuccess = () => resolve(updatedSettings);
      request.onerror = () => reject(request.error);
    });
  }
}

export const composableDB = new ComposableDB();