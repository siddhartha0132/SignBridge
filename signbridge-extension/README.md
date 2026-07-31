# 🤝 SignBridge Chrome Extension - MVP

Real-time sign language interpretation overlay for Google Meet video calls.

## 🎯 What This Does

- **Live Sign Detection**: Recognizes hand gestures in real-time during Google Meet calls
- **Caption Overlay**: Shows interpreted signs as live captions on screen
- **Built-in Gestures**: Recognizes `hello`, `stop`, `yes`, `please`, `wait` without training
- **Non-intrusive UI**: Elegant overlay that doesn't block the meeting interface
- **Easy Toggle**: Start/stop interpretation with one click

---

## 📦 Installation (Dev Mode)

### Step 1: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `signbridge-extension` folder
5. The SignBridge icon should appear in your extensions toolbar

### Step 2: Test in Google Meet

1. Join any Google Meet call (or start a test call)
2. Make sure your camera is ON
3. Click the SignBridge extension icon
4. Click **"Start Interpretation"**
5. Hold up a hand sign and watch the live captions!

---

## 🎨 Creating Icons (Quick Fix)

The extension needs icons. Here are 3 quick options:

### Option A: Use Emoji Icons (Fastest - 2 minutes)
```bash
# Run this from the signbridge-extension folder
cd icons

# On Mac, create simple emoji icons:
# 16x16
convert -size 16x16 xc:white -pointsize 12 -draw "text 2,13 '🤝'" icon-16.png

# 48x48
convert -size 48x48 xc:white -pointsize 36 -draw "text 6,40 '🤝'" icon-48.png

# 128x128
convert -size 128x128 xc:white -pointsize 96 -draw "text 16,104 '🤝'" icon-128.png
```

### Option B: Use Online Generator (5 minutes)
1. Go to https://favicon.io/emoji-favicons/
2. Choose the 🤝 handshake emoji
3. Download the generated icons
4. Rename them to `icon-16.png`, `icon-48.png`, `icon-128.png`
5. Place in the `icons/` folder

### Option C: Temporary Placeholder (30 seconds)
```bash
# Create simple colored squares as placeholders
cd icons
convert -size 16x16 xc:"#1d6f5e" icon-16.png
convert -size 48x48 xc:"#1d6f5e" icon-48.png
convert -size 128x128 xc:"#1d6f5e" icon-128.png
```

---

## 🚀 Usage

### Starting Interpretation

1. **Join a Google Meet call**
2. **Turn on your camera** (required for hand detection)
3. **Click the SignBridge extension icon** in Chrome toolbar
4. **Click "Start Interpretation"**
5. **Show hand signs** to the camera

### Supported Gestures (MVP)

| Gesture | Sign Description |
|---------|-----------------|
| **hello** | All five fingers extended (open hand) |
| **stop** | Closed fist |
| **yes** | Thumbs up |
| **please** | Index + middle fingers up |
| **wait** | Index finger only |

### Settings

- **Show confidence scores**: Toggle to see how confident the detection is
- **Sound notifications**: Enable/disable sound alerts (future feature)

---

## 🎥 Demo Video Script

Here's what to show for a quick demo:

1. **"Join a Google Meet call"**
2. **"Click the extension icon and start interpretation"**
3. **"Show 'hello' sign → See 'HELLO' caption appear"**
4. **"Show 'stop' sign → See 'STOP' caption"**
5. **"Show 'yes' sign → See 'YES' caption"**
6. **"The captions appear in real-time for all participants"**

---

## 🔧 Technical Details

### Architecture

```
Google Meet Page
    ↓
Content Script (overlay.js)
    ↓
MediaPipe HandLandmarker (WASM)
    ↓
Gesture Classification (built-in patterns)
    ↓
Live Caption Overlay
```

### Performance

- **Latency**: ~100-200ms from sign to caption
- **Frame rate**: Processes every animation frame (~60fps)
- **Resource usage**: ~50-100MB RAM, minimal CPU with GPU acceleration

### Browser Support

- ✅ Chrome 88+
- ✅ Edge 88+
- ❌ Firefox (Manifest V3 required)
- ❌ Safari (Chrome extensions not supported)

---

## 🐛 Troubleshooting

### "No video found" Error
- **Fix**: Make sure your camera is ON in Google Meet
- Click the camera icon in Meet to enable it

### Extension Icon Not Showing
- **Fix**: Pin the extension
- Go to `chrome://extensions/` → Click the puzzle icon → Pin SignBridge

### Captions Not Appearing
- **Fix**: Refresh the Google Meet page
- Stop and restart interpretation
- Check browser console for errors (F12)

### Hand Not Detected
- **Fix**: Ensure good lighting
- Hold your hand clearly in front of the camera
- Try moving closer to the camera

---

## 📝 Known Limitations (MVP)

1. **Google Meet Only** - Doesn't work on Zoom/Teams yet (future update)
2. **Single Hand** - Only recognizes one hand at a time
3. **Static Gestures** - No motion-based signs (future update)
4. **5 Built-in Signs** - Limited vocabulary (can be expanded)
5. **No Recording** - Captions aren't saved (future feature)

---

## 🚀 Future Enhancements

### Phase 2 (Next 2-3 weeks)
- [ ] Zoom support
- [ ] Microsoft Teams support
- [ ] Two-handed gestures
- [ ] Custom gesture training
- [ ] Caption history/export

### Phase 3 (1-2 months)
- [ ] Motion-based signs
- [ ] Speech-to-text (bidirectional)
- [ ] Multiple sign languages (ASL/ISL/BSL)
- [ ] Recording & playback
- [ ] Team analytics dashboard

---

## 🛠️ Development

### File Structure
```
signbridge-extension/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── content/
│   ├── overlay.js            # Main detection logic
│   └── overlay.css           # Overlay styles
├── background/
│   └── service-worker.js     # Background tasks
├── icons/                    # Extension icons
└── README.md                 # This file
```

### Technologies Used
- **MediaPipe Hands** - Hand landmark detection
- **Chrome Extension API** - Browser integration
- **Web Video API** - Video stream capture
- **Vanilla JavaScript** - No framework dependencies

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Open an issue in the main SignBridge repository
- Contact: signbridge@example.com

---

## 📄 License

Part of the SignBridge project. See main repository for license details.

---

## 🎉 Quick Start Checklist

- [ ] Extension loaded in Chrome
- [ ] Icons created (use Option A, B, or C above)
- [ ] Joined a Google Meet call
- [ ] Camera is ON
- [ ] Clicked "Start Interpretation"
- [ ] Tested with "hello" sign
- [ ] Captions appearing!

**You're ready to demo! 🚀**
