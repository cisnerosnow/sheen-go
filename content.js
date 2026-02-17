let interval     = null;
let countTimer   = null;

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

// ---------- Key simulation ----------

function pressL() {
  const target = document.activeElement || document.body;

  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    target.dispatchEvent(new KeyboardEvent(type, {
      key: 'l', code: 'KeyL', keyCode: 76, which: 76,
      bubbles: true, cancelable: true,
    }));
  });
}

// ---------- Message handler ----------

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start' && !interval && !countTimer) {
    showOverlay(() => {
      pressL();
      interval = setInterval(pressL, 100);
    });
  }

  if (msg.action === 'stop') {
    removeOverlay();
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
});
