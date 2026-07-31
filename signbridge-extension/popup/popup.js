let isActive = false;
const toggleBtn = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');

toggleBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    statusText.textContent = 'No active tab';
    return;
  }

  isActive = !isActive;
  toggleBtn.textContent = isActive ? 'Stop' : 'Start';
  statusText.textContent = isActive ? 'Active' : 'Stopped';

  try {
    await chrome.tabs.sendMessage(tab.id, { 
      action: isActive ? 'start' : 'stop' 
    });
    chrome.storage.local.set({ isActive });
  } catch (err) {
    // If content script not loaded, try injecting it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/overlay.js']
      });
      // Try message again
      await chrome.tabs.sendMessage(tab.id, { 
        action: isActive ? 'start' : 'stop' 
      });
      chrome.storage.local.set({ isActive });
    } catch (err2) {
      statusText.textContent = 'Refresh page and try again';
      isActive = !isActive;
    }
  }
};

chrome.storage.local.get('isActive', (result) => {
  isActive = result.isActive || false;
  toggleBtn.textContent = isActive ? 'Stop' : 'Start';
  statusText.textContent = isActive ? 'Active' : 'Stopped';
});
