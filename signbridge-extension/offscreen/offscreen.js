// Offscreen document for SignBridge — runs MediaPipe HandLandmarker
// This runs in the extension's context with the extension's CSP (not Meet's page CSP)
// Opens webcam via getUserMedia, processes frames, sends gesture results back via chrome.runtime.sendMessage

console.log('🔧 Offscreen document script starting...');

let handLandmarker = null;
let webcamStream = null;
let videoElement = null;
let rafId = null;
let isActive = false;
let currentTabId = null;

// Queue for start messages that arrive before MediaPipe is ready
let pendingStart = null;

// WASM and model URLs
const WASM_BASE_URL = chrome.runtime.getURL('/lib/wasm');
const HAND_MODEL_URL = chrome.runtime.getURL('/lib/hand_landmarker.task');

console.log('📦 WASM Base URL:', WASM_BASE_URL);
console.log('📦 Hand Model URL:', HAND_MODEL_URL);

// Check if vision_bundle loaded
function checkMediaPipe() {
  console.log('🔍 Checking for MediaPipeVision...');
  console.log('typeof MediaPipeVision:', typeof MediaPipeVision);
  console.log('typeof window.MediaPipeVision:', typeof window.MediaPipeVision);
  console.log('typeof globalThis.MediaPipeVision:', typeof globalThis.MediaPipeVision);
  
  const vision = (typeof MediaPipeVision !== 'undefined' && MediaPipeVision)
              || (typeof window !== 'undefined' && window.MediaPipeVision)
              || (typeof globalThis !== 'undefined' && globalThis.MediaPipeVision);
  
  if (vision) {
    console.log('✅ MediaPipeVision found');
    console.log('Has FilesetResolver:', !!vision.FilesetResolver);
    console.log('Has HandLandmarker:', !!vision.HandLandmarker);
  } else {
    console.error('❌ MediaPipeVision NOT found in any scope');
  }
  return vision;
}

// Wait for vision_bundle.js to load (it's the first <script> in offscreen.html)
function waitForMediaPipe(timeout = 5000) {
  return new Promise((resolve, reject) => {
    let elapsed = 0;
    const checkInterval = 100;

    const check = () => {
      const vision = checkMediaPipe();
      if (vision) {
        console.log('✅ MediaPipe is ready');
        return resolve(vision);
      }

      elapsed += checkInterval;
      if (elapsed > timeout) {
        console.error('❌ MediaPipe did not load within', timeout, 'ms');
        return reject(new Error('MediaPipe Vision library timeout'));
      }

      setTimeout(check, checkInterval);
    };

    check();
  });
}

// Initialize MediaPipe HandLandmarker (runs freely in extension context)
async function initHandLandmarker() {
  try {
    console.log('🔄 Offscreen: Initializing MediaPipe...');

    const vision = await waitForMediaPipe();

    if (!vision?.FilesetResolver || !vision?.HandLandmarker) {
      throw new Error('MediaPipe Vision library incomplete — FilesetResolver or HandLandmarker missing');
    }

    const visionTasks = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);
    console.log('✅ Vision tasks resolver ready');

    const baseOptions = { modelAssetPath: HAND_MODEL_URL };
    const options = {
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };

    // Try GPU first, fallback to CPU
    for (const delegate of ['GPU', 'CPU']) {
      try {
        console.log(`🔧 Trying HandLandmarker (${delegate})...`);
        handLandmarker = await vision.HandLandmarker.createFromOptions(visionTasks, {
          ...options,
          baseOptions: { ...baseOptions, delegate },
        });
        console.log(`✅ HandLandmarker ready (${delegate})`);
        return true;
      } catch (err) {
        console.warn(`⚠️ ${delegate} delegate failed:`, err.message || err);
        handLandmarker = null;
      }
    }

    throw new Error('Both GPU and CPU delegates failed');
  } catch (error) {
    console.error('❌ MediaPipe init failed:', error);
    console.error('❌ Full error:', error.message, error.stack);
    sendToTab({ action: 'mediapipeError', error: String(error.message || error) });
    return false;
  }
}

