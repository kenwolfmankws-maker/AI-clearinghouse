/**
 * Script Panel Component
 * Manages script editing and marker display
 */

class ScriptPanel {
  constructor() {
    this.initEventListeners();
    this.renderScript();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const scriptEditor = document.getElementById('scriptEditor');
    const clearScriptBtn = document.getElementById('clearScript');
    const addMarkerBtn = document.getElementById('addMarker');

    scriptEditor.addEventListener('input', (e) => {
      scriptManager.setScriptText(e.target.value);
    });

    clearScriptBtn.addEventListener('click', () => {
      if (confirm('Clear the script?')) {
        scriptManager.clearScript();
        scriptEditor.value = '';
        this.renderMarkers();
      }
    });

    addMarkerBtn.addEventListener('click', () => {
      this.addMarkerAtCurrentTime();
    });
  }

  /**
   * Render script in textarea
   */
  renderScript() {
    const scriptEditor = document.getElementById('scriptEditor');
    scriptEditor.value = scriptManager.getScriptText();
    this.renderMarkers();
  }

  /**
   * Render markers list
   */
  renderMarkers() {
    const container = document.getElementById('markersList');
    const markers = scriptManager.getMarkers();

    if (markers.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = markers
      .map(marker => this.createMarkerItem(marker))
      .join('');

    this.attachMarkerListeners();
  }

  /**
   * Create marker item HTML
   */
  createMarkerItem(marker) {
    const timeStr = scriptManager.formatMarkerTime(marker.time);
    return `
      <div class="vs-marker" data-id="${marker.id}">
        <span class="vs-marker-time">${timeStr}</span>
        <span class="vs-marker-label">${marker.label}</span>
        <button class="vs-marker-delete" data-id="${marker.id}">✕</button>
      </div>
    `;
  }

  /**
   * Attach event listeners to markers
   */
  attachMarkerListeners() {
    // Marker click to seek
    document.querySelectorAll('.vs-marker').forEach(el => {
      el.addEventListener('click', (e) => {
        if (!e.target.classList.contains('vs-marker-delete')) {
          const id = el.dataset.id;
          const marker = scriptManager.getMarker(id);
          if (marker && playbackControls.audioElement) {
            playbackControls.audioElement.currentTime = marker.time;
          }
        }
      });
    });

    // Delete marker
    document.querySelectorAll('.vs-marker-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.target.dataset.id;
        scriptManager.removeMarker(id);
        this.renderMarkers();
      });
    });
  }

  /**
   * Add marker at current playback position
   */
  addMarkerAtCurrentTime() {
    const currentTime = playbackControls.audioElement?.currentTime || 0;
    const label = prompt('Marker label:', `Marker at ${scriptManager.formatMarkerTime(currentTime)}`);

    if (label !== null) {
      scriptManager.addMarker(currentTime, label);
      this.renderMarkers();
      showToast('Marker added', 'success');
    }
  }
}

// Create global instance
const scriptPanel = new ScriptPanel();
