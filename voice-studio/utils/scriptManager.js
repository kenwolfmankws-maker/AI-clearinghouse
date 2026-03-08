/**
 * Script Manager - Handle script text and markers
 * Manages narration scripts and timing markers
 */

class ScriptManager {
  constructor() {
    this.storageKey = 'voice-studio-scripts';
    this.currentScript = '';
    this.markers = [];
    this.loadScript();
  }

  /**
   * Load script from localStorage
   */
  loadScript() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      this.currentScript = data.text || '';
      this.markers = data.markers || [];
    }
  }

  /**
   * Save script to localStorage
   */
  saveScript() {
    const data = {
      text: this.currentScript,
      markers: this.markers,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * Set script text
   */
  setScriptText(text) {
    this.currentScript = text;
    this.saveScript();
  }

  /**
   * Get script text
   */
  getScriptText() {
    return this.currentScript;
  }

  /**
   * Clear script
   */
  clearScript() {
    this.currentScript = '';
    this.markers = [];
    this.saveScript();
  }

  /**
   * Add marker at time
   */
  addMarker(timeInSeconds, label = '') {
    const marker = {
      id: Date.now().toString(),
      time: timeInSeconds,
      label:label || `Marker ${this.markers.length + 1}`,
    };
    this.markers.push(marker);
    this.markers.sort((a, b) => a.time - b.time);
    this.saveScript();
    return marker;
  }

  /**
   * Remove marker
   */
  removeMarker(markerId) {
    this.markers = this.markers.filter(m => m.id !== markerId);
    this.saveScript();
  }

  /**
   * Get all markers
   */
  getMarkers() {
    return this.markers;
  }

  /**
   * Get marker by ID
   */
  getMarker(markerId) {
    return this.markers.find(m => m.id === markerId);
  }

  /**
   * Update marker
   */
  updateMarker(markerId, updates) {
    const marker = this.getMarker(markerId);
    if (marker) {
      Object.assign(marker, updates);
      this.markers.sort((a, b) => a.time - b.time);
      this.saveScript();
    }
  }

  /**
   * Format marker time
   */
  formatMarkerTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }
}

// Create global instance
const scriptManager = new ScriptManager();
