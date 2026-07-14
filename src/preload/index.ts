// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const listeners = new Map<(...args: unknown[]) => void, (...args: unknown[]) => void>()

const cronosAPI = {
  sendMessage: (payload: unknown) => ipcRenderer.invoke('chat:send', payload),
  listChats: (mode?: string) => ipcRenderer.invoke('chat:list', mode),
  getMessages: (chatId: string) => ipcRenderer.invoke('chat:get-messages', chatId),
  createChat: (title: string, model: string, mode: 'local' | 'web') =>
    ipcRenderer.invoke('chat:create', title, model, mode),
  deleteChat: (chatId: string) => ipcRenderer.invoke('chat:delete', chatId),
  renameChat: (chatId: string, title: string) => ipcRenderer.invoke('chat:rename', chatId, title),
  listModels: () => ipcRenderer.invoke('models:list'),
  pullModel: (name: string) => ipcRenderer.invoke('models:pull', name),
  deleteModel: (name: string) => ipcRenderer.invoke('models:delete', name),
  getStatus: () => ipcRenderer.invoke('system:status'),
  ensureOllama: () => ipcRenderer.invoke('system:ensure-ollama'),
  getSettings: () => ipcRenderer.invoke('system:get-settings'),
  testSearxng: (url: string) => ipcRenderer.invoke('system:test-searxng', url),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('system:save-settings', settings),
  searxngSearch: (query: string) => ipcRenderer.invoke('system:searxng-search', query),
  openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),

  // Web Live Advanced
  dockerStatus: () => ipcRenderer.invoke('web-live:docker-status'),
  startDockerHelp: () => ipcRenderer.invoke('web-live:start-docker-help'),
  openDockerSettings: () => ipcRenderer.invoke('web-live:open-docker-settings'),
  startSearxngSetup: () => ipcRenderer.invoke('web-live:start-searxng-setup'),
  testWebLive: () => ipcRenderer.invoke('web-live:test-connection'),

  on: (channel: string, cb: (...args: unknown[]) => void) => {
    const wrapped = (_event: unknown, ...args: unknown[]) => cb(...args)
    listeners.set(cb, wrapped)
    ipcRenderer.on(channel, wrapped)
  },
  off: (channel: string, cb: (...args: unknown[]) => void) => {
    const wrapped = listeners.get(cb)
    if (wrapped) {
      ipcRenderer.off(channel, wrapped)
      listeners.delete(cb)
    }
  },
  once: (channel: string, cb: (...args: unknown[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => cb(...args))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('cronos', cronosAPI)
  } catch (err) {
    console.error(err)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.cronos = cronosAPI
}