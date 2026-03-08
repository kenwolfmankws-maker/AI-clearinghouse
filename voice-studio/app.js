/**
 * Voice Studio App
 * Main application logic for recording, playback, and management
 */

// ============================================================
// Utility Functions
// ============================================================

/**
 * Show toast notification
 */
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toastId = 'toast-' + Date.now();
  
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = 'vs-toast ' + type;
  toast.innerHTML = `
    ${message}
    <button class="vs-toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) el.remove();
  }, 3000);
};

class VoiceStudioApp {
  constructor() {
    this.isRecording = false;
    this.currentRecording = null;
    this.isPlaying = false;
    this.audioElement = null;
    this.recordingBlob = null;
    this.audioBuffer = null;
    this.durationInterval = null;
    this.currentSessionId = null;
    this.currentTakeNumber = 0;

    this.initializeComponents();
    this.initializeUI();
    this.setupEventListeners();
    this.loadInitialData();
  }

  /**
   * Initialize component managers
   */
  initializeComponents() {
    // Ensure component managers are available
    if (typeof projectManager === 'undefined') {
      window.projectManager = typeof ProjectManager !== 'undefined' ? new ProjectManager() : null;
    }
    if (typeof scriptManager === 'undefined') {
      window.scriptManager = typeof ScriptManager !== 'undefined' ? new ScriptManager() : null;
    }
    if (typeof recordingLibrary === 'undefined') {
      window.recordingLibrary = typeof RecordingLibrary !== 'undefined' ? new RecordingLibrary() : null;
    }
    if (typeof sessionHistory === 'undefined') {
      window.sessionHistory = typeof SessionHistory !== 'undefined' ? new SessionHistory() : null;
    }
    if (typeof playbackControls === 'undefined') {
      window.playbackControls = typeof PlaybackControls !== 'undefined' ? new PlaybackControls() : null;
    }
    if (typeof scriptPanel === 'undefined') {
      window.scriptPanel = typeof ScriptPanel !== 'undefined' ? new ScriptPanel() : null;
    }
    if (typeof projectPanel === 'undefined') {
      window.projectPanel = typeof ProjectPanel !== 'undefined' ? new ProjectPanel() : null;
    }
  }

  /**
   * Initialize UI elements
   */
  initializeUI() {
    // New component elements
    this.projectToggleBtn = document.getElementById('projectToggleBtn');
    this.projectPanelModal = document.getElementById('projectPanelModal');
    this.sessionTakeDisplay = document.getElementById('sessionTakeDisplay');
    this.sessionTakeCount = document.getElementById('sessionTakeCount');
    this.recordingStatusDot = document.getElementById('recordingStatusDot');
    this.recordingStatusText = document.getElementById('recordingStatusText');
    this.recordingTimeDisplay = document.getElementById('recordingTimeDisplay');
    this.recordingWaveformContainer = document.getElementById('recordingWaveformContainer');
    this.recordingWaveformCanvas = document.getElementById('recordingWaveformCanvas');
    
    // Control buttons
    this.recordStartBtn = document.getElementById('recordStartBtn');
    this.recordPauseBtn = document.getElementById('recordPauseBtn');
    this.recordStopBtn = document.getElementById('recordStopBtn');
    this.newTakeBtn = document.getElementById('newTakeBtn');
    this.retakeBtn = document.getElementById('retakeBtn');
    
    // Playback controls
    this.playBtn = document.getElementById('playBtn');
    this.pausePlayBtn = document.getElementById('pausePlayBtn');
    this.playbackTimelineSlider = document.getElementById('playbackTimelineSlider');
    this.playbackCurrentTime = document.getElementById('playbackCurrentTime');
    this.playbackTotalTime = document.getElementById('playbackTotalTime');
    this.playbackSpeedSelect = document.getElementById('playbackSpeedSelect');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.volumeLevelDisplay = document.getElementById('volumeLevelDisplay');
    
    // Export buttons
    this.exportWebMBtn = document.getElementById('exportWebMBtn');
    this.exportWavBtn = document.getElementById('exportWavBtn');
    
    // Metadata displays
    this.recordingMetadataCodec = document.getElementById('recordingMetadataCodec');
    this.recordingMetadataSampleRate = document.getElementById('recordingMetadataSampleRate');
    this.recordingMetadataChannels = document.getElementById('recordingMetadataChannels');
    this.recordingMetadataSize = document.getElementById('recordingMetadataSize');
    
    // Script panel elements
    this.scriptEditorTextarea = document.getElementById('scriptEditorTextarea');
    this.addMarkerBtn = document.getElementById('addMarkerBtn');
    this.markersList = document.getElementById('markersList');
    
    // Library and takes tabs
    this.libraryTab = document.getElementById('libraryTab');
    this.takesTab = document.getElementById('takesTab');
    this.libraryContent = document.getElementById('libraryContent');
    this.takesContent = document.getElementById('takesContent');
    this.takesListContainer = document.getElementById('takesListContainer');
    
    // Modals
    this.editRecordingModal = document.getElementById('editRecordingModal');
    this.recordingNameInput = document.getElementById('recordingNameInput');
    this.saveRecordingNameBtn = document.getElementById('saveRecordingNameBtn');
    this.cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
    
    // Toast container
    this.toastContainer = document.getElementById('toastContainer');

    // Create hidden audio element for playback
    this.audioElement = new Audio();
    this.audioElement.addEventListener('timeupdate', () => this.updatePlaybackTime());
    this.audioElement.addEventListener('ended', () => this.onPlaybackEnded());
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Project controls
    if (this.projectToggleBtn) {
      this.projectToggleBtn.addEventListener('click', () => {
        if (projectPanel) projectPanel.showPanel();
      });
    }

    // Recording control listeners
    if (this.recordStartBtn) {
      this.recordStartBtn.addEventListener('click', () => this.startRecording());
    }
    if (this.recordStopBtn) {
      this.recordStopBtn.addEventListener('click', () => this.stopRecording());
    }
    if (this.recordPauseBtn) {
      this.recordPauseBtn.addEventListener('click', () => this.pauseRecording());
    }
    if (this.newTakeBtn) {
      this.newTakeBtn.addEventListener('click', () => this.startNewTake());
    }
    if (this.retakeBtn) {
      this.retakeBtn.addEventListener('click', () => this.retakeRecording());
    }

    // Playback control listeners
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.play());
    }
    if (this.pausePlayBtn) {
      this.pausePlayBtn.addEventListener('click', () => this.pausePlayback());
    }
    if (this.playbackTimelineSlider) {
      this.playbackTimelineSlider.addEventListener('input', (e) => this.seek(e.target.value));
    }
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    }
    if (this.playbackSpeedSelect) {
      this.playbackSpeedSelect.addEventListener('change', (e) => this.setPlaybackSpeed(e.target.value));
    }

    // Export listeners
    if (this.exportWebMBtn) {
      this.exportWebMBtn.addEventListener('click', () => this.exportWebM());
    }
    if (this.exportWavBtn) {
      this.exportWavBtn.addEventListener('click', () => this.exportWAV());
    }

    // Script and marker listeners
    if (this.addMarkerBtn) {
      this.addMarkerBtn.addEventListener('click', () => this.addMarkerAtCurrentTime());
    }
    if (this.scriptEditorTextarea) {
      this.scriptEditorTextarea.addEventListener('change', () => this.saveScript());
    }

    // Tab switching
    if (this.libraryTab) {
      this.libraryTab.addEventListener('click', () => this.switchToLibraryTab());
    }
    if (this.takesTab) {
      this.takesTab.addEventListener('click', () => this.switchToTakesTab());
    }

    // Modal controls
    if (this.saveRecordingNameBtn) {
      this.saveRecordingNameBtn.addEventListener('click', () => this.saveRecordingName());
    }
    if (this.cancelEditModalBtn) {
      this.cancelEditModalBtn.addEventListener('click', () => this.closeEditModal());
    }
  }

  /**
   * Load initial data (projects, script, etc)
   */
  loadInitialData() {
    // Load current project
    if (projectManager) {
      const currentProject = projectManager.getCurrentProject();
      if (currentProject) {
        this.currentSessionId = currentProject.id;
      }
    }

    // Load script
    if (scriptManager) {
      const script = scriptManager.getScriptText();
      if (this.scriptEditorTextarea) {
        this.scriptEditorTextarea.value = script;
      }
      if (scriptPanel) {
        scriptPanel.renderScript();
        scriptPanel.renderMarkers();
      }
    }

    // Load recording library
    if (recordingLibrary) {
      recordingLibrary.loadRecordings();
      this.updateLibraryDisplay();
    }

    // Load session history
    if (sessionHistory && this.currentSessionId) {
      this.updateTakesDisplay();
    }
  }

  /**
   * Update library display
   */
  updateLibraryDisplay() {
    if (!recordingLibrary || !this.libraryContent) return;
    recordingLibrary.render();
  }

  /**
   * Update takes display
   */
  updateTakesDisplay() {
    if (!sessionHistory || !this.takesListContainer) return;
    sessionHistory.render();
  }

  /**
   * Switch to library tab
   */
  switchToLibraryTab() {
    this.libraryTab.classList.add('vs-tab-active');
    this.takesTab.classList.remove('vs-tab-active');
    this.libraryContent.classList.add('vs-tab-content-active');
    this.takesContent.classList.remove('vs-tab-content-active');
    this.updateLibraryDisplay();
  }

  /**
   * Switch to takes tab
   */
  switchToTakesTab() {
    this.takesTab.classList.add('vs-tab-active');
    this.libraryTab.classList.remove('vs-tab-active');
    this.takesContent.classList.add('vs-tab-content-active');
    this.libraryContent.classList.remove('vs-tab-content-active');
    this.updateTakesDisplay();
  }

  /**
   * Start recording
   */
  async startRecording() {
    try {
      showToast('Initializing recorder...', 'success');
      
      const success = await recorder.initialize();
      if (!success) {
        showToast('Failed to initialize recorder', 'error');
        return;
      }

      // Initialize new session
      this.currentTakeNumber = 1;
      if (this.sessionTakeCount) {
        this.sessionTakeCount.textContent = '1 of 1';
      }
      if (this.sessionTakeDisplay) {
        this.sessionTakeDisplay.style.display = 'block';
      }

      recorder.startRecording();
      this.isRecording = true;

      // Update UI
      if (this.recordStartBtn) this.recordStartBtn.disabled = true;
      if (this.recordStopBtn) this.recordStopBtn.disabled = false;
      if (this.recordPauseBtn) this.recordPauseBtn.disabled = false;
      if (this.retakeBtn) this.retakeBtn.disabled = false;

      // Update status
      if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-recording';
      if (this.recordingStatusText) this.recordingStatusText.textContent = 'Recording...';

      // Start recording waveform visualization
      recordingWaveform.initializeForRecording(recorder.getAnalyser());

      // Start duration timer
      this.startDurationTimer();

      showToast('Recording started', 'success');
    } catch (error) {
      console.error('Failed to start recording:', error);
      showToast('Failed to start recording', 'error');
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (!recorder.pauseRecording()) {
      showToast('Failed to pause recording', 'error');
      return;
    }

    if (this.recordPauseBtn) this.recordPauseBtn.style.display = 'none';
    if (this.recordingStatusText) this.recordingStatusText.textContent = 'Paused';
    if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-paused';
  }

  /**
   * Start new take (without ending session)
   */
  async startNewTake() {
    if (!this.isRecording) {
      showToast('Not currently recording', 'error');
      return;
    }

    try {
      this.currentTakeNumber++;
      if (this.sessionTakeCount) {
        this.sessionTakeCount.textContent = `${this.currentTakeNumber} of ${this.currentTakeNumber}`;
      }
      recorder.startNewTake();
      showToast(`Starting take ${this.currentTakeNumber}...`, 'success');
    } catch (error) {
      console.error('Failed to start new take:', error);
      showToast('Failed to start new take', 'error');
    }
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    try {
      recordingWaveform.stopAnimation();
      clearInterval(this.durationInterval);

      showToast('Processing recording...', 'success');

      const result = await recorder.stopRecording();
      this.recordingBlob = result.blob;

      // Update UI
      this.isRecording = false;
      if (this.recordStartBtn) this.recordStartBtn.disabled = false;
      if (this.recordStopBtn) this.recordStopBtn.disabled = true;
      if (this.recordPauseBtn) this.recordPauseBtn.disabled = true;
      if (this.newTakeBtn) this.newTakeBtn.disabled = true;

      // Update status
      if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-idle';
      if (this.recordingStatusText) this.recordingStatusText.textContent = 'Recording completed';

      // Prepare playback
      await this.preparePlayback(result);

      // Update metadata
      if (this.recordingMetadataCodec) this.recordingMetadataCodec.textContent = 'WebM/Opus';
      if (this.recordingMetadataSampleRate) this.recordingMetadataSampleRate.textContent = '48 kHz';
      if (this.recordingMetadataChannels) this.recordingMetadataChannels.textContent = '2';
      if (this.recordingMetadataSize) this.recordingMetadataSize.textContent = fileManager.formatFileSize(this.recordingBlob.size);

      // Add to session history
      if (sessionHistory && this.currentSessionId) {
        sessionHistory.addTake({
          number: this.currentTakeNumber,
          duration: result.duration,
          timestamp: Date.now()
        });
        this.updateTakesDisplay();
      }

      showToast('Recording completed', 'success');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      showToast('Failed to stop recording', 'error');
    }
  }

  /**
   * Retake recording
   */
  retakeRecording() {
    if (!confirm('Discard current recording and start over?')) return;

    recorder.cleanup();
    this.resetRecordingUI();
    
    if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-idle';
    if (this.recordingStatusText) this.recordingStatusText.textContent = 'Ready to record';
    if (this.recordingTimeDisplay) this.recordingTimeDisplay.textContent = '00:00:00';
    
    showToast('Recording discarded', 'success');
  }

  /**
   * Reset recording UI
   */
  resetRecordingUI() {
    if (this.recordStartBtn) this.recordStartBtn.disabled = false;
    if (this.recordStopBtn) this.recordStopBtn.disabled = true;
    if (this.recordPauseBtn) this.recordPauseBtn.disabled = true;
    if (this.newTakeBtn) this.newTakeBtn.disabled = true;
    if (this.retakeBtn) this.retakeBtn.disabled = true;

    if (this.recordingTimeDisplay) this.recordingTimeDisplay.textContent = '00:00:00';
    if (this.playbackCurrentTime) this.playbackCurrentTime.textContent = '00:00';
    if (this.playbackTotalTime) this.playbackTotalTime.textContent = '00:00';
    if (this.playbackTimelineSlider) this.playbackTimelineSlider.value = 0;

    recordingWaveform.clear();
    if (playbackWaveform) playbackWaveform.clear();

    if (this.audioElement) {
      this.audioElement.currentTime = 0;
      this.audioElement.pause();
    }
  }

  /**
   * Prepare playback
   */
  async preparePlayback(result) {
    try {
      // Create blob URL for playback
      const url = WAVEncoder.getBlobUrl(this.recordingBlob);
      this.audioElement.src = url;

      // Decode audio buffer for waveform visualization
      const arrayBuffer = await this.recordingBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Draw playback waveform
      if (playbackWaveform) {
        playbackWaveform.drawPlaybackWaveform(this.audioBuffer);
      }
    } catch (error) {
      console.error('Failed to prepare playback:', error);
      showToast('Failed to prepare playback', 'error');
    }
  }

  /**
   * Play recording
   */
  play() {
    if (!this.audioElement || !this.audioElement.src) {
      showToast('No recording to play', 'error');
      return;
    }

    this.audioElement.play();
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.style.display = 'none';
    if (this.pausePlayBtn) this.pausePlayBtn.style.display = 'inline-flex';

    // Update status
    if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-playing';
    if (this.recordingStatusText) this.recordingStatusText.textContent = 'Playing';
  }

  /**
   * Pause playback
   */
  pausePlayback() {
    this.audioElement.pause();
    this.isPlaying = false;
    if (this.playBtn) this.playBtn.style.display = 'inline-flex';
    if (this.pausePlayBtn) this.pausePlayBtn.style.display = 'none';

    // Update status
    if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-paused';
    if (this.recordingStatusText) this.recordingStatusText.textContent = 'Paused';
  }

  /**
   * Seek to position
   */
  seek(percentage) {
    if (!this.audioElement || !this.audioElement.duration) return;
    const time = (percentage / 100) * this.audioElement.duration;
    this.audioElement.currentTime = time;
  }

  /**
   * Update playback time display
   */
  updatePlaybackTime() {
    if (!this.audioElement) return;

    const current = fileManager.formatDuration(this.audioElement.currentTime * 1000);
    if (this.playbackCurrentTime) this.playbackCurrentTime.textContent = current;

    // Update timeline position
    if (this.audioElement.duration && this.playbackTimelineSlider) {
      const percentage = (this.audioElement.currentTime / this.audioElement.duration) * 100;
      this.playbackTimelineSlider.value = percentage;

      // Redraw waveform with position indicator
      if (playbackWaveform) {
        playbackWaveform.drawPlaybackPosition(percentage);
      }
    }
  }

  /**
   * Playback ended handler
   */
  onPlaybackEnded() {
    this.isPlaying = false;
    this.audioElement.currentTime = 0;
    if (this.playbackTimelineSlider) this.playbackTimelineSlider.value = 0;
    if (this.playBtn) this.playBtn.style.display = 'inline-flex';
    if (this.pausePlayBtn) this.pausePlayBtn.style.display = 'none';
    if (this.playbackCurrentTime) this.playbackCurrentTime.textContent = '00:00';

    // Update status
    if (this.recordingStatusDot) this.recordingStatusDot.className = 'vs-status-dot vs-status-idle';
    if (this.recordingStatusText) this.recordingStatusText.textContent = 'Playback completed';
  }

  /**
   * Set playback volume
   */
  setVolume(value) {
    const volume = value / 100;
    this.audioElement.volume = volume;
    if (this.volumeLevelDisplay) this.volumeLevelDisplay.textContent = value + '%';
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed) {
    this.audioElement.playbackRate = parseFloat(speed);
    showToast(`Playback speed: ${speed}x`, 'success');
  }

  /**
   * Start duration timer
   */
  startDurationTimer() {
    this.durationInterval = setInterval(() => {
      const duration = recorder.getCurrentDuration();
      const formatted = fileManager.formatDuration(duration);
      if (this.recordingTimeDisplay) this.recordingTimeDisplay.textContent = formatted;
    }, 100);
  }

  /**
   * Export as WebM
   */
  exportWebM() {
    if (!this.recordingBlob) {
      showToast('No recording to export', 'error');
      return;
    }

    const filename = fileManager.generateFilename('webm');
    WAVEncoder.downloadBlob(this.recordingBlob, filename);
    showToast(`Exported as ${filename}`, 'success');
  }

  /**
   * Export as WAV
   */
  async exportWAV() {
    if (!this.recordingBlob) {
      showToast('No recording to export', 'error');
      return;
    }

    try {
      showToast('Converting to WAV format...', 'success');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const wavBlob = await WAVEncoder.mediaRecorderBlobToWAV(this.recordingBlob, audioContext);

      const filename = fileManager.generateFilename('wav');
      WAVEncoder.downloadBlob(wavBlob, filename);
      
      showToast(`Exported as ${filename}`, 'success');
    } catch (error) {
      console.error('Failed to export WAV:', error);
      showToast('Failed to convert to WAV format', 'error');
    }
  }

  /**
   * Save script to manager
   */
  saveScript() {
    if (!scriptManager || !this.scriptEditorTextarea) return;
    const scriptText = this.scriptEditorTextarea.value;
    scriptManager.setScriptText(scriptText);
    showToast('Script saved', 'success');
  }

  /**
   * Add marker at current playback time
   */
  addMarkerAtCurrentTime() {
    if (!this.audioElement || scriptManager === undefined) {
      showToast('No recording playing', 'error');
      return;
    }

    const currentTime = this.audioElement.currentTime * 1000; // Convert to ms
    const label = prompt('Enter marker label (optional):', '');
    
    if (label !== null) {
      scriptManager.addMarker({
        time: Math.round(currentTime),
        label: label || ''
      });
      scriptPanel.renderMarkers();
      showToast('Marker added', 'success');
    }
  }

  /**
   * Show recording edit modal
   */
  showEditRecordingModal(recordingName) {
    if (!this.editRecordingModal || !this.recordingNameInput) return;
    this.recordingNameInput.value = recordingName;
    this.editRecordingModal.style.display = 'flex';
  }

  /**
   * Close edit recording modal
   */
  closeEditModal() {
    if (this.editRecordingModal) {
      this.editRecordingModal.style.display = 'none';
    }
  }

  /**
   * Save recording name
   */
  saveRecordingName() {
    if (!this.recordingNameInput || !recordingLibrary) return;
    const newName = this.recordingNameInput.value.trim();
    
    if (newName) {
      recordingLibrary.renameRecording(newName);
      this.closeEditModal();
      this.updateLibraryDisplay();
      showToast('Recording renamed', 'success');
    }
  }
}

// ============================================================
// Application Initialization
// ============================================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VoiceStudioApp();
});
