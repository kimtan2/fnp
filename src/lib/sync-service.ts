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

      // Create ID mapping for projects (old ID -> new ID)
      const projectIdMapping = new Map<string, string>();
      
      const existingProjects = await unifiedDB.getAllProjects();
      const existingProjectIds = new Set(existingProjects.map(p => p.id));
      const existingProjectNames = new Set(existingProjects.map(p => p.name.toLowerCase()));

      console.log('Importing projects...');
      for (const project of data.projects) {
        if (existingProjectIds.has(project.id)) {
          conflicts.push(`Project "${project.name}" already exists (same ID)`);
          projectIdMapping.set(project.id, project.id); // Use existing ID
        } else if (existingProjectNames.has(project.name.toLowerCase())) {
          conflicts.push(`Project "${project.name}" already exists (same name)`);
          // Find the existing project with this name
          const existingProject = existingProjects.find(p => p.name.toLowerCase() === project.name.toLowerCase());
          if (existingProject) {
            projectIdMapping.set(project.id, existingProject.id);
          }
        } else {
          // Create new project
          try {
            const newProject = await unifiedDB.addProject({
              name: project.name,
              color: project.color,
              position: project.position
            });
            projectIdMapping.set(project.id, newProject.id);
            imported++;
            console.log(`Created new project: ${project.name} (${project.id} -> ${newProject.id})`);
          } catch (error) {
            conflicts.push(`Failed to create project "${project.name}": ${error}`);
          }
        }
      }

      console.log('Project ID mapping:', Object.fromEntries(projectIdMapping));

      // Create ID mapping for composables (old ID -> new ID)
      const composableIdMapping = new Map<string, string>();

      console.log('Importing composables...');
      for (const composable of data.composables) {
        const newProjectId = projectIdMapping.get(composable.projectId);
        if (!newProjectId) {
          conflicts.push(`Composable "${composable.title}" references non-existent project`);
          continue;
        }

        try {
          // Check if composable already exists
          const existingComposables = await unifiedDB.getComposablesByProject(newProjectId);
          const existingComposable = existingComposables.find(c => 
            c.title.toLowerCase() === composable.title.toLowerCase()
          );

          if (existingComposable) {
            conflicts.push(`Composable "${composable.title}" already exists in project`);
            composableIdMapping.set(composable.id, existingComposable.id);
          } else {
            const newComposable = await unifiedDB.addComposable({
              projectId: newProjectId, // Use mapped project ID
              title: composable.title,
              description: composable.description,
              status: composable.status,
              color: composable.color,
              position: composable.position
            });
            composableIdMapping.set(composable.id, newComposable.id);
            imported++;
            console.log(`Created new composable: ${composable.title} (${composable.id} -> ${newComposable.id})`);
          }
        } catch (error) {
          conflicts.push(`Composable "${composable.title}" could not be imported: ${error}`);
        }
      }

      console.log('Composable ID mapping:', Object.fromEntries(composableIdMapping));

      console.log('Importing content blocks...');
      for (const block of data.contentBlocks) {
        const newComposableId = composableIdMapping.get(block.composableId);
        if (!newComposableId) {
          conflicts.push(`Content block references non-existent composable`);
          continue;
        }

        try {
          await unifiedDB.addBlock({
            composableId: newComposableId, // Use mapped composable ID
            type: block.type,
            position: block.position,
            parentBlockId: block.parentBlockId,
            overlayComment: block.overlayComment,
            hasRückseite: block.hasRückseite,
            isFlipped: block.isFlipped,
            content: block.content
          });
          imported++;
        } catch (error) {
          conflicts.push(`Content block could not be imported: ${error}`);
        }
      }

      console.log('Importing comments...');
      for (const comment of data.comments) {
        const newComposableId = composableIdMapping.get(comment.composableId);
        if (!newComposableId) {
          conflicts.push(`Comment references non-existent composable`);
          continue;
        }

        try {
          await unifiedDB.addComment({
            blockId: comment.blockId, // Note: This might also need mapping if blocks are recreated
            composableId: newComposableId, // Use mapped composable ID
            authorType: comment.authorType,
            authorName: comment.authorName,
            content: comment.content,
            position: comment.position,
            resolved: comment.resolved,
            color: comment.color,
            showIndicator: comment.showIndicator
          });
          imported++;
        } catch (error) {
          conflicts.push(`Comment could not be imported: ${error}`);
        }
      }

      console.log('Importing project settings...');
      for (const settings of data.projectSettings) {
        const newProjectId = projectIdMapping.get(settings.projectId);
        if (!newProjectId) {
          conflicts.push(`Project settings reference non-existent project`);
          continue;
        }

        try {
          await unifiedDB.updateProjectSettings(newProjectId, {
            statusTypes: settings.statusTypes,
            commentatorTypes: settings.commentatorTypes
          });
          imported++;
        } catch (error) {
          conflicts.push(`Project settings could not be imported: ${error}`);
        }
      }

      console.log(`Import completed: ${imported} items imported, ${conflicts.length} conflicts`);
      return { conflicts, imported };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(`Invalid backup file format: ${error}`);
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