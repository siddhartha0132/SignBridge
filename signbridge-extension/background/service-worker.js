// Background service worker for SignBridge extension
// Handles persistent state and communication between popup and content scripts

console.log('🔧 SignBridge service worker initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 SignBridge extension installed!');
    
    // Set default settings
    chrome.storage.local.set({
      isActive: false,
      showConfidence: true,
      soundEnabled: true
    });
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'https://signbridge.app/welcome' });
  } else if (details.reason === 'update') {
    console.log('🔄 SignBridge extension updated to', chrome.runtime.getManifest().version);
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);
  
  if (message.action === 'statusUpdate') {
    // Relay status updates
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might be closed, that's okay
    });
  }
  
  sendResponse({ success: true });
  return true;
});

// Monitor tab changes to reset state if user leaves Meet
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isMeet = tab.url.includes('meet.google.com');
    
    if (!isMeet) {
      // User left Meet, reset state
      chrome.storage.local.get(['isActive'], (result) => {
        if (result.isActive) {
          console.log('📍 User left Meet, stopping interpretation');
          chrome.storage.local.set({ isActive: false });
        }
      });
    }
  }
});

// Keep service worker alive (important for Manifest V3)
chrome.runtime.onConnect.addListener((port) => {
  console.log('🔌 Port connected:', port.name);
});

console.log('✅ Service worker ready');
