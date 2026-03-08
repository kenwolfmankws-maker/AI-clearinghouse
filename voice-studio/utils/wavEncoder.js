/**
 * WAV Encoder Utility
 * Converts Web Audio API audio data to WAV format
 */

class WAVEncoder {
  static encodeWAV(samples, sampleRate) {
    const numChannels = 1; // Mono
    const headerLength = 44;
    const buffer = new ArrayBuffer(headerLength + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16-bit)

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Convert float samples to 16-bit PCM
    const offset = 44;
    let index = 0;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      index += 2;
    }

    return buffer;
  }

  static async audioBufferToWAV(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const rawData = audioBuffer.getChannelData(0);

    // Convert to mono by averaging channels
    if (numberOfChannels > 1) {
      for (let i = 1; i < numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        for (let j = 0; j < rawData.length; j++) {
          rawData[j] += channelData[j];
        }
      }
      for (let i = 0; i < rawData.length; i++) {
        rawData[i] /= numberOfChannels;
      }
    }

    const wavBuffer = this.encodeWAV(rawData, sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  static async mediaRecorderBlobToWAV(blob, audioContext) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return this.audioBufferToWAV(audioBuffer);
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static getBlobUrl(blob) {
    return URL.createObjectURL(blob);
  }

  static revokeBlobUrl(url) {
    URL.revokeObjectURL(url);
  }
}
