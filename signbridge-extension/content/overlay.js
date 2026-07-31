console.log('🤝 SignBridge Gesture Detection Started');

let isActive = false;
let wordBuffer = [];

const HAND_MODEL_URL = chrome.runtime.getURL('lib/hand_landmarker.task');
const BUNDLE_URL = chrome.runtime.getURL('lib/vision_bundle.mjs');
const WASM_PATH = chrome.runtime.getURL('lib/wasm');

function detectPlatform() {
  const url = window.location.hostname;
  if (url.includes('meet.google.com')) return '📹 Google Meet';
  if (url.includes('zoom.us')) return '💻 Zoom';
  if (url.includes('teams')) return '👥 MS Teams';
  if (url.includes('webex')) return '🌐 Webex';
  if (url.includes('jitsi')) return '🎥 Jitsi';
  return '⚡ Video Call';
}

function createOverlay() {
  const existing = document.getElementById('signbridge-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'signbridge-overlay';
  overlay.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background: rgba(30, 30, 40, 0.95); 
                color: white; padding: 20px; border-radius: 12px; min-width: 280px; 
                font-family: -apple-system, BlinkMacSystemFont, sans-serif; z-index: 99999; 
                border: 2px solid #00d4ff; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);">
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">🤝 SignBridge</div>
      <div style="font-size: 12px; color: #888; margin-bottom: 12px;">${detectPlatform()}</div>
      <div id="caption" style="font-size: 14px; color: #00d4ff; min-height: 24px; margin-bottom: 12px;">Ready</div>
      <div id="chips" style="margin-bottom: 12px;"></div>
      <button id="clear-btn" style="background: #00d4ff; color: black; border: none; padding: 8px 12px; 
              border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 12px;">Clear</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('clear-btn').onclick = () => {
    wordBuffer = [];
    document.getElementById('caption').textContent = 'Ready';
    document.getElementById('chips').innerHTML = '';
  };
}

function updateCaption(text) {
  const el = document.getElementById('caption');
  if (el) el.textContent = text;
}

function updateChips() {
  const chips = document.getElementById('chips');
  if (!chips) return;
  chips.innerHTML = wordBuffer.map(w =>
    `<span style="display: inline-block; background: #00d4ff; color: black; padding: 4px 8px; 
                 margin: 2px 4px 2px 0; border-radius: 4px; font-size: 11px; font-weight: bold;">${w}</span>`
  ).join('');
}

// Bridge: listen for results/status coming back from the MAIN-world worker
window.addEventListener('signbridge:status', (e) => {
  const { status, detail } = e.detail || {};
  console.log('📡 Worker status:', status, detail || '');
  if (status === 'loading') updateCaption(detail || 'Loading...');
  if (status === 'ready') {
    isActive = true;
    updateCaption('Ready - Show hand');
  }
  if (status === 'error') {
    console.error('❌ MediaPipe worker error:', detail);
    updateCaption('Error: ' + detail);
    isActive = false;
  }
  if (status === 'stopped') {
    isActive = false;
  }
});

window.addEventListener('signbridge:gesture', (e) => {
  const { gesture } = e.detail || {};
  if (!gesture) return;
  wordBuffer.push(gesture);
  updateCaption(`Detected: ${gesture.toUpperCase()}`);
  updateChips();
  console.log('✅ Gesture:', gesture);
});

function start() {
  if (isActive) return;
  console.log('▶️ START clicked');
  createOverlay();
  updateCaption('Loading MediaPipe...');

  // Hand off to the MAIN-world worker (content/mediapipe-worker.js) with
  // pre-resolved extension URLs, since that script has no chrome.* access.
  window.dispatchEvent(new CustomEvent('signbridge:start', {
    detail: {
      bundleUrl: BUNDLE_URL,
      wasmPath: WASM_PATH,
      modelUrl: HAND_MODEL_URL,
    },
  }));
}

function stop() {
  console.log('⏹️ STOP clicked');
  window.dispatchEvent(new CustomEvent('signbridge:stop'));
  isActive = false;
  const el = document.getElementById('signbridge-overlay');
  if (el) el.remove();
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start') start();
  if (msg.action === 'stop') stop();
});

console.log('✅ SignBridge ready');
