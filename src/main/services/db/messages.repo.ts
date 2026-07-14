// src/main/services/db/messages.repo.ts
import { v4 as uuidv4 } from 'uuid'
import { getDb } from './sqlite'
import type { Message } from '../../types/db'

export function addMessage(chatId: string, role: Message['role'], content: string, tokens?: number): Message {
  const db = getDb()
  const msg: Message = {
    id: uuidv4(),
    chat_id: chatId,
    role,
    content,
    tokens,
    created_at: Date.now()
  }
  db.prepare(
    `INSERT INTO messages (id, chat_id, role, content, tokens, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(msg.id, msg.chat_id, msg.role, msg.content, msg.tokens ?? null, msg.created_at)
  return msg
}

export function getMessages(chatId: string): Message[] {
  const db = getDb()
  return db
    .prepare(`SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC`)
    .all(chatId) as Message[]
}

export function deleteMessages(chatId: string) {
  const db = getDb()
  db.prepare(`DELETE FROM messages WHERE chat_id = ?`).run(chatId)
}