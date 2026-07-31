// Popup UI controller for the SignBridge extension
let isActive = false;

const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const showConfidence = document.getElementById('showConfidence');
const soundEnabled = document.getElementById('soundEnabled');

// Load saved state
chrome.storage.local.get(['isActive', 'showConfidence', 'soundEnabled'], (result) => {
  isActive = result.isActive || false;
  showConfidence.checked = result.showConfidence !== false;
  soundEnabled.checked = result.soundEnabled !== false;
  updateUI();
});

// Toggle interpretation on/off
toggleBtn.addEventListener('click', async () => {
  isActive = !isActive;
  
  // Save state
  await chrome.storage.local.set({ isActive });
  
  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab && tab.url && tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, {
      action: isActive ? 'start' : 'stop'
    });
    updateUI();
  } else {
    alert('Please open a Google Meet call first!');
    isActive = false;
    await chrome.storage.local.set({ isActive: false });
    updateUI();
  }
});

// Save settings
showConfidence.addEventListener('change', async () => {
  await chrome.storage.local.set({ showConfidence: showConfidence.checked });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateSettings',
      settings: { showConfidence: showConfidence.checked }
    });
  }
});

soundEnabled.addEventListener('change', async () => {
  await chrome.storage.local.set({ soundEnabled: soundEnabled.checked });
});

function updateUI() {
  if (isActive) {
    toggleBtn.textContent = 'Stop Interpretation';
    toggleBtn.classList.add('stop');
    statusText.textContent = 'Active';
    statusDot.classList.add('active');
  } else {
    toggleBtn.textContent = 'Start Interpretation';
    toggleBtn.classList.remove('stop');
    statusText.textContent = 'Not Active';
    statusDot.classList.remove('active');
  }
}

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'statusUpdate') {
    isActive = message.isActive;
    updateUI();
  }
});
