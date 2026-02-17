# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chrome extension (Manifest V3) called **Sheen Go**. Simulates holding the `L` key on TikTok Live pages to send automatic likes. Made by @cisnerosnow.

No build step, no package manager, no bundler. Files are loaded directly by Chrome.

## Loading / reloading the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. After any file change: click the reload icon on the extension card

There are no tests or linters configured.

## Architecture

The extension has three execution contexts that communicate via `chrome.runtime.sendMessage`:

```
popup.js  ──→  background.js  ──→  content.js
   (UI)        (state manager)     (page actor)
```

**`background.js` (service worker)**
- Single source of truth for which tabs are active (`Set<tabId>`)
- Persists state to `chrome.storage.session` so it survives service worker idle restarts
- Relays `start`/`stop` messages to the correct tab's content script
- Cleans up state on `chrome.tabs.onRemoved`

**`popup.js`**
- On open, queries background for the current tab's state (`getState`) to restore UI correctly
- Never talks directly to `content.js` — always goes through `background.js`
- State is per-tab: `currentTabId` is resolved once on `init()`

**`content.js`** (injected only on `tiktok.com`)
- Owns two module-level variables: `interval` (key repeat) and `countTimer` (countdown)
- On `start`: shows a 5-second fullscreen overlay, then starts `setInterval(pressL, 100)`
- On `stop`: clears both timers and removes the overlay
- Uses `chrome.runtime.getURL('logo.png')` for the overlay image — this requires `logo.png` to be declared in `web_accessible_resources` in `manifest.json`

## Key constraint

`logo.png` must exist in the project root. It is used as:
- Extension icon (all sizes 16/48/128 point to the same file)
- Image in the popup panel
- Image in the fullscreen countdown overlay (loaded via `chrome.runtime.getURL`)

If `logo.png` is missing, the extension will load but icons and overlay image will be broken.
