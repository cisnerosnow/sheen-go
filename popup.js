const btnStart = document.getElementById('btnStart');
const btnStop  = document.getElementById('btnStop');
const dot      = document.getElementById('dot');
const label    = document.getElementById('statusLabel');

let currentTabId = null;

function setRunning(running) {
  dot.classList.toggle('active', running);
  label.textContent      = running ? 'Activo' : 'Inactivo';
  btnStart.style.display = running ? 'none'  : 'block';
  btnStop.style.display  = running ? 'block' : 'none';
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  currentTabId = tab.id;

  // Preguntar al background si esta pestaña ya esta corriendo
  chrome.runtime.sendMessage({ action: 'getState', tabId: currentTabId }, (res) => {
    setRunning(res?.running ?? false);
  });
}

btnStart.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ action: 'start', tabId: currentTabId }, () => {
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
