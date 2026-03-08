/**
 * Recorder Module
 * Handles audio recording with MediaRecorder API
 */

class Recorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = null;
    this.pausedTime = 0;
    this.isPaused = false;
    this.audioDevices = [];
    this.selectedDeviceId = 'default';
    this.dataArray = null;
  }

  /**
   * Enumerate available audio input devices
   */
  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.audioDevices = devices.filter((device) => device.kind === 'audioinput');
      return this.audioDevices;
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  }

  /**
   * Set selected microphone device
   */
  setSelectedDevice(deviceId) {
    this.selectedDeviceId = deviceId || 'default';
  }

  /**
   * Initialize MediaRecorder and AudioContext
   */
  async initialize() {
    try {
      const constraints = {
        audio: {
          deviceId: this.selectedDeviceId !== 'default' ? { exact: this.selectedDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser for waveform visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Setup MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = '';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize recorder:', error);
      return false;
    }
  }

  /**
   * Start recording
   */
  startRecording() {
    if (!this.mediaRecorder) return false;

    this.audioChunks = [];
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.isPaused = false;

    this.mediaRecorder.start();
    return true;
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (!this.mediaRecorder || this.isPaused) return false;
    this.mediaRecorder.pause();
    this.isPaused = true;
    return true;
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (!this.mediaRecorder || !this.isPaused) return false;
    this.mediaRecorder.resume();
    this.isPaused = false;
    return true;
  }

  /**
   * Stop recording and get blob
   */
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        const duration = Date.now() - this.startTime;

        // Clean up resources
        this.cleanup();

        resolve({
          blob,
          duration,
          mimeType: this.mediaRecorder.mimeType,
          sampleRate: this.audioContext?.sampleRate || 48000,
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get audio analyser for waveform visualization
   */
  getAnalyser() {
    return this.analyser;
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  }

  /**
   * Get current recording duration
   */
  getCurrentDuration() {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  /**
   * Check if paused
   */
  isPaused_() {
    return this.isPaused;
  }

  /**
   * Get sample rate
   */
  getSampleRate() {
    return this.audioContext?.sampleRate || 48000;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.mediaRecorder = null;
    this.analyser = null;
    this.audioContext = null;
    this.dataArray = null;
    this.startTime = null;
    this.pausedTime = 0;
    this.isPaused = false;
  }
}

// Create singleton
const recorder = new Recorder();
