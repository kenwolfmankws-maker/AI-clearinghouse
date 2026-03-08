/**
 * Project Panel Component
 * Manages project creation and selection
 */

class ProjectPanel {
  constructor() {
    this.currentProjectId = null;
    this.initEventListeners();
    this.loadProjects();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const toggleBtn = document.getElementById('toggleProjectPanel');
    const closeBtn = document.getElementById('closeProjectPanel');
    const createBtn = document.getElementById('createProjectBtn');
    const projectNameInput = document.getElementById('newProjectName');

    toggleBtn.addEventListener('click', () => this.showPanel());
    closeBtn.addEventListener('click', () => this.hidePanel());
    createBtn.addEventListener('click', () => this.createProject());

    projectNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createProject();
    });
  }

  /**
   * Show project panel
   */
  showPanel() {
    document.getElementById('projectPanel').style.display = 'flex';
  }

  /**
   * Hide project panel
   */
  hidePanel() {
    document.getElementById('projectPanel').style.display = 'none';
  }

  /**
   * Load and render projects
   */
  loadProjects() {
    const projects = projectManager.getAllProjects();
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
      container.innerHTML = '<div class="vs-empty-state">No projects yet. Create one to get started!</div>';
      return;
    }

    container.innerHTML = projects
      .map(project => this.createProjectItem(project))
      .join('');

    this.attachEventListeners();
  }

  /**
   * Create project item HTML
   */
  createProjectItem(project) {
    const date = fileManager.formatDate(project.createdAt);
    const isActive = this.currentProjectId === project.id;

    return `
      <div class="vs-project-item ${isActive ? 'active' : ''}" data-id="${project.id}">
        <div class="vs-project-info">
          <div class="vs-project-name">${project.name}</div>
          <div class="vs-project-meta">Created ${date} • ${project.recordings.length} recording(s)</div>
          ${project.description ? `<div class="vs-project-meta">${project.description}</div>` : ''}
        </div>
        <div class="vs-project-actions">
          <button class="vs-project-action-btn btn-select" data-id="${project.id}">Select</button>
          <button class="vs-project-action-btn btn-edit" data-id="${project.id}">Edit</button>
          <button class="vs-project-action-btn btn-delete" data-id="${project.id}">Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to project items
   */
  attachEventListeners() {
    // Select project
    document.querySelectorAll('.btn-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.selectProject(id);
      });
    });

    // Delete project
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm('Delete this project?')) {
          projectManager.deleteProject(id);
          this.loadProjects();
          showToast('Project deleted', 'success');
        }
      });
    });
  }

  /**
   * Create new project
   */
  createProject() {
    const nameInput = document.getElementById('newProjectName');
    const name = nameInput.value.trim();

    if (!name) {
      showToast('Project name is required', 'error');
      return;
    }

    projectManager.createProject(name);
    nameInput.value = '';
    this.loadProjects();
    showToast(`Project "${name}" created`, 'success');
  }

  /**
   * Select project
   */
  selectProject(projectId) {
    projectManager.setCurrentProject(projectId);
    this.currentProjectId = projectId;
    const project = projectManager.getProject(projectId);
    document.getElementById('currentProject').textContent = project.name;
    this.loadProjects();
    this.hidePanel();
    showToast(`Selected project: ${project.name}`, 'success');
  }
}

// Create global instance
const projectPanel = new ProjectPanel();
