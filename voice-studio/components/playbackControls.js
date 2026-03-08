/**
 * Playback Controls Component
 * Manages playback, seeking, speed, and volume controls
 */

class PlaybackControls {
  constructor() {
    this.audioElement = new Audio();
    this.currentBlob = null;
    this.currentDuration = 0;
    this.isPlaying = false;
    this.initEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    const playBtn = document.getElementById('playBtn');
    const pausePlayBtn = document.getElementById('pausePlayBtn');
    const stopPlayBtn = document.getElementById('stopPlayBtn');
    const playbackSlider = document.getElementById('playbackSlider');
    const speedControl = document.getElementById('speedControl');
    const volumeControl = document.getElementById('volumeControl');

    playBtn.addEventListener('click', () => this.play());
    pausePlayBtn.addEventListener('click', () => this.pause());
    stopPlayBtn.addEventListener('click', () => this.stop());
    playbackSlider.addEventListener('input', (e) => this.seek(e.target.value));
    speedControl.addEventListener('change', (e) => this.setPlaybackRate(e.target.value));
    volumeControl.addEventListener('input', (e) => this.setVolume(e.target.value));

    this.audioElement.addEventListener('timeupdate', () => this.updatePlaybackTime());
    this.audioElement.addEventListener('ended', () => this.onPlaybackEnded());
    this.audioElement.addEventListener('play', () => this.onPlayStart());
    this.audioElement.addEventListener('pause', () => this.onPlayPause());
  }

  /**
   * Load audio blob for playback
   */
  loadAudio(blob, duration) {
    this.currentBlob = blob;
    this.currentDuration = duration;
    const url = URL.createObjectURL(blob);
    this.audioElement.src = url;

    // Update UI
    document.getElementById('totalTime').textContent = fileManager.formatDuration(duration);
    document.getElementById('playbackSlider').max = duration * 1000;
  }

  /**
   * Play audio
   */
  play() {
    if (this.currentBlob) {
      this.audioElement.play();
    }
  }

  /**
   * Pause audio
   */
  pause() {
    this.audioElement.pause();
  }

  /**
   * Stop audio and reset position
   */
  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    document.getElementById('playbackSlider').value = 0;
    document.getElementById('currentTime').textContent = '00:00';
  }

  /**
   * Seek to position
   */
  seek(milliseconds) {
    const seconds = milliseconds / 1000;
    this.audioElement.currentTime = seconds;
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate) {
    this.audioElement.playbackRate = parseFloat(rate);
  }

  /**
   * Set volume
   */
  setVolume(percent) {
    this.audioElement.volume = percent / 100;
  }

  /**
   * Update playback time display
   */
  updatePlaybackTime() {
    const current = this.audioElement.currentTime;
    document.getElementById('currentTime').textContent = fileManager.formatDuration(current);
    document.getElementById('playbackSlider').value = current * 1000;
  }

  /**
   * On playback started
   */
  onPlayStart() {
    document.getElementById('playBtn').style.display = 'none';
    document.getElementById('pausePlayBtn').style.display = 'block';
  }

  /**
   * On playback paused
   */
  onPlayPause() {
    document.getElementById('playBtn').style.display = 'block';
    document.getElementById('pausePlayBtn').style.display = 'none';
  }

  /**
   * On playback ended
   */
  onPlaybackEnded() {
    this.stop();
    this.onPlayPause();
  }
}

// Create global instance
const playbackControls = new PlaybackControls();
