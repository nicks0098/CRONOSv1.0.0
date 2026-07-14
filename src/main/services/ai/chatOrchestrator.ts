import { BrowserWindow, net } from 'electron'
import { streamChat } from '../ollama/ollamaStream'
import { buildMessages, extractTitle } from './promptBuilder'
import { getPersona } from './cronosPersona'
import { resolveModel } from './modelRouter'
import { createChat, getChatById, touchChat } from '../db/chats.repo'
import { addMessage, getMessages } from '../db/messages.repo'
import { searxngSearch } from '../config/settings'
import type { ChatPayload } from '../../types/ai'
import { logger } from '../../utils/logger'
import { toIpcError } from '../../utils/errors'

type WebResult = {
  title: string
  url: string
  content: string
  engine?: string
}

function buildWebSearchReply(query: string, results: WebResult[]) {
  if (!results.length) {
    return [
      `No live web results found for: "${query}"`,
      '',
      'Check these things:',
      '- SearXNG is running',
      '- JSON format is enabled in settings.yml',
      '- Your instance has working search engines'
    ].join('\n')
  }

  const top = results.slice(0, 6)

  return [
    `Live web results for: "${query}"`,
    '',
    ...top.map((item, index) =>
      [
        `${index + 1}. ${item.title}`,
        `URL: ${item.url}`,
        item.content ? `Snippet: ${item.content}` : 'Snippet: No snippet available',
        item.engine ? `Engine: ${item.engine}` : null
      ]
        .filter(Boolean)
        .join('\n')
    )
  ].join('\n\n')
}

export async function orchestrateChat(payload: ChatPayload, win: BrowserWindow): Promise<void> {
  const { chatId, message, model, mode, searchQuery } = payload

  let chat = chatId ? getChatById(chatId) : null
  if (!chat) {
    const title = extractTitle(message)
    const resolvedModel = mode === 'web' ? 'searxng-live' : resolveModel(mode, model)
    chat = createChat(title, resolvedModel, mode)
    win.webContents.send('chat:created', { chat })
  }

  addMessage(chat.id, 'user', message)
  touchChat(chat.id)

  win.webContents.send('chat:stream-start', { chatId: chat.id })

    if (mode === 'web') {
    if (!net.isOnline()) {
      const offlineReply =
        'Web Live mode is unavailable because your internet is off.\n\n' +
        'Local mode should still work with your installed Ollama models.'

      win.webContents.send('chat:stream-chunk', {
        chatId: chat.id,
        content: offlineReply
      })

      addMessage(chat.id, 'assistant', offlineReply)
      touchChat(chat.id)

      win.webContents.send('chat:stream-done', {
        chatId: chat.id,
        content: offlineReply
      })

      return
    }

    try {
      const query = searchQuery?.trim() || message.trim()
      const results = await searxngSearch(query)
      const reply = buildWebSearchReply(query, results)

      win.webContents.send('chat:stream-chunk', {
        chatId: chat.id,
        content: reply
      })

      addMessage(chat.id, 'assistant', reply)
      touchChat(chat.id)

      win.webContents.send('chat:stream-done', {
        chatId: chat.id,
        content: reply
      })

      return
    } catch (err) {
      logger.error('Orchestrator', 'Web mode failed', err)

      const fallback = `Web search failed: ${toIpcError(err)}`

      win.webContents.send('chat:stream-chunk', {
        chatId: chat.id,
        content: fallback
      })

      addMessage(chat.id, 'assistant', fallback)
      touchChat(chat.id)

      win.webContents.send('chat:stream-error', {
        chatId: chat.id,
        error: toIpcError(err)
      })

      win.webContents.send('chat:stream-done', {
        chatId: chat.id,
        content: fallback
      })

      return
    }
  }

  const history = getMessages(chat.id).slice(-20)
  const messages = buildMessages(history.slice(0, -1), message)
  const system = getPersona(mode)
  const resolvedModel = resolveModel(mode, model)

  let fullResponse = ''

  try {
    for await (const chunk of streamChat(resolvedModel, messages, system)) {
      fullResponse += chunk
      win.webContents.send('chat:stream-chunk', {
        chatId: chat.id,
        content: chunk
      })
    }

    addMessage(chat.id, 'assistant', fullResponse || ' ')
    touchChat(chat.id)

    win.webContents.send('chat:stream-done', {
      chatId: chat.id,
      content: fullResponse
    })
  } catch (err) {
    logger.error('Orchestrator', 'Stream error', err)
    win.webContents.send('chat:stream-error', {
      chatId: chat.id,
      error: toIpcError(err)
    })
  }
}