console.log('SignBridge service worker active');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'popup') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message).catch(() => {});
    }
  }
  sendResponse({ ok: true });
});
