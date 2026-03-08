/**
 * Waveform Visualization Module
 * Canvas-based real-time and playback waveform display
 */

class WaveformVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.animationId = null;
    this.dataArray = null;
    this.analyser = null;
    this.wavelengths = [];

    // Resize canvas to match display size
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Handle canvas resize
   */
  handleResize() {
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Initialize for real-time recording visualization
   */
  initializeForRecording(analyser) {
    this.analyser = analyser;
    this.wavelengths = [];
    this.startAnimationLoop();
  }

  /**
   * Start animation loop
   */
  startAnimationLoop() {
    const animate = () => {
      if (this.analyser) {
        this.draw();
        this.animationId = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * Draw waveform
   */
  draw() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (!this.analyser || !this.dataArray) {
      this.drawCenterLine();
      return;
    }

    // Get frequency data
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(this.dataArray);

    // Draw waveform bars
    const barWidth = this.width / this.dataArray.length;
    const centerY = this.height / 2;

    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    for (let i = 0; i < this.dataArray.length; i++) {
      const value = this.dataArray[i] / 255;
      const barHeight = value * (this.height / 2);

      const x = i * barWidth;

      // Draw upper bar
      this.ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + value * 0.7})`;
      this.ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);

      // Draw lower bar (mirror)
      this.ctx.fillRect(x, centerY, barWidth - 1, barHeight);
    }

    // Draw center line
    this.drawCenterLine();
  }

  /**
   * Draw center line
   */
  drawCenterLine() {
    const centerY = this.height / 2;
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);
    this.ctx.lineTo(this.width, centerY);
    this.ctx.stroke();
  }

  /**
   * Draw playback waveform from audio buffer
   */
  async drawPlaybackWaveform(audioBuffer) {
    const rawData = audioBuffer.getChannelData(0);
    
    // Downsample for visualization
    const blockSize = Math.ceil(rawData.length / this.width);
    const filtered = [];
    
    for (let i = 0; i < rawData.length; i += blockSize) {
      const blockEnd = Math.min(i + blockSize, rawData.length);
      let sum = 0;
      
      for (let j = i; j < blockEnd; j++) {
        sum += Math.abs(rawData[j]);
      }
      
      filtered.push(sum / blockSize);
    }

    // Clear canvas
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.2)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw waveform
    const centerY = this.height / 2;
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    const barWidth = this.width / filtered.length;
    
    for (let i = 0; i < filtered.length; i++) {
      const value = filtered[i];
      const barHeight = value * (this.height / 2);
      const x = i * barWidth;

      // Draw bar
      this.ctx.fillRect(x, centerY - barHeight, Math.max(barWidth - 1, 1), barHeight * 2);
    }

    this.ctx.stroke();
    this.drawCenterLine();
  }

  /**
   * Draw playback position indicator
   */
  drawPlaybackPosition(percentage) {
    const x = (percentage / 100) * this.width;
    
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, this.height);
    this.ctx.stroke();
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawCenterLine();
  }
}

// Create instances
const recordingWaveform = new WaveformVisualizer('waveform');
const playbackWaveform = new WaveformVisualizer('playback-waveform');
