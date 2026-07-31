// Content script - injected into Google Meet pages
// Handles video capture, hand detection, and caption overlay

console.log('🤝 SignBridge extension loaded');

let isActive = false;
let videoElement = null;
let rafId = null;
let handLandmarker = null;
let showConfidence = true;
let wordBuffer = [];
let lastWord = null;
let lastWordTime = 0;

const WORD_GAP_MS = 1200;
const BACKEND_URL = 'http://localhost:8787';

// Create overlay UI
function createOverlay() {
  // Remove existing overlay if present
  const existing = document.getElementById('signbridge-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'signbridge-overlay';
  overlay.className = 'signbridge-hidden';
  
  overlay.innerHTML = `
    <div id="signbridge-caption-box">
      <p id="signbridge-caption-text">Ready to interpret...</p>
      <div id="signbridge-word-buffer"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);

  // Status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'signbridge-status-indicator';
  statusIndicator.className = 'signbridge-hidden';
  statusIndicator.textContent = 'SignBridge Active';
  document.body.appendChild(statusIndicator);

  return overlay;
}

// Find the video element in Google Meet
function findVideoElement() {
  // Google Meet's self-view video
  const videos = document.querySelectorAll('video');
  
  // Try to find the main self-view video (usually the first one that's not muted in the UI sense)
  for (const video of videos) {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      console.log('📹 Found video element:', video);
      return video;
    }
  }
  
  return videos[0] || null;
}

// Initialize MediaPipe HandLandmarker
async function initHandLandmarker() {
  try {
    console.log('🔄 Loading MediaPipe...');
    
    // Import MediaPipe from CDN
    const vision = await window.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    
    handLandmarker = await window.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    console.log('✅ MediaPipe loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load MediaPipe:', error);
    updateCaption('Error loading hand detection', true);
    return false;
  }
}

// Load MediaPipe library dynamically
function loadMediaPipeScript() {
  return new Promise((resolve, reject) => {
    if (window.HandLandmarker) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Classify hand landmarks
async function classifyGesture(landmarks) {
  try {
    // Simple client-side classification for built-in gestures
    const fingers = detectFingers(landmarks);
    const gesture = matchBuiltInGesture(fingers);
    
    if (gesture) {
      return gesture;
    }
    
    // For custom gestures, we'd need to call the backend
    // Skipping for MVP to keep it fast
    return null;
  } catch (error) {
    console.error('Classification error:', error);
    return null;
  }
}

// Detect which fingers are extended
function detectFingers(points) {
  const wrist = points[0];
  
  // Check each finger (simple heuristic)
  const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
  const fingerPips = [3, 6, 10, 14, 18];
  
  const extended = fingerTips.map((tip, i) => {
    const tipPoint = points[tip];
    const pipPoint = points[fingerPips[i]];
    const dist1 = Math.hypot(tipPoint.x - wrist.x, tipPoint.y - wrist.y);
    const dist2 = Math.hypot(pipPoint.x - wrist.x, pipPoint.y - wrist.y);
    return dist1 > dist2 * 1.15;
  });
  
  return extended;
}

// Match built-in gestures
function matchBuiltInGesture(fingers) {
  const patterns = [
    { pattern: [true, true, true, true, true], word: 'hello', confidence: 0.80 },
    { pattern: [false, false, false, false, false], word: 'stop', confidence: 0.85 },
    { pattern: [true, false, false, false, false], word: 'yes', confidence: 0.80 },
    { pattern: [false, true, true, false, false], word: 'please', confidence: 0.75 },
    { pattern: [false, true, false, false, false], word: 'wait', confidence: 0.80 },
  ];
  
  for (const { pattern, word, confidence } of patterns) {
    if (pattern.every((v, i) => v === fingers[i])) {
      return { word, confidence };
    }
  }
  
  return null;
}

// Update caption display
function updateCaption(text, isError = false) {
  const captionText = document.getElementById('signbridge-caption-text');
  if (captionText) {
    captionText.textContent = text;
    captionText.style.color = isError ? '#ff5252' : 'white';
  }
}

// Update word buffer display
function updateWordBuffer() {
  const bufferDiv = document.getElementById('signbridge-word-buffer');
  if (bufferDiv) {
    bufferDiv.textContent = wordBuffer.length > 0 
      ? `Words: ${wordBuffer.join(' · ')}` 
      : '';
  }
}

// Main detection loop
async function detectLoop() {
  if (!isActive || !videoElement || !handLandmarker) {
    return;
  }
  
  try {
    if (videoElement.readyState >= 2) {
      const now = performance.now();
      const results = handLandmarker.detectForVideo(videoElement, now);
      
      if (results && results.landmarks && results.landmarks[0]) {
        const landmarks = results.landmarks[0];
        const gesture = await classifyGesture(landmarks);
        
        if (gesture && gesture.word !== lastWord) {
          lastWord = gesture.word;
          lastWordTime = now;
          wordBuffer.push(gesture.word);
          
          const confidenceText = showConfidence 
            ? ` <span class="signbridge-confidence">${Math.round(gesture.confidence * 100)}%</span>` 
            : '';
          
          updateCaption(gesture.word.toUpperCase() + confidenceText);
          updateWordBuffer();
          
          console.log('👋 Detected:', gesture.word, `(${Math.round(gesture.confidence * 100)}%)`);
        } else if (now - lastWordTime > WORD_GAP_MS) {
          lastWord = null; // Allow repeating the same sign
        }
      } else {
        // No hand detected
        if (wordBuffer.length === 0) {
          updateCaption('Show a hand sign...');
        }
      }
    }
  } catch (error) {
    console.error('Detection error:', error);
  }
  
  rafId = requestAnimationFrame(detectLoop);
}

// Start interpretation
async function start() {
  if (isActive) return;
  
  console.log('▶️  Starting SignBridge interpretation');
  
  // Show loading
  updateCaption('Loading hand detection...');
  
  // Find video element
  videoElement = findVideoElement();
  if (!videoElement) {
    updateCaption('No video found. Make sure your camera is on!', true);
    console.error('❌ No video element found');
    return;
  }
  
  // Load MediaPipe
  try {
    await loadMediaPipeScript();
    const loaded = await initHandLandmarker();
    if (!loaded) return;
  } catch (error) {
    console.error('Failed to initialize:', error);
    updateCaption('Failed to load. Please refresh the page.', true);
    return;
  }
  
  isActive = true;
  wordBuffer = [];
  lastWord = null;
  
  // Show overlay
  const overlay = document.getElementById('signbridge-overlay');
  const statusIndicator = document.getElementById('signbridge-status-indicator');
  if (overlay) overlay.classList.remove('signbridge-hidden');
  if (statusIndicator) statusIndicator.classList.remove('signbridge-hidden');
  
  updateCaption('Ready! Show a sign...');
  
  // Start detection loop
  detectLoop();
  
  // Notify popup
  chrome.runtime.sendMessage({ action: 'statusUpdate', isActive: true });
}

// Stop interpretation
function stop() {
  if (!isActive) return;
  
  console.log('⏹️  Stopping SignBridge interpretation');
  
  isActive = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  
  // Hide overlay
  const overlay = document.getElementById('signbridge-overlay');
  const statusIndicator = document.getElementById('signbridge-status-indicator');
  if (overlay) overlay.classList.add('signbridge-hidden');
  if (statusIndicator) statusIndicator.classList.add('signbridge-hidden');
  
  wordBuffer = [];
  lastWord = null;
  
  // Notify popup
  chrome.runtime.sendMessage({ action: 'statusUpdate', isActive: false });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message);
  
  if (message.action === 'start') {
    start();
  } else if (message.action === 'stop') {
    stop();
  } else if (message.action === 'updateSettings') {
    if (message.settings.showConfidence !== undefined) {
      showConfidence = message.settings.showConfidence;
    }
  }
  
  sendResponse({ success: true });
  return true;
});

// Initialize overlay on load
createOverlay();

// Load saved settings
chrome.storage.local.get(['showConfidence'], (result) => {
  showConfidence = result.showConfidence !== false;
});

console.log('✅ SignBridge content script ready');
