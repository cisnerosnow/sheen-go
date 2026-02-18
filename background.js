// tabId -> true/false si esta corriendo
const activeTabs = new Set();

// Restaurar estado al despertar el service worker
chrome.storage.session.get('activeTabs', (data) => {
  if (data.activeTabs) {
    data.activeTabs.forEach((id) => activeTabs.add(id));
  }
});

function saveState() {
  chrome.storage.session.set({ activeTabs: [...activeTabs] });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const { action, tabId } = msg;

  if (action === 'getState') {
    sendResponse({ running: activeTabs.has(tabId) });
    return;
  }

  if (action === 'start') {
    activeTabs.add(tabId);
    saveState();
    chrome.tabs.sendMessage(tabId, { action: 'start', config: msg.config }, () => {
      // Ignorar error si el content script aun no esta listo
      void chrome.runtime.lastError;
    });
    sendResponse({ ok: true });
    return;
  }

  if (action === 'stop') {
    activeTabs.delete(tabId);
    saveState();
    chrome.tabs.sendMessage(tabId, { action: 'stop' }, () => {
      void chrome.runtime.lastError;
    });
    sendResponse({ ok: true });
    return;
  }
});

// Limpiar cuando se cierra la pestaña
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
    saveState();
  }
});
