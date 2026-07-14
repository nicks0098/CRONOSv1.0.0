export interface OllamaModel {
  name: string
  size: number
  modified_at: string
  digest: string
}

export interface ChatPayload {
  chatId: string | null
  message: string
  model: string
  mode: 'local' | 'web'
  searchQuery?: string
}

export interface StreamChunk {
  content: string
  done: boolean
  error?: string
}

export interface ModelInfo {
  name: string
  displayName: string
  size: string
  available: boolean
}