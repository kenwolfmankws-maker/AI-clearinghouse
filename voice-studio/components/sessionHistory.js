/**
 * Session History Component
 * Manages multiple takes within a recording session
 */

class SessionHistory {
  constructor() {
    this.takes = [];
    this.bestTakeId = null;
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Event listeners will be attached to dynamically created elements
  }

  /**
   * Add take to session
   */
  addTake(recordingId, takeNumber, duration) {
    const take = {
      id: recordingId,
      takeNumber,
      duration,
      timestamp: Date.now(),
      isBest: this.takes.length === 0, // First take is best by default
    };
    this.takes.push(take);
    this.render();
    return take;
  }

  /**
   * Mark take as best
   */
  markAsBest(recordingId) {
    this.takes.forEach(take => {
      take.isBest = take.id === recordingId;
    });
    this.bestTakeId = recordingId;
    this.render();
  }

  /**
   * Remove take from session
   */
  removeTake(recordingId) {
    this.takes = this.takes.filter(t => t.id !== recordingId);
    if (this.bestTakeId === recordingId && this.takes.length > 0) {
      this.bestTakeId = this.takes[0].id;
      this.takes[0].isBest = true;
    }
    this.render();
  }

  /**
   * Get best take
   */
  getBestTake() {
    return this.takes.find(t => t.isBest);
  }

  /**
   * Clear session
   */
  clearSession() {
    this.takes = [];
    this.bestTakeId = null;
    this.render();
  }

  /**
   * Render takes list
   */
  render() {
    const container = document.getElementById('sessionTakes');

    if (this.takes.length === 0) {
      container.innerHTML = '<div class="vs-empty-state">No takes recorded yet</div>';
      return;
    }

    container.innerHTML = this.takes
      .map(take => this.createTakeItem(take))
      .join('');

    this.attachEventListeners();
  }

  /**
   * Create take item HTML
   */
  createTakeItem(take) {
    const duration = fileManager.formatDuration(take.duration);
    const date = fileManager.formatDate(take.timestamp);

    return `
      <div class="vs-take-item" data-id="${take.id}">
        <div class="vs-take-header">
          <span class="vs-take-title">Take ${take.takeNumber}</span>
          ${take.isBest ? '<span class="vs-take-best">⭐ BEST</span>' : ''}
        </div>
        <div class="vs-take-meta">
          <span>Duration: ${duration}</span>
          <span>Recorded: ${date}</span>
        </div>
        <div class="vs-take-actions">
          <button class="vs-take-action-btn take-play" data-id="${take.id}">Play</button>
          <button class="vs-take-action-btn take-best" data-id="${take.id}">
            ${take.isBest ? 'BEST' : 'Mark Best'}
          </button>
          <button class="vs-take-action-btn take-delete" data-id="${take.id}">Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to take items
   */
  attachEventListeners() {
    // Play take
    document.querySelectorAll('.take-play').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const recording = await fileManager.getRecording(id);
        if (recording) {
          playbackControls.loadAudio(recording.blob, recording.duration);
          document.getElementById('playbackControls').style.display = 'flex';
        }
      });
    });

    // Mark as best
    document.querySelectorAll('.take-best').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        this.markAsBest(id);
      });
    });

    // Delete take
    document.querySelectorAll('.take-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Delete this take?')) {
          await fileManager.deleteRecording(id);
          this.removeTake(id);
          showToast('Take deleted', 'success');
        }
      });
    });
  }
}

// Create global instance
const sessionHistory = new SessionHistory();
