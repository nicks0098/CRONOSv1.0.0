export interface Chat {
  id: string
  title: string
  mode: 'local' | 'web'
  model: string
  created_at: number
  updated_at: number
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens?: number
  created_at: number
}

export interface Memory {
  id: string
  mode: 'local' | 'web'
  content: string
  created_at: number
}
