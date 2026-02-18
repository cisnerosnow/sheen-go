const btnStart  = document.getElementById('btnStart');
const btnStop   = document.getElementById('btnStop');
const dot       = document.getElementById('dot');
const label     = document.getElementById('statusLabel');
const likesMin  = document.getElementById('likesMin');
const likesMax  = document.getElementById('likesMax');
const pauseMin  = document.getElementById('pauseMin');
const pauseMax  = document.getElementById('pauseMax');

let currentTabId = null;

function getConfig() {
  return {
    likesMin: Math.max(1, parseInt(likesMin.value) || 10),
    likesMax: Math.max(1, parseInt(likesMax.value) || 20),
    pauseMin: Math.max(1, parseInt(pauseMin.value) || 20),
    pauseMax: Math.max(1, parseInt(pauseMax.value) || 50),
  };
}

function applyConfig(cfg) {
  likesMin.value = cfg.likesMin;
  likesMax.value = cfg.likesMax;
  pauseMin.value = cfg.pauseMin;
  pauseMax.value = cfg.pauseMax;
}

function setRunning(running) {
  dot.classList.toggle('active', running);
  label.textContent      = running ? 'Activo' : 'Inactivo';
  btnStart.style.display = running ? 'none'  : 'block';
  btnStop.style.display  = running ? 'block' : 'none';

  // Bloquear inputs mientras corre
  [likesMin, likesMax, pauseMin, pauseMax].forEach((el) => {
    el.disabled = running;
    el.style.opacity = running ? '0.4' : '1';
  });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  currentTabId = tab.id;

  // Cargar config guardada
  chrome.storage.local.get('sheenConfig', (data) => {
    if (data.sheenConfig) applyConfig(data.sheenConfig);
  });

  // Preguntar al background si esta pestaña ya esta corriendo
  chrome.runtime.sendMessage({ action: 'getState', tabId: currentTabId }, (res) => {
    setRunning(res?.running ?? false);
  });
}

btnStart.addEventListener('click', () => {
  if (!currentTabId) return;
  const cfg = getConfig();
  // Garantizar min <= max
  if (cfg.likesMin > cfg.likesMax) cfg.likesMax = cfg.likesMin;
  if (cfg.pauseMin > cfg.pauseMax) cfg.pauseMax = cfg.pauseMin;
  chrome.storage.local.set({ sheenConfig: cfg });
  chrome.runtime.sendMessage({ action: 'start', tabId: currentTabId, config: cfg }, () => {
    setRunning(true);
  });
});

btnStop.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ action: 'stop', tabId: currentTabId }, () => {
    setRunning(false);
  });
});

init();