// Open webcam in the offscreen document
async function openWebcam() {
  try {
    console.log('📹 Opening webcam...');
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });

    videoElement = document.createElement('video');
    videoElement.srcObject = webcamStream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true;

    await videoElement.play();
    console.log('✅ Webcam ready');
    return true;
  } catch (error) {
    console.error('❌ Webcam access failed:', error);
    sendToTab({ action: 'webcamError', error: String(error.message || error) });
    return false;
  }
}

// Gesture detection logic
function detectFingers(points) {
  const wrist = points[0];
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerPips = [3, 6, 10, 14, 18];

  return fingerTips.map((tip, i) => {
    const tipPoint = points[tip];
    const pipPoint = points[fingerPips[i]];
    const dist1 = Math.hypot(tipPoint.x - wrist.x, tipPoint.y - wrist.y);
    const dist2 = Math.hypot(pipPoint.x - wrist.x, pipPoint.y - wrist.y);
    return dist1 > dist2 * 1.15;
  });
}

function matchBuiltInGesture(fingers) {
  const patterns = [
    { pattern: [true, true, true, true, true], word: 'hello', confidence: 0.92 },
    { pattern: [false, false, false, false, false], word: 'stop', confidence: 0.90 },
    { pattern: [true, false, false, false, false], word: 'yes', confidence: 0.88 },
    { pattern: [false, true, true, false, false], word: 'please', confidence: 0.85 },
    { pattern: [false, true, false, false, false], word: 'wait', confidence: 0.88 },
    { pattern: [true, true, false, false, true], word: 'i-love-you', confidence: 0.94 },
    { pattern: [false, false, false, false, true], word: 'thank-you', confidence: 0.82 },
    { pattern: [false, true, true, true, false], word: 'ok', confidence: 0.86 },
  ];

  for (const { pattern, word, confidence } of patterns) {
    if (pattern.every((v, i) => v === fingers[i])) {
      return { word, confidence };
    }
  }
  return null;
}

// Detection loop
function detectLoop() {
  if (!isActive || !videoElement || !handLandmarker) {
    return;
  }

  if (videoElement.readyState < 2) {
    rafId = requestAnimationFrame(detectLoop);
    return;
  }

  try {
    const now = performance.now();
    const results = handLandmarker.detectForVideo(videoElement, now);

    if (results?.landmarks?.[0]) {
      const landmarks = results.landmarks[0];
      const fingers = detectFingers(landmarks);
      const gesture = matchBuiltInGesture(fingers);

      if (gesture) {
        sendToTab({ action: 'gestureDetected', gesture });
      }
    }
  } catch (error) {
    console.error('Detection error:', error);
  }

  rafId = requestAnimationFrame(detectLoop);
}

// Send message to content script via background
function sendToTab(message) {
  if (currentTabId) {
    console.log('📤 Sending to tab:', message.action);
    chrome.runtime.sendMessage({
      target: 'content',
      tabId: currentTabId,
      ...message,
    });
  }
}

// Start detection
async function start(tabId) {
  if (isActive) return;

  console.log('▶️ Starting detection for tab:', tabId);
  currentTabId = tabId;

  const mediapipeReady = handLandmarker || (await initHandLandmarker());
  if (!mediapipeReady) return;

  const webcamReady = webcamStream || (await openWebcam());
  if (!webcamReady) return;

  isActive = true;
  sendToTab({ action: 'detectionReady' });
  detectLoop();
  console.log('✅ Detection loop started');
}

// Stop detection
function stop() {
  if (!isActive) return;

  console.log('⏹️ Stopping detection');
  isActive = false;
  currentTabId = null;

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (webcamStream) {
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;
  }

  if (videoElement) {
    videoElement.srcObject = null;
    videoElement = null;
  }

  console.log('✅ Stopped');
}

// Listen for messages from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Offscreen received:', message.action, '| target:', message.target ?? 'none');

  if (message.target !== 'offscreen') return;

  if (message.action === 'start') {
    start(message.tabId)
      .then(() => {
        console.log('✅ Start completed');
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error('❌ Start failed:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  } else if (message.action === 'stop') {
    stop();
    sendResponse({ success: true });
  }
});

console.log('✅ Offscreen document ready, waiting for messages...');

