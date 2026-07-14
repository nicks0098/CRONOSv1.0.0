# CRONOS AI Architecture

## Overview

CRONOS AI is a local-first desktop AI assistant built with Electron, React, and Ollama.

## Process Architecture

### Main Process (`src/main/`)
- **index.ts** – App bootstrap, registers IPC handlers, creates window
- **windows/mainWindow.ts** – BrowserWindow factory with security config
- **ipc/** – IPC handler registration (chat, models, system)
- **services/** – Core business logic (Ollama, AI orchestration, SQLite, SearXNG)

### Preload Process (`src/preload/index.ts`)
- Exposes `window.cronos` API via `contextBridge`
- Wraps `ipcRenderer.invoke` for all channels
- Bridges event listeners for streaming

### Renderer Process (`src/renderer/`)
- React 18 with TypeScript
- No build-time state management library (uses custom hooks + closures)
- Glassmorphism UI with CSS variables for dual-mode theming

## Two Modes

| | Local Mode | Web Live Mode |
|---|---|---|
| Background | Dark green gradient | Dark blue gradient |
| Accent | `#00c864` | `#3d8bff` |
| AI Backend | Ollama (offline) | Ollama + SearXNG |
| Memory | Local SQLite | Separate SQLite rows |
| Conversations | mode=local | mode=web |

## Data Flow

```
User input → Composer → useChat hook → window.cronos.sendMessage()
→ IPC (chat:send) → chatOrchestrator → streamChat (Ollama)
→ win.webContents.send('chat:stream-chunk') → Renderer event listener
→ ChatWindow streaming display
```

## Database

SQLite via `better-sqlite3` at `userData/cronos.db`.

Tables: `chats`, `messages`, `memories`

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: false` (required for preload)
- CSP header in index.html
- External URLs opened via `shell.openExternal`
