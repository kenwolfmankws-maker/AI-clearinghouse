# Voice Studio - Local Recording Tool

This directory contains a standalone, local-only Voice Recording application. It is completely separate from the AI Clearinghouse app.

## Features

- **Pure Vanilla JavaScript** - No external dependencies or build tools required
- **Local Storage Only** - All recordings stored in browser's localStorage
- **Real-time Waveform** - Visual feedback during recording
- **Multiple Format Support** - Export as WebM or WAV
- **Microphone Selection** - Choose from available input devices
- **Playback Controls** - Play, pause, seek, and volume control
- **Recording Metadata** - Track filename, duration, file size, and timestamp
- **No Cloud Service** - Completely offline and private

## Usage

1. Open `index.html` in a web browser
2. Allow microphone access when prompted
3. Select your preferred microphone (optional)
4. Click "Start Recording" to begin
5. Click "Stop" when finished
6. Use playback controls to review your recording
7. Export as WebM or WAV format
8. Manage saved recordings in the list below

## Architecture

```
voice-studio/
├── index.html              # Main interface
├── app.js                  # Application logic
├── recorder.js             # Recording engine
├── waveform.js             # Visualization
├── styles.css              # Styling
├── utils/
│   ├── wavEncoder.js       # WAV format conversion
│   └── fileManager.js      # Local storage management
└── recordings/             # Local storage directory
```

## Local Storage

Recordings are stored with metadata including:
- Unique ID
- Filename (auto-generated timestamp)
- Duration
- File size
- MIME type
- Timestamp
- Microphone label

Maximum of 50 recordings can be stored to prevent excessive localStorage usage.

## Browser Support

- Chrome/Chromium 49+
- Firefox 25+
- Safari 14.1+
- Edge 79+

## Notes

- This tool is **NOT** tracked in git (see .gitignore)
- **NOT** connected to the Clearinghouse deployment
- **NOT** part of any build pipeline
- **Local browser context only**
- Recordings are stored in `localStorage` automatically
- No server communication required
- All data remains on your local machine

## Limitations

- Storage limited by browser's localStorage quota (typically 5-10MB)
- Not designed for large batch processing
- Designed for local development use only

---

**Last Updated:** March 8, 2026
**Status:** Standalone Local Tool • Development Use Only
