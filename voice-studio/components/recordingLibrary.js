/**
 * Recording Library Component
 * Manages display and interaction with saved recordings
 */

class RecordingLibrary {
  constructor() {
    this.recordings = [];
    this.filteredRecordings = [];
    this.searchQuery = '';
    this.sortBy = 'date-desc';
    this.currentEditingId = null;
    this.initEventListeners();
    this.loadRecordings();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const searchInput = document.getElementById('searchRecordings');
    const sortSelect = document.getElementById('sortRecordings');

    searchInput.addEventListener('input', (e) => this.search(e.target.value));
    sortSelect.addEventListener('change', (e) => this.sort(e.target.value));
  }

  /**
   * Load all recordings
   */
  async loadRecordings() {
    this.recordings = await fileManager.getAllRecordings();
    this.applyFilters();
    this.render();
  }

  /**
   * Search recordings
   */
  search(query) {
    this.searchQuery = query.toLowerCase();
    this.applyFilters();
    this.render();
  }

  /**
   * Sort recordings
   */
  sort(sortBy) {
    this.sortBy = sortBy;
    this.applyFilters();
    this.render();
  }

  /**
   * Apply search and sort filters
   */
  applyFilters() {
    let filtered = [...this.recordings];

    // Search filter
    if (this.searchQuery) {
      filtered = filtered.filter(
        r => r.name.toLowerCase().includes(this.searchQuery) ||
             r.filename?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'date-asc':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'name':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    this.filteredRecordings = filtered;
  }

  /**
   * Render recording list
   */
  render() {
    const container = document.getElementById('recordingsList');

    if (this.filteredRecordings.length === 0) {
      container.innerHTML = '<div class="vs-empty-state">No recordings found</div>';
      return;
    }

    container.innerHTML = this.filteredRecordings
      .map(recording => this.createRecordingItem(recording))
      .join('');

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Create recording item HTML
   */
  createRecordingItem(recording) {
    const duration = fileManager.formatDuration(recording.duration || 0);
    const date = fileManager.formatDate(recording.timestamp);
    const size = fileManager.formatFileSize(recording.size || 0);

    return `
      <div class="vs-recording-item" data-id="${recording.id}">
        <div class="vs-recording-item-header">
          <span class="vs-recording-name">${recording.name || recording.filename || 'Untitled'}</span>
          <button class="vs-recording-favorite" data-id="${recording.id}" title="Mark as favorite">
            ${recording.favorite ? '⭐' : '☆'}
          </button>
        </div>
        <div class="vs-recording-meta">
          <div class="vs-recording-meta-item">
            <span class="vs-recording-meta-label">Duration</span>
            <span class="vs-recording-meta-value">${duration}</span>
          </div>
          <div class="vs-recording-meta-item">
            <span class="vs-recording-meta-label">Date</span>
            <span class="vs-recording-meta-value">${date}</span>
          </div>
          <div class="vs-recording-meta-item">
            <span class="vs-recording-meta-label">Size</span>
            <span class="vs-recording-meta-value">${size}</span>
          </div>
          <div class="vs-recording-meta-item">
            <span class="vs-recording-meta-label">Microphone</span>
            <span class="vs-recording-meta-value">${recording.micLabel || 'Default'}</span>
          </div>
        </div>
        <div class="vs-recording-actions">
          <button class="vs-recording-action-btn btn-play" data-id="${recording.id}">Play</button>
          <button class="vs-recording-action-btn btn-rename" data-id="${recording.id}">Rename</button>
          <button class="vs-recording-action-btn btn-download" data-id="${recording.id}">Download</button>
          <button class="vs-recording-action-btn btn-delete" data-id="${recording.id}">Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to recording items
   */
  attachEventListeners() {
    // Play buttons
    document.querySelectorAll('.btn-play').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const recording = await fileManager.getRecording(id);
        if (recording) {
          const blob = recording.blob;
          playbackControls.loadAudio(blob, recording.duration);
          document.getElementById('playbackControls').style.display = 'flex';
          document.getElementById('recordingMetadata').style.display = 'grid';
          document.getElementById('metaDuration').textContent = fileManager.formatDuration(recording.duration);
          document.getElementById('metaFileSize').textContent = fileManager.formatFileSize(recording.size);
          document.getElementById('metaMicrophone').textContent = recording.micLabel || 'Default';
          document.getElementById('metaTimestamp').textContent = fileManager.formatDate(recording.timestamp);
        }
      });
    });

    // Favorite buttons
    document.querySelectorAll('.vs-recording-favorite').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const recording = await fileManager.getRecording(id);
        if (recording) {
          await fileManager.updateRecording(id, { favorite: !recording.favorite });
          await this.loadRecordings();
        }
      });
    });

    // Rename buttons
    document.querySelectorAll('.btn-rename').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        this.showRenameModal(id);
      });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Delete this recording?')) {
          await fileManager.deleteRecording(id);
          await this.loadRecordings();
          showToast('Recording deleted', 'success');
        }
      });
    });

    // Download buttons
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const recording = await fileManager.getRecording(id);
        if (recording && recording.blob) {
          this.downloadRecording(recording);
        }
      });
    });
  }

  /**
   * Show rename modal
   */
  showRenameModal(id) {
    this.currentEditingId = id;
    const modal = document.getElementById('editRecordingModal');
    const input = document.getElementById('editRecordingName');

    fileManager.getRecording(id).then(recording => {
      input.value = recording.name || recording.filename || '';
      modal.style.display = 'flex';
      input.focus();
    });
  }

  /**
   * Download recording
   */
  downloadRecording(recording) {
    const url = URL.createObjectURL(recording.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recording.name || recording.filename || 'recording'}.webm`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const recordingLibrary = new RecordingLibrary();
