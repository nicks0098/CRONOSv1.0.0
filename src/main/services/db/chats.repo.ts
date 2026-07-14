import { v4 as uuidv4 } from 'uuid'
import { getDb } from './sqlite'
import type { Chat } from '../../types/db'

export function createChat(title: string, model: string, mode: 'local' | 'web' = 'local'): Chat {
  const db = getDb()
  const chat: Chat = {
    id: uuidv4(),
    title,
    mode,
    model,
    created_at: Date.now(),
    updated_at: Date.now()
  }
  db.prepare(`INSERT INTO chats (id, title, mode, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    chat.id, chat.title, chat.mode, chat.model, chat.created_at, chat.updated_at
  )
  return chat
}

export function listChats(mode?: 'local' | 'web'): Chat[] {
  const db = getDb()
  if (mode) {
    return db.prepare(`SELECT * FROM chats WHERE mode = ? ORDER BY updated_at DESC`).all(mode) as Chat[]
  }
  return db.prepare(`SELECT * FROM chats ORDER BY updated_at DESC`).all() as Chat[]
}

export function getChatById(id: string): Chat | undefined {
  const db = getDb()
  return db.prepare(`SELECT * FROM chats WHERE id = ?`).get(id) as Chat | undefined
}

export function updateChatTitle(id: string, title: string) {
  const db = getDb()
  db.prepare(`UPDATE chats SET title = ?, updated_at = ? WHERE id = ?`).run(title, Date.now(), id)
}

export function touchChat(id: string) {
  const db = getDb()
  db.prepare(`UPDATE chats SET updated_at = ? WHERE id = ?`).run(Date.now(), id)
}

export function deleteChat(id: string) {
  const db = getDb()
  db.prepare(`DELETE FROM chats WHERE id = ?`).run(id)
}
