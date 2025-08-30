export type BlockType = 
  | 'header' 
  | 'text' 
  | 'list' 
  | 'divider' 
  | 'collapsible-list' 
  | 'text-block';

export type ListType = 'bullet' | 'numbered' | 'checklist';
export type HeaderSize = 'h1' | 'h2' | 'h3';
export type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  link?: string; // URL for links
}

export interface RichTextSpan {
  text: string;
  style?: TextStyle;
}

export interface RichText {
  spans: RichTextSpan[];
}

export interface ListItem {
  id: string;
  content: RichText;
  checked?: boolean; // for checklist items
  children?: ListItem[]; // for nested lists
}

export interface ContentBlock {
  id: string;
  composableId: string;
  type: BlockType;
  position: number;
  content: {
    // Header block
    headerSize?: HeaderSize;
    headerText?: RichText;
    
    // Text block
    text?: RichText;
    
    // List block
    listType?: ListType;
    listItems?: ListItem[];
    
    // Divider block
    dividerStyle?: DividerStyle;
    
    // Collapsible list block
    title?: RichText;
    isExpanded?: boolean;
    items?: ListItem[];
    
    // Text block (longer content)
    textContent?: RichText;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  blockId: string;
  composableId: string;
  authorType: string; // from project settings commentator types
  authorName: string;
  content: string;
  position?: { start: number; end: number }; // text selection position
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ContentDB {
  private dbName = 'ProjectsDB';
  private version = 3;
  private blocksStoreName = 'contentBlocks';
  private commentsStoreName = 'comments';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Existing stores
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('composables')) {
          const composableStore = db.createObjectStore('composables', { keyPath: 'id' });
          composableStore.createIndex('projectId', 'projectId', { unique: false });
          composableStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('projectSettings')) {
          const settingsStore = db.createObjectStore('projectSettings', { keyPath: 'id' });
          settingsStore.createIndex('projectId', 'projectId', { unique: true });
        }
        
        // New content blocks store
        if (!db.objectStoreNames.contains(this.blocksStoreName)) {
          const blocksStore = db.createObjectStore(this.blocksStoreName, { keyPath: 'id' });
          blocksStore.createIndex('composableId', 'composableId', { unique: false });
          blocksStore.createIndex('position', 'position', { unique: false });
        }
        
        // Comments store
        if (!db.objectStoreNames.contains(this.commentsStoreName)) {
          const commentsStore = db.createObjectStore(this.commentsStoreName, { keyPath: 'id' });
          commentsStore.createIndex('blockId', 'blockId', { unique: false });
          commentsStore.createIndex('composableId', 'composableId', { unique: false });
        }
      };
    });
  }

  // Content Blocks Operations
  async getBlocksByComposable(composableId: string): Promise<ContentBlock[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStoreName, 'readonly');
      const store = transaction.objectStore(this.blocksStoreName);
      const index = store.index('composableId');
      const request = index.getAll(composableId);

      request.onsuccess = () => {
        const blocks = request.result.map((block: ContentBlock & { createdAt: string | Date; updatedAt: string | Date }) => ({
          ...block,
          createdAt: new Date(block.createdAt),
          updatedAt: new Date(block.updatedAt)
        }));
        // Sort by position
        blocks.sort((a, b) => a.position - b.position);
        resolve(blocks);
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
      const transaction = db.transaction(this.blocksStoreName, 'readwrite');
      const store = transaction.objectStore(this.blocksStoreName);
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
      const transaction = db.transaction(this.blocksStoreName, 'readwrite');
      const store = transaction.objectStore(this.blocksStoreName);
      const request = store.put(updatedBlock);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBlock(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStoreName, 'readwrite');
      const store = transaction.objectStore(this.blocksStoreName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async reorderBlocks(composableId: string, blockIds: string[]): Promise<void> {
    const blocks = await this.getBlocksByComposable(composableId);
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.blocksStoreName, 'readwrite');
      const store = transaction.objectStore(this.blocksStoreName);
      
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

  // Comments Operations (for future implementation)
  async getCommentsByBlock(blockId: string): Promise<Comment[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStoreName, 'readonly');
      const store = transaction.objectStore(this.commentsStoreName);
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

  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.commentsStoreName, 'readwrite');
      const store = transaction.objectStore(this.commentsStoreName);
      const request = store.add(newComment);

      request.onsuccess = () => resolve(newComment);
      request.onerror = () => reject(request.error);
    });
  }
}

export const contentDB = new ContentDB();