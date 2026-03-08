/**
 * Project Manager - Handle project creation and management
 * Manages narration projects with multiple takes
 */

class ProjectManager {
  constructor() {
    this.storageKey = 'voice-studio-projects';
    this.currentProjectId = null;
    this.loadProjects();
  }

  /**
   * Get all projects from localStorage
   */
  loadProjects() {
    const stored = localStorage.getItem(this.storageKey);
    this.projects = stored ? JSON.parse(stored) : [];
    return this.projects;
  }

  /**
   * Save projects to localStorage
   */
  saveProjects() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
  }

  /**
   * Create new project
   */
  createProject(name, description = '') {
    const project = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
      recordings: [],
    };
    this.projects.push(project);
    this.saveProjects();
    return project;
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }

  /**
   * Get all projects
   */
  getAllProjects(includeArchived = false) {
    return includeArchived
      ? this.projects
      : this.projects.filter(p => !p.archived);
  }

  /**
   * Update project metadata
   */
  updateProject(projectId, updates) {
    const project = this.getProject(projectId);
    if (project) {
      Object.assign(project, updates, { updatedAt: Date.now() });
      this.saveProjects();
    }
    return project;
  }

  /**
   * Delete project
   */
  deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.saveProjects();
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }
  }

  /**
   * Archive project
   */
  archiveProject(projectId) {
    this.updateProject(projectId, { archived: true });
  }

  /**
   * Unarchive project
   */
  unarchiveProject(projectId) {
    this.updateProject(projectId, { archived: false });
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return this.currentProjectId
      ? this.getProject(this.currentProjectId)
      : null;
  }

  /**
   * Set current project
   */
  setCurrentProject(projectId) {
    if (this.getProject(projectId)) {
      this.currentProjectId = projectId;
      return true;
    }
    return false;
  }

  /**
   * Add recording to project
   */
  addRecordingToProject(projectId, recordingId, takeNumber = 1) {
    const project = this.getProject(projectId);
    if (project) {
      project.recordings.push({
        recordingId,
        takeNumber,
        addedAt: Date.now(),
        isBest: false,
      });
      project.updatedAt = Date.now();
      this.saveProjects();
    }
  }

  /**
   * Mark recording as best take
   */
  markBestTake(projectId, recordingId) {
    const project = this.getProject(projectId);
    if (project) {
      project.recordings.forEach(r => {
        r.isBest = r.recordingId === recordingId;
      });
      this.saveProjects();
    }
  }

  /**
   * Get best take for project
   */
  getBestTake(projectId) {
    const project = this.getProject(projectId);
    if (project) {
      return project.recordings.find(r => r.isBest);
    }
    return null;
  }
}

// Create global instance
const projectManager = new ProjectManager();
