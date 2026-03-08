/**
 * File Manager Utility
 * Manages local file storage using localStorage
 */

class FileManager {
  constructor() {
    this.STORAGE_KEY = 'voice_studio_recordings';
    this.MAX_RECORDINGS = 50;
  }

  /**
   * Save recording metadata to localStorage
   */
  saveMetadata(metadata) {
    try {
      const recordings = this.getAllMetadata();
      recordings.unshift(metadata); // Add to beginning
      const limited = recordings.slice(0, this.MAX_RECORDINGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
      return true;
    } catch (error) {
      console.error('Failed to save recording metadata:', error);
      return false;
    }
  }

  /**
   * Get all recording metadata from localStorage
   */
  getAllMetadata() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve recording metadata:', error);
      return [];
    }
  }

  /**
   * Get a specific recording metadata by ID
   */
  getMetadata(id) {
    const recordings = this.getAllMetadata();
    return recordings.find((r) => r.id === id);
  }

  /**
   * Delete a recording metadata entry
   */
  deleteMetadata(id) {
    try {
      const recordings = this.getAllMetadata();
      const filtered = recordings.filter((r) => r.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete recording metadata:', error);
      return false;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration (milliseconds) to MM:SS or HH:MM:SS
   */
  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Generate unique ID for recording
   */
  generateId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate filename from timestamp
   */
  generateFilename(extension = 'webm') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `recording_${year}-${month}-${date}_${hours}-${minutes}-${seconds}.${extension}`;
  }
}

// Create singleton instance
const fileManager = new FileManager();
