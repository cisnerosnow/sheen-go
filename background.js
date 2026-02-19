// tabId -> true/false si esta corriendo
const activeTabs = new Set();

// Restaurar estado al despertar el service worker
// NOTA: este get es async, por eso getState NO usa activeTabs en memoria
// sino que lee session storage directamente (ver handler getState abajo)
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
    // BUG FIX: leer activeTabs directo de session storage y NO del Set en memoria.
    // Cuando el service worker acaba de despertar, el Set puede estar vacío porque
    // el chrome.storage.session.get del top-level aún no completó (es async).
    chrome.storage.session.get(['activeTabs', 'commentIndex'], (data) => {
      const tabs = new Set(data.activeTabs || []);
      // Aprovechar para sincronizar la memoria también
      tabs.forEach((id) => activeTabs.add(id));
      sendResponse({ running: tabs.has(tabId), commentIndex: data.commentIndex ?? 0 });
    });
    return true; // respuesta async
  }

  if (action === 'contentReady') {
    // BUG FIX: el content script avisa que acaba de cargarse (carga inicial o recarga
    // de página). Si ese tab debía estar corriendo, re-enviarle start para reanudar.
    sendResponse({ ok: true }); // responder de inmediato para no bloquear el content
    const senderTabId = _sender.tab?.id;
    if (!senderTabId) return;

    chrome.storage.session.get(['activeTabs', 'commentIndex'], (data) => {
      const tabs = new Set(data.activeTabs || []);
      if (!tabs.has(senderTabId)) return; // no estaba activo, nada que hacer

      activeTabs.add(senderTabId); // re-sincronizar memoria
      chrome.storage.local.get('sheenConfig', (cfg) => {
        if (!cfg.sheenConfig) return;
        chrome.tabs.sendMessage(senderTabId, {
          action: 'start',
          config: cfg.sheenConfig,
          resumeCommentIndex: data.commentIndex ?? 0,
        }, () => { void chrome.runtime.lastError; });
      });
    });
    return;
  }

  if (action === 'start') {
    activeTabs.add(tabId);
    saveState();
    chrome.storage.session.set({ commentIndex: 0 });
    chrome.tabs.sendMessage(tabId, { action: 'start', config: msg.config }, () => {
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

  if (action === 'commentProgress') {
    chrome.storage.session.set({ commentIndex: msg.index });
    sendResponse({ ok: true });
    return;
  }

  if (action === 'callClaude') {
    const { apiKey, systemPrompt, chatContext } = msg;
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: `${systemPrompt}\n\nContexto del chat:\n${chatContext}` }],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        console.log('[sheen-go claude bg] respuesta API:', JSON.stringify(data));
        sendResponse({ text: data.content?.[0]?.text ?? null });
      })
      .catch((err) => {
        console.error('[sheen-go claude bg] error fetch:', err);
        sendResponse({ text: null });
      });
    return true; // respuesta async
  }
});

// Limpiar cuando se cierra la pestaña
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
    saveState();
  }
});
