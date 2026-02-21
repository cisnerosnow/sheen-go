// Plataforma: 'tiktok' o 'youtube'
const PLATFORM = window.location.hostname.includes('youtube.com') ? 'youtube' : 'tiktok';

let running      = false;
let burstTimeout = null;
let burstIntvl   = null;
let countTimer   = null;

// Estado de comentarios
let commentIndex        = 0;
let commentBurstTimeout = null;
let claudeBurstTimeout  = null;

let cfgLikesEnabled      = true;
let cfgLikesMin          = 10;
let cfgLikesMax          = 20;
let cfgPauseMin          = 20;
let cfgPauseMax          = 50;
let cfgCommentsEnabled   = true;
let cfgComments          = [];
let cfgRepeatComments    = false;
let cfgCommentPauseMin   = 10;
let cfgCommentPauseMax   = 15;
let cfgAiEnabled         = false;
let cfgAiProvider        = 'anthropic';
let cfgApiKey            = '';
let cfgAiPrompt          = '';
let cfgAiPauseMin        = 20;
let cfgAiPauseMax        = 40;
let cfgMyUsername        = '';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------- Overlay ----------

function showOverlay(onDone) {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'sheen-go-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 22px;
    font-family: 'Segoe UI', sans-serif;
  `;

  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('logo.png');
  logo.style.cssText = `
    width: 110px;
    height: auto;
    border-radius: 18px;
    box-shadow: 0 0 40px rgba(254, 44, 85, 0.5);
  `;

  const msg = document.createElement('p');
  msg.textContent = 'sheen-go estará enviando likes automáticamente\n(puedes detenerlo desde el mismo lugar donde iniciaste el plugin)';
  msg.style.cssText = `
    color: #fff;
    font-size: 16px;
    text-align: center;
    max-width: 380px;
    line-height: 1.6;
    white-space: pre-line;
    margin: 0;
    text-shadow: 0 1px 8px rgba(0,0,0,0.8);
  `;

  const num = document.createElement('div');
  num.id = 'sheen-go-num';
  num.textContent = '5';
  num.style.cssText = `
    color: #fe2c55;
    font-size: 72px;
    font-weight: 900;
    line-height: 1;
    text-shadow: 0 0 30px rgba(254, 44, 85, 0.7);
  `;

  overlay.appendChild(logo);
  overlay.appendChild(msg);
  overlay.appendChild(num);
  document.body.appendChild(overlay);

  // Countdown 5 → 1, luego dispara onDone
  let count = 5;
  countTimer = setInterval(() => {
    count--;
    const el = document.getElementById('sheen-go-num');
    if (el) el.textContent = count;

    if (count <= 0) {
      clearInterval(countTimer);
      countTimer = null;
      removeOverlay();
      onDone();
    }
  }, 1000);
}

function removeOverlay() {
  if (countTimer) {
    clearInterval(countTimer);
    countTimer = null;
  }
  const el = document.getElementById('sheen-go-overlay');
  if (el) el.remove();
}

// ---------- Key simulation (likes) ----------

function pressL() {
  if (PLATFORM === 'youtube') {
    // YouTube: no soportado por ahora
    return;
  }

  // TikTok: simular tecla L
  const target = document.activeElement || document.body;

  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    target.dispatchEvent(new KeyboardEvent(type, {
      key: 'l', code: 'KeyL', keyCode: 76, which: 76,
      bubbles: true, cancelable: true,
    }));
  });
}

// ---------- Comment simulation ----------

async function typeTextAndClick(text, delay = 80, humanize = false) {
  let editable;
  let sendButton;

  if (PLATFORM === 'youtube') {
    // YouTube Live selectors
    console.log('[sheen-go youtube] intentando enviar comentario:', text);
    editable = document.querySelector('#input.style-scope.yt-live-chat-text-input-field-renderer');
    sendButton = document.querySelector('#send-button button');
    console.log('[sheen-go youtube] input:', editable);
    console.log('[sheen-go youtube] sendButton:', sendButton);

    if (!editable || !sendButton) {
      console.error('[sheen-go youtube] No se encontró el input o el botón');
      // Intentar selectores alternativos
      editable = document.querySelector('#input');
      sendButton = document.querySelector('yt-button-renderer#send-button button, #send-button button');
      console.log('[sheen-go youtube] intentando selectores alternativos - input:', editable, 'button:', sendButton);
      if (!editable || !sendButton) return;
    }

    editable.focus();
    editable.textContent = text;
    editable.dispatchEvent(new Event('input', { bubbles: true }));
    editable.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(r => setTimeout(r, 200)); // breve pausa antes de enviar
    sendButton.click();
    console.log('[sheen-go youtube] mensaje enviado');
    return;
  }

  // TikTok: lógica original de tipeo carácter por carácter
  editable = document.querySelector('div[contenteditable="plaintext-only"]');
  if (!editable) return;

  editable.focus();

  // Colocar cursor al final
  const range = document.createRange();
  range.selectNodeContents(editable);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  const typeChar = async (char) => {
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    document.execCommand('insertText', false, char);
    editable.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    await wait(delay + randInt(-15, 30));
  };

  const backspace = async () => {
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8, bubbles: true }));
    document.execCommand('delete', false);
    editable.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8, bubbles: true }));
    await wait(delay + randInt(10, 50));
  };

  const chars = [...text];
  const n     = chars.length;

  // Planear los errores una sola vez antes de empezar a escribir
  const overshootAt = new Set(); // índices donde, después de escribir el char, se "pasa" 1-2 letras
  let deleteAt = -1;             // índice donde se borran y reescriben N chars anteriores
  let deleteN  = 0;

  if (humanize && n >= 5) {
    // 1-2 posiciones de overshoot (no en los últimos 2 chars)
    const overshootCount = randInt(1, 2);
    const pool = Array.from({ length: n - 2 }, (_, i) => i);
    for (let i = 0; i < overshootCount && pool.length > 0; i++) {
      const pick = randInt(0, pool.length - 1);
      overshootAt.add(pool[pick]);
      pool.splice(pick, 1);
    }

    // 1 evento de borrar-y-reescribir (necesita al menos deleteN chars previos y 2 siguientes)
    deleteN = randInt(2, 3);
    if (n >= deleteN + 3) {
      deleteAt = randInt(deleteN, n - 2);
    }
  }

  // Letras de teclado cercanas para simular tecla equivocada (home row + adyacentes)
  const fatFingerChars = 'qwrtyuasdfghjklzxcvbnm';

  for (let i = 0; i < n; i++) {
    // Borrar los últimos deleteN chars y reescribirlos
    if (i === deleteAt) {
      for (let d = 0; d < deleteN; d++) await backspace();
      await wait(randInt(80, 200)); // pausa breve como "pensando"
      for (let d = deleteN - 1; d >= 0; d--) await typeChar(chars[i - 1 - d]);
    }

    // Escribir el char correcto
    await typeChar(chars[i]);

    // Pasarse: escribir 1-2 chars equivocados y borrarlos
    if (overshootAt.has(i)) {
      const extraCount = randInt(1, 2);
      for (let e = 0; e < extraCount; e++) {
        await wait(randInt(30, 80));
        await typeChar(fatFingerChars[randInt(0, fatFingerChars.length - 1)]);
      }
      await wait(randInt(80, 180)); // "espera, me pasé"
      for (let e = 0; e < extraCount; e++) await backspace();
    }
  }

  const button = document.querySelector('.w-24.h-24.rounded-full.cursor-pointer');
  if (!button) return;

  button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  button.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true }));
  button.dispatchEvent(new MouseEvent('click',     { bubbles: true }));
}

// ---------- Burst logic (likes) ----------

function doBurst() {
  if (!running) return;

  const likes = randInt(cfgLikesMin, cfgLikesMax);
  let sent = 0;

  function sendNext() {
    if (!running || sent >= likes) {
      burstIntvl = null;
      if (running) {
        const delay = randInt(cfgPauseMin, cfgPauseMax) * 1000;
        burstTimeout = setTimeout(doBurst, delay);
      }
      return;
    }
    pressL();
    sent++;
    burstIntvl = setTimeout(sendNext, randInt(100, 500));
  }

  sendNext();
}

// ---------- Burst logic (comentarios) ----------

async function doCommentBurst() {
  if (!running || cfgComments.length === 0) return;

  if (commentIndex >= cfgComments.length) {
    if (cfgRepeatComments) {
      commentIndex = 0;
    } else {
      return; // se acabaron los comentarios, likes continúan
    }
  }

  const text = cfgComments[commentIndex];
  commentIndex++;

  // BUG FIX: agregar callback vacío para silenciar lastError si el SW estaba dormido
  chrome.runtime.sendMessage({ action: 'commentProgress', index: commentIndex }, () => {
    void chrome.runtime.lastError;
  });

  // 40 % de los mensajes (~2 de cada 5) llevan errores orgánicos de tipeo
  const humanize = Math.random() < 0.4;
  await typeTextAndClick(text, 80, humanize);

  if (running) {
    const delay = randInt(cfgCommentPauseMin, cfgCommentPauseMax) * 1000;
    commentBurstTimeout = setTimeout(doCommentBurst, delay);
  }
}

// ---------- AI burst ----------

function callAi(provider, apiKey, systemPrompt, chatContext) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'callAi', provider, apiKey, systemPrompt, chatContext },
      (res) => { void chrome.runtime.lastError; resolve(res?.text ?? null); }
    );
  });
}

async function doAiBurst() {
  if (!running || !cfgAiEnabled || !cfgApiKey) {
    console.log('[sheen-go ai] salida temprana — running:', running, 'aiEnabled:', cfgAiEnabled, 'apiKey:', !!cfgApiKey);
    return;
  }

  // Si el último mensaje del chat fue del propio usuario, esperar a que alguien más hable
  if (cfgMyUsername && lastSenderUsername &&
      lastSenderUsername.toLowerCase() === cfgMyUsername.toLowerCase()) {
    console.log('[sheen-go ai] último mensaje es del propio usuario (@' + lastSenderUsername + '), esperando...');
    if (running) {
      const delay = randInt(cfgAiPauseMin, cfgAiPauseMax) * 1000;
      claudeBurstTimeout = setTimeout(doAiBurst, delay);
    }
    return;
  }

  // Tomar los últimos 5 mensajes de cada usuario (máx 10 usuarios)
  const lines = [];
  for (const [user, msgs] of userMessages) {
    lines.push(`${user}: ${msgs.slice(-5).join(', ')}`);
    if (lines.length >= 10) break;
  }

  console.log('[sheen-go ai] contexto del chat (' + lines.length + ' usuarios):\n' + (lines.join('\n') || '(vacío)'));

  if (lines.length > 0) {
    console.log('[sheen-go ai] enviando a ' + cfgAiProvider + ' con prompt:', cfgAiPrompt);
    const text = await callAi(cfgAiProvider, cfgApiKey, cfgAiPrompt, lines.join('\n'));
    console.log('[sheen-go ai] respuesta:', text);
    if (text && running) {
      await typeTextAndClick(text.trim(), 80, Math.random() < 0.4);
    }
  } else {
    console.log('[sheen-go ai] no hay mensajes de otros usuarios aún, saltando llamada');
  }

  if (running) {
    const delay = randInt(cfgAiPauseMin, cfgAiPauseMax) * 1000;
    console.log('[sheen-go ai] próxima llamada en', delay / 1000, 's');
    claudeBurstTimeout = setTimeout(doAiBurst, delay);
  }
}

// ---------- Chat tracking ----------

// Mensajes acumulados por usuario (string[]). Se limpia al llegar a 50.
const userMessages = new Map();
let lastSeenMsgIndex    = -1;
let lastSenderUsername  = null; // último usuario que habló (incluye el propio)
let chatPollInterval    = null;

// Igual que la función del usuario pero devuelve también el data-index
// para poder detectar mensajes nuevos sin re-procesar los ya contados.
function obtenerPenultimo() {
  if (PLATFORM === 'youtube') {
    // YouTube Live chat - intentar varios selectores posibles
    let messages = document.querySelectorAll('div#content.style-scope.yt-live-chat-text-message-renderer');
    if (messages.length < 2) {
      // Intentar selector alternativo
      messages = document.querySelectorAll('yt-live-chat-text-message-renderer');
    }
    if (messages.length < 2) {
      console.log('[sheen-go youtube] no hay suficientes mensajes, encontrados:', messages.length);
      return null;
    }

    const penultimo = messages[messages.length - 2];
    console.log('[sheen-go youtube] penultimo elemento:', penultimo);

    const usernameElement = penultimo.querySelector('#author-name');
    const username = usernameElement ? usernameElement.textContent.trim() : null;
    console.log('[sheen-go youtube] username:', username);

    const messageElement = penultimo.querySelector('#message');
    let message = null;

    if (messageElement) {
      const clone = messageElement.cloneNode(true);
      clone.querySelectorAll('img').forEach(img => {
        const alt = img.getAttribute('alt') || '';
        img.replaceWith(alt);
      });
      message = clone.textContent.trim();
    }
    console.log('[sheen-go youtube] message:', message);

    // Usar timestamp como "index" para deduplicación
    return [username, message, Date.now()];
  }

  // TikTok: lógica original
  const contenedores = Array.from(document.querySelectorAll('[data-index]'));
  const ordenados    = contenedores.sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index)
  );
  const penultimo = ordenados[ordenados.length - 2];
  if (!penultimo) return null;

  const username   = penultimo.querySelector('[data-e2e="message-owner-name"]')
    ?.textContent.trim() || null;
  const comentario = penultimo.querySelector('div.w-full.break-words.align-middle.cursor-pointer')
    ?.textContent.trim() || null;

  return [username, comentario, Number(penultimo.dataset.index)];
}

function tickChat() {
  if (PLATFORM === 'youtube' && Math.random() < 0.05) {
    console.log('[sheen-go youtube] tickChat corriendo, URL:', window.location.href);
  }
  const result = obtenerPenultimo();
  if (!result) return;

  const [username, message, index] = result;
  // Ignorar si ya procesamos este índice o falta usuario/mensaje
  if (!username || !message || index <= lastSeenMsgIndex) return;
  lastSeenMsgIndex   = index;
  lastSenderUsername = username; // siempre actualizamos, incluso si es el propio usuario

  // No acumular mensajes propios en el contexto de Claude
  if (cfgMyUsername && username.toLowerCase() === cfgMyUsername.toLowerCase()) return;

  const msgs = userMessages.get(username) ?? [];
  msgs.push(message);

  if (msgs.length >= 50) {
    userMessages.delete(username); // llega a 50 → reset
  } else {
    userMessages.set(username, msgs);
  }
}

function startChatTracking() {
  if (chatPollInterval) return;
  chatPollInterval = setInterval(tickChat, 800);
}

function stopChatTracking() {
  if (chatPollInterval) { clearInterval(chatPollInterval); chatPollInterval = null; }
}

// ---------- Stop ----------

function stopAll() {
  running = false;
  if (burstTimeout)        { clearTimeout(burstTimeout);        burstTimeout        = null; }
  if (burstIntvl)          { clearInterval(burstIntvl);         burstIntvl          = null; }
  if (commentBurstTimeout) { clearTimeout(commentBurstTimeout); commentBurstTimeout = null; }
  if (claudeBurstTimeout)  { clearTimeout(claudeBurstTimeout);  claudeBurstTimeout  = null; }
  stopChatTracking();
}

// ---------- Message handler ----------

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start' && !running && !countTimer) {
    if (msg.config) {
      cfgLikesMin       = msg.config.likesMin;
      cfgLikesMax       = msg.config.likesMax;
      cfgPauseMin       = msg.config.pauseMin;
      cfgPauseMax       = msg.config.pauseMax;
      cfgLikesEnabled      = msg.config.likesEnabled    ?? true;
      cfgCommentsEnabled   = msg.config.commentsEnabled ?? true;
      cfgComments          = Array.isArray(msg.config.comments) ? msg.config.comments : [];
      cfgRepeatComments    = msg.config.repeatComments  ?? false;
      cfgCommentPauseMin   = msg.config.commentPauseMin ?? 10;
      cfgCommentPauseMax   = msg.config.commentPauseMax ?? 15;
      cfgAiEnabled         = msg.config.aiEnabled         ?? msg.config.claudeEnabled ?? false;
      cfgAiProvider        = msg.config.aiProvider        ?? 'anthropic';
      cfgApiKey            = msg.config.apiKey            ?? '';
      cfgAiPrompt          = msg.config.aiPrompt          ?? msg.config.claudePrompt ?? '';
      cfgAiPauseMin        = msg.config.aiPauseMin        ?? 20;
      cfgAiPauseMax        = msg.config.aiPauseMax        ?? 40;
      cfgMyUsername        = msg.config.myUsername        ?? '';
    }
    // BUG FIX: si es una reanudación tras recarga, continuar desde el índice guardado
    commentIndex = msg.resumeCommentIndex ?? 0;

    lastSeenMsgIndex = -1; // resetear para no re-procesar mensajes anteriores al arranque

    showOverlay(() => {
      running = true;

      if (cfgLikesEnabled) doBurst();

      // Solo trackear el chat si AI está activo
      if (cfgAiEnabled) startChatTracking();

      // Comentarios: desfase 2–5 s respecto a likes
      if (cfgCommentsEnabled && cfgComments.length > 0 &&
          (commentIndex < cfgComments.length || cfgRepeatComments)) {
        const offset = randInt(2000, 5000);
        commentBurstTimeout = setTimeout(doCommentBurst, offset);
      }

      // AI: desfase mayor (5–10 s) para no coincidir con todo lo anterior
      if (cfgAiEnabled && cfgApiKey) {
        const aiOffset = randInt(5000, 10000);
        claudeBurstTimeout = setTimeout(doAiBurst, aiOffset);
      }
    });
  }

  if (msg.action === 'stop') {
    removeOverlay();
    stopAll();
  }
});

// BUG FIX: avisar al background que este content script está listo.
// Si la página se recargó mientras la extensión corría, el background
// detecta el tab como activo y re-envía el start automáticamente.
chrome.runtime.sendMessage({ action: 'contentReady' }, () => {
  void chrome.runtime.lastError;
});
