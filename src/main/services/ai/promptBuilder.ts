// src/main/services/ai/promptBuilder.ts
import type { Message } from '../../types/db'
import type { OllamaMessage } from '../ollama/ollamaStream'

export function buildMessages(
  history: Message[],
  userMessage: string,
  searchContext?: string
): OllamaMessage[] {
  const msgs: OllamaMessage[] = history.map(m => ({
    role: m.role,
    content: m.content
  }))

  let content = userMessage
  if (searchContext) {
    content = `[Web Search Results]:\n${searchContext}\n\n[User Question]:\n${userMessage}\n\nPlease answer based on the search results above.`
  }

  msgs.push({ role: 'user', content })
  return msgs
}

export function extractTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/[^a-zA-Z0-9 ]/g, '').trim()
  return cleaned.slice(0, 50) || 'New Chat'
}