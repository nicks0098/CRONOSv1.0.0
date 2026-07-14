import type { Chat, Message } from './db'
import type { OllamaModel } from './ai'

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ChatListResponse {
  chats: Chat[]
}

export interface MessagesResponse {
  messages: Message[]
}

export interface ModelsResponse {
  models: OllamaModel[]
}

export type IpcChannel =
  | 'chat:send'
  | 'chat:stream-chunk'
  | 'chat:stream-done'
  | 'chat:stream-error'
  | 'chat:list'
  | 'chat:get-messages'
  | 'chat:create'
  | 'chat:delete'
  | 'chat:rename'
  | 'models:list'
  | 'models:pull'
  | 'models:pull-progress'
  | 'models:delete'
  | 'system:status'
  | 'system:get-settings'
  | 'system:save-settings'
  | 'system:searxng-search'
  | 'system:open-external'
