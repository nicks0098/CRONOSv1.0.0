// src/renderer/src/types/global.d.ts
import type { ElectronAPI } from '@electron-toolkit/preload'

type ChatMode = 'local' | 'web'

type WebLiveStatus = {
  dockerInstalled: boolean
  dockerRunning: boolean
  searxngRunning: boolean
  webLiveConnected: boolean
  message?: string
}

type CronosAPI = {
  sendMessage: (payload: {
    chatId: string | null
    message: string
    model: string
    mode: ChatMode
    searchQuery?: string
  }) => Promise<unknown>
  listChats: (mode?: string) => Promise<unknown>
  getMessages: (chatId: string) => Promise<unknown>
  createChat: (title: string, model: string, mode: ChatMode) => Promise<unknown>
  deleteChat: (chatId: string) => Promise<unknown>
  renameChat: (chatId: string, title: string) => Promise<unknown>
  listModels: () => Promise<unknown>
  pullModel: (name: string) => Promise<unknown>
  deleteModel: (name: string) => Promise<unknown>
  getStatus: () => Promise<unknown>
  ensureOllama: () => Promise<unknown>
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<unknown>
  searxngSearch: (query: string) => Promise<unknown>
  testSearxng: (url: string) => Promise<unknown>
  openExternal: (url: string) => Promise<unknown>
  dockerStatus: () => Promise<{ success: boolean; data?: WebLiveStatus }>
  startDockerHelp: () => Promise<{ success: boolean }>
  openDockerSettings: () => Promise<{ success: boolean }>
  startSearxngSetup: () => Promise<{ success: boolean }>
  testWebLive: () => Promise<{
    success: boolean
    data?: {
      connected: boolean
      status?: WebLiveStatus
    }
  }>
  on: (channel: string, cb: (...args: unknown[]) => void) => void
  off: (channel: string, cb: (...args: unknown[]) => void) => void
  once: (channel: string, cb: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    cronos: CronosAPI
  }
}

export {}