# IPC Contracts

All IPC calls use `ipcRenderer.invoke` (async request/response).
Streaming events use `ipcRenderer.on` / `win.webContents.send`.

## Chat Channels

### `chat:send`
**Invoke** with `ChatPayload`:
```typescript
{ chatId: string | null, message: string, model: string, mode: 'local'|'web', searchQuery?: string }
```
Returns `{ success: boolean, error?: string }`

Emits streaming events:
- `chat:stream-chunk` → `{ chatId, content: string }`
- `chat:stream-done` → `{ chatId }`
- `chat:stream-error` → `{ chatId, error: string }`
- `chat:created` → `{ chat: Chat }` (on first message)

### `chat:list`
**Invoke** with optional `mode: 'local'|'web'`
Returns `{ success, data: Chat[] }`

### `chat:get-messages`
**Invoke** with `chatId: string`
Returns `{ success, data: Message[] }`

### `chat:delete`
**Invoke** with `chatId: string`
Returns `{ success }`

### `chat:rename`
**Invoke** with `(chatId: string, title: string)`
Returns `{ success }`

## Model Channels

### `models:list`
Returns `{ success, data: OllamaModel[] }`

### `models:pull`
**Invoke** with `name: string`
Emits `models:pull-progress` → `{ name, status, completed?, total? }`
Returns `{ success }`

### `models:delete`
**Invoke** with `name: string`
Returns `{ success }`

## System Channels

### `system:status`
Returns `{ success, data: { ollamaOnline: boolean } }`

### `system:get-settings`
Returns `{ success, data: AppSettings }`

### `system:save-settings`
**Invoke** with `Partial<AppSettings>`
Returns `{ success, data: AppSettings }`

### `system:searxng-search`
**Invoke** with `query: string`
Returns `{ success, data: SearchResult[] }`

### `system:open-external`
**Invoke** with `url: string`
Returns `{ success }`
