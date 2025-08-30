import { unifiedDB } from './unified-db';
import type { Project, Composable, ContentBlock, Comment, ProjectSettings } from './types';

export interface SyncData {
  version: string;
  exportDate: Date;
  projects: Project[];
  composables: Composable[];
  contentBlocks: ContentBlock[];
  comments: Comment[];
  projectSettings: ProjectSettings[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

class SyncService {
  private async getAllData(): Promise<SyncData> {
    const [projects, composables, contentBlocks, comments, projectSettings] = await Promise.all([
      unifiedDB.getAllProjects(),
      unifiedDB.getAllComposables(),
      unifiedDB.getAllBlocks(),
      unifiedDB.getAllComments(),
      unifiedDB.getAllProjectSettings()
    ]);

    return {
      version: '1.0.0',
      exportDate: new Date(),
      projects,
      composables,
      contentBlocks,
      comments,
      projectSettings
    };
  }

  async exportToJSON(): Promise<string> {
    const data = await this.getAllData();
    return JSON.stringify(data, null, 2);
  }

  async importFromJSON(jsonData: string): Promise<{ conflicts: string[], imported: number }> {
    try {
      const data: SyncData = JSON.parse(jsonData);
      const conflicts: string[] = [];
      let imported = 0;

      const existingProjects = await unifiedDB.getAllProjects();
      const existingProjectIds = new Set(existingProjects.map(p => p.id));

      for (const project of data.projects) {
        if (existingProjectIds.has(project.id)) {
          conflicts.push(`Project "${project.name}" already exists`);
        } else {
          await unifiedDB.addProject({
            name: project.name,
            color: project.color,
            position: project.position
          });
          imported++;
        }
      }

      for (const composable of data.composables) {
        try {
          await unifiedDB.addComposable({
            projectId: composable.projectId,
            title: composable.title,
            description: composable.description,
            status: composable.status,
            color: composable.color,
            position: composable.position
          });
          imported++;
        } catch {
          conflicts.push(`Composable "${composable.title}" could not be imported`);
        }
      }

      for (const block of data.contentBlocks) {
        try {
          await unifiedDB.addBlock({
            composableId: block.composableId,
            type: block.type,
            position: block.position,
            parentBlockId: block.parentBlockId,
            overlayComment: block.overlayComment,
            hasRückseite: block.hasRückseite,
            isFlipped: block.isFlipped,
            content: block.content
          });
          imported++;
        } catch {
          conflicts.push(`Content block could not be imported`);
        }
      }

      for (const comment of data.comments) {
        try {
          await unifiedDB.addComment({
            blockId: comment.blockId,
            composableId: comment.composableId,
            authorType: comment.authorType,
            authorName: comment.authorName,
            content: comment.content,
            position: comment.position,
            resolved: comment.resolved,
            color: comment.color,
            showIndicator: comment.showIndicator
          });
          imported++;
        } catch {
          conflicts.push(`Comment could not be imported`);
        }
      }

      return { conflicts, imported };
    } catch {
      throw new Error('Invalid backup file format');
    }
  }

  async clearAllData(): Promise<void> {
    const projects = await unifiedDB.getAllProjects();
    
    for (const project of projects) {
      const composables = await unifiedDB.getComposablesByProject(project.id);
      
      for (const composable of composables) {
        const blocks = await unifiedDB.getBlocksByComposable(composable.id);
        const comments = await unifiedDB.getCommentsByComposable(composable.id);
        
        for (const comment of comments) {
          await unifiedDB.deleteComment(comment.id);
        }
        
        for (const block of blocks) {
          await unifiedDB.deleteBlock(block.id);
        }
        
        await unifiedDB.deleteComposable(composable.id);
      }
      
      await unifiedDB.deleteProject(project.id);
    }
  }
}

export const syncService = new SyncService();