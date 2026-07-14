// src/renderer/src/types/ui.ts
export type AppMode = 'local' | 'web'

export interface UIChat {
  id: string
  title: string
  mode: AppMode
  model: string
  created_at: number
  updated_at: number
}

export interface UIMessage {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: number
  tokens?: number
  streaming?: boolean
  pending?: boolean
  error?: boolean
}

export interface UIModel {
  name: string
  size?: number
  modified_at?: string
  digest?: string
}

export interface AppSettings {
  localModel: string
  webModel: string
  ollamaHost: string
  searxngHost: string
  theme: 'dark' | 'light' | 'system'
  fontSize: number
  sendWithEnter: boolean
}