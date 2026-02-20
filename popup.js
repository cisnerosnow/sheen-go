// --- DOM refs ---
const btnStart        = document.getElementById('btnStart');
const btnStop         = document.getElementById('btnStop');
const dot             = document.getElementById('dot');
const label           = document.getElementById('statusLabel');

// Tab indicators
const indLikes        = document.getElementById('indLikes');
const indComments     = document.getElementById('indComments');
const indAi           = document.getElementById('indAi');

// Feature toggles
const likesEnabled    = document.getElementById('likesEnabled');
const commentsEnabled = document.getElementById('commentsEnabled');
const aiEnabled       = document.getElementById('aiEnabled');

// Likes
const likesMin        = document.getElementById('likesMin');
const likesMax        = document.getElementById('likesMax');
const pauseMin        = document.getElementById('pauseMin');
const pauseMax        = document.getElementById('pauseMax');

// Comments
const commentJson     = document.getElementById('commentJson');
const commentCounter  = document.getElementById('commentCounter');
const commentPauseMin = document.getElementById('commentPauseMin');
const commentPauseMax = document.getElementById('commentPauseMax');
const btnRepeat       = document.getElementById('btnRepeat');

// AI
const aiProvider      = document.getElementById('aiProvider');
const myUsername      = document.getElementById('myUsername');
const apiKey          = document.getElementById('apiKey');
const aiPrompt        = document.getElementById('aiPrompt');
const aiPauseMin      = document.getElementById('aiPauseMin');
const aiPauseMax      = document.getElementById('aiPauseMax');

let currentTabId = null;
let repeatActive = false;
let pollInterval = null;

// --- Tab switching ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.remove('hidden');
  });
});

// --- Tab indicators + dimming ---
function updateIndicators() {
  indLikes.style.background    = likesEnabled.checked    ? '#00e676' : '#333';
  indComments.style.background = commentsEnabled.checked ? '#00e676' : '#333';
  indAi.style.background       = aiEnabled.checked       ? '#00e676' : '#333';
}

function updateDimming() {
  document.getElementById('likesCfg').classList.toggle('dimmed',    !likesEnabled.checked);
  document.getElementById('commentsCfg').classList.toggle('dimmed', !commentsEnabled.checked);
  document.getElementById('aiCfg').classList.toggle('dimmed',       !aiEnabled.checked);
}

likesEnabled.addEventListener('change', () => { updateIndicators(); updateDimming(); saveConfig(); });

commentsEnabled.addEventListener('change', () => {
  if (commentsEnabled.checked) aiEnabled.checked = false;
  updateIndicators(); updateDimming(); saveConfig();
});

aiEnabled.addEventListener('change', () => {
  if (aiEnabled.checked) commentsEnabled.checked = false;
  updateIndicators(); updateDimming(); saveConfig();
});

// --- Auto-save ---
function saveConfig() {
  chrome.storage.local.set({ sheenConfig: getConfig() });
}

// --- Comment counter ---
function parseComments() {
  const raw = commentJson.value.trim();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr.filter((s) => typeof s === 'string' && s.trim().length > 0);
  } catch {
    return null;
  }
}

function updateCommentCounter(sent) {
  const comments = parseComments();
  if (comments === null) {
    commentCounter.textContent = '⚠ Invalid JSON';
    commentCounter.className   = 'comment-counter error';
    return;
  }
  const n = comments.length;
  if (n === 0) { commentCounter.textContent = ''; commentCounter.className = 'comment-counter'; return; }
  if (sent >= n && !repeatActive) {
    commentCounter.textContent = `✓ All sent (${n}/${n})`;
    commentCounter.className   = 'comment-counter has-comments';
    return;
  }
  const next      = (sent % n) + 1;
  const remaining = n - (sent % n);
  commentCounter.textContent = `Message ${next} / ${n}  ·  ${remaining} remaining`;
  commentCounter.className   = 'comment-counter has-comments';
}

// --- Config ---
function getConfig() {
  return {
    likesEnabled:     likesEnabled.checked,
    likesMin:         Math.max(1, parseInt(likesMin.value) || 10),
    likesMax:         Math.max(1, parseInt(likesMax.value) || 20),
    pauseMin:         Math.max(1, parseInt(pauseMin.value) || 20),
    pauseMax:         Math.max(1, parseInt(pauseMax.value) || 50),
    commentsEnabled:  commentsEnabled.checked,
    comments:         parseComments() ?? [],
    repeatComments:   repeatActive,
    commentsJson:     commentJson.value,
    commentPauseMin:  Math.max(1, parseInt(commentPauseMin.value) || 10),
    commentPauseMax:  Math.max(1, parseInt(commentPauseMax.value) || 15),
    aiEnabled:        aiEnabled.checked,
    aiProvider:       aiProvider.value,
    myUsername:       myUsername.value.trim().replace(/^@/, ''),
    apiKey:           apiKey.value.trim(),
    aiPrompt:         aiPrompt.value.trim(),
    aiPauseMin:       Math.max(1, parseInt(aiPauseMin.value) || 20),
    aiPauseMax:       Math.max(1, parseInt(aiPauseMax.value) || 40),
  };
}

function applyConfig(cfg) {
  if (cfg.likesEnabled    != null) likesEnabled.checked    = cfg.likesEnabled;
  if (cfg.commentsEnabled != null) commentsEnabled.checked = cfg.commentsEnabled;
  if (cfg.aiEnabled       != null) aiEnabled.checked       = cfg.aiEnabled ?? cfg.claudeEnabled;
  likesMin.value = cfg.likesMin ?? 10;
  likesMax.value = cfg.likesMax ?? 20;
  pauseMin.value = cfg.pauseMin ?? 20;
  pauseMax.value = cfg.pauseMax ?? 50;
  if (cfg.commentsJson    != null) commentJson.value    = cfg.commentsJson;
  if (cfg.commentPauseMin != null) commentPauseMin.value = cfg.commentPauseMin;
  if (cfg.commentPauseMax != null) commentPauseMax.value = cfg.commentPauseMax;
  if (cfg.myUsername      != null) myUsername.value      = cfg.myUsername;
  if (cfg.apiKey          != null) apiKey.value          = cfg.apiKey;
  if (cfg.aiProvider      != null) aiProvider.value      = cfg.aiProvider ?? 'anthropic';
  if (cfg.aiPrompt        != null) aiPrompt.value        = cfg.aiPrompt ?? cfg.claudePrompt;
  // not: if no saved prompt, keep the default from HTML (already there)
  if (cfg.aiPauseMin      != null) aiPauseMin.value      = cfg.aiPauseMin ?? cfg.claudePauseMin ?? 20;
  if (cfg.aiPauseMax      != null) aiPauseMax.value      = cfg.aiPauseMax ?? cfg.claudePauseMax ?? 40;
  repeatActive = cfg.repeatComments ?? false;
  btnRepeat.classList.toggle('active', repeatActive);
  updateIndicators();
  updateDimming();
}

// --- Running state ---
// Todos los inputs que se bloquean mientras corre
const allInputs = [
  likesEnabled, commentsEnabled, aiEnabled,
  likesMin, likesMax, pauseMin, pauseMax,
  commentJson, commentPauseMin, commentPauseMax,
  aiProvider, myUsername, apiKey, aiPrompt, aiPauseMin, aiPauseMax,
];

function setRunning(running, commentIndex = 0) {
  dot.classList.toggle('active', running);
  label.textContent      = running ? 'Active' : 'Inactive';
  btnStart.style.display = running ? 'none'   : 'block';
  btnStop.style.display  = running ? 'block'  : 'none';

  allInputs.forEach((el) => {
    el.disabled = running;
    // Al correr: opacidad uniforme. Al parar: quitar inline para que CSS maneje el dimming.
    el.style.opacity = running ? '0.5' : '';
  });
  btnRepeat.disabled = running;

  updateCommentCounter(running ? commentIndex : 0);
  if (running) startPolling(); else stopPolling();
}

// --- Polling del contador ---
function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(() => {
    if (!currentTabId) return;
    chrome.runtime.sendMessage({ action: 'getState', tabId: currentTabId }, (res) => {
      if (res?.running) updateCommentCounter(res.commentIndex ?? 0);
    });
  }, 2000);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

// --- Init ---
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  currentTabId = tab.id;

  chrome.storage.local.get('sheenConfig', (data) => {
    if (data.sheenConfig) applyConfig(data.sheenConfig);
    updateCommentCounter(0);
  });

  chrome.runtime.sendMessage({ action: 'getState', tabId: currentTabId }, (res) => {
    setRunning(res?.running ?? false, res?.commentIndex ?? 0);
  });
}

// --- Botones ---
btnStart.addEventListener('click', () => {
  if (!currentTabId) return;
  const cfg = getConfig();
  if (cfg.likesMin > cfg.likesMax) cfg.likesMax = cfg.likesMin;
  if (cfg.pauseMin > cfg.pauseMax) cfg.pauseMax = cfg.pauseMin;
  if (cfg.commentPauseMin > cfg.commentPauseMax) cfg.commentPauseMax = cfg.commentPauseMin;
  chrome.storage.local.set({ sheenConfig: cfg });
  chrome.runtime.sendMessage({ action: 'start', tabId: currentTabId, config: cfg }, () => {
    setRunning(true, 0);
  });
});

btnStop.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ action: 'stop', tabId: currentTabId }, () => {
    setRunning(false, 0);
  });
});

btnRepeat.addEventListener('click', () => {
  if (btnRepeat.disabled) return;
  repeatActive = !repeatActive;
  btnRepeat.classList.toggle('active', repeatActive);
  updateCommentCounter(0);
  saveConfig();
});

commentJson.addEventListener('input', () => { updateCommentCounter(0); saveConfig(); });

[likesMin, likesMax, pauseMin, pauseMax, commentPauseMin, commentPauseMax, aiPauseMin, aiPauseMax].forEach((el) => {
  el.addEventListener('change', saveConfig);
});

[aiProvider, myUsername, apiKey, aiPrompt].forEach((el) => {
  el.addEventListener('input', saveConfig);
});

// Inicializar estados visuales antes de que llegue la respuesta
updateIndicators();
updateDimming();
init();
