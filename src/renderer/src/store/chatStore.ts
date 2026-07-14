import { useState, useEffect, useCallback } from 'react'
import type { UIChat, UIMessage, AppMode } from '../types/ui'

const chatsByMode: Record<AppMode, UIChat[]> = { local: [], web: [] }
const activeChatByMode: Record<AppMode, string | null> = { local: null, web: null }
const messagesByMode: Record<AppMode, UIMessage[]> = { local: [], web: [] }
const pendingByMode: Record<AppMode, UIMessage | null> = { local: null, web: null }
const streamingByMode: Record<AppMode, string> = { local: '', web: '' }
const isStreamingByMode: Record<AppMode, boolean> = { local: false, web: false }
const listenersByMode: Record<AppMode, Set<() => void>> = { local: new Set(), web: new Set() }

let ipcBound = false

function notify(mode: AppMode) {
  listenersByMode[mode].forEach(fn => fn())
}

function inferModeFromChatId(chatId: string): AppMode | null {
  for (const mode of ['local', 'web'] as AppMode[]) {
    if (activeChatByMode[mode] === chatId) return mode
    if (chatsByMode[mode].some(chat => chat.id === chatId)) return mode
    if (pendingByMode[mode]?.chat_id === chatId) return mode
  }
  return null
}

async function refreshMessages(mode: AppMode, chatId: string) {
  const res = await window.cronos.getMessages(chatId)
  if (res.success) {
    messagesByMode[mode] = (res.data as UIMessage[]) || []
    notify(mode)
  }
}

function bindIpcEvents() {
  if (ipcBound) return
  ipcBound = true

  window.cronos.on('chat:created', async ({ chat }: { chat: UIChat }) => {
    const mode = (chat.mode as AppMode) || 'local'

    const existing = chatsByMode[mode].some(item => item.id === chat.id)
    if (!existing) {
      chatsByMode[mode] = [chat, ...chatsByMode[mode]]
    }

    activeChatByMode[mode] = chat.id

    if (pendingByMode[mode]) {
      pendingByMode[mode] = {
        ...pendingByMode[mode]!,
        chat_id: chat.id
      }
    }

    await refreshMessages(mode, chat.id)
    notify(mode)
  })

  window.cronos.on('chat:stream-start', ({ chatId }: { chatId: string }) => {
    const mode = inferModeFromChatId(chatId)
    if (!mode) return

    activeChatByMode[mode] = chatId
    isStreamingByMode[mode] = true
    streamingByMode[mode] = ''
    notify(mode)
  })

  window.cronos.on('chat:stream-chunk', ({ chatId, content }: { chatId: string; content: string }) => {
    const mode = inferModeFromChatId(chatId)
    if (!mode) return

    activeChatByMode[mode] = chatId
    isStreamingByMode[mode] = true
    streamingByMode[mode] += content
    notify(mode)
  })

  window.cronos.on('chat:stream-done', async ({ chatId }: { chatId: string; content: string }) => {
    const mode = inferModeFromChatId(chatId)
    if (!mode) return

    activeChatByMode[mode] = chatId
    isStreamingByMode[mode] = false
    streamingByMode[mode] = ''
    pendingByMode[mode] = null

    await loadChats(mode)
    await refreshMessages(mode, chatId)
    notify(mode)
  })

  window.cronos.on('chat:stream-error', ({ chatId }: { chatId: string; error?: string }) => {
    const mode = inferModeFromChatId(chatId)
    if (!mode) return

    activeChatByMode[mode] = chatId
    isStreamingByMode[mode] = false
    streamingByMode[mode] = ''
    pendingByMode[mode] = null
    notify(mode)
  })
}

export async function loadChats(mode: AppMode) {
  const res = await window.cronos.listChats(mode)
  if (res.success) {
    chatsByMode[mode] = (res.data as UIChat[]) || []
    notify(mode)
  }
}

export function addPendingUserMessage(mode: AppMode, content: string, chatId?: string | null) {
  pendingByMode[mode] = {
    id: `pending-user-${Date.now()}`,
    chat_id: chatId || activeChatByMode[mode] || 'pending',
    role: 'user',
    content,
    created_at: Date.now(),
    pending: true
  }
  notify(mode)
}

export function clearPendingUserMessage(mode: AppMode) {
  pendingByMode[mode] = null
  notify(mode)
}

export function useChatStore(mode: AppMode) {
  const [chats, setChats] = useState<UIChat[]>(chatsByMode[mode])
  const [activeChatId, setActiveChatId] = useState<string | null>(activeChatByMode[mode])
  const [messages, setMessages] = useState<UIMessage[]>([
    ...messagesByMode[mode],
    ...(pendingByMode[mode] ? [pendingByMode[mode]!] : [])
  ])
  const [streamingContent, setStreamingContentState] = useState(streamingByMode[mode])
  const [isStreaming, setIsStreamingState] = useState(isStreamingByMode[mode])

  useEffect(() => {
    bindIpcEvents()

    loadChats(mode).then(() => setChats([...chatsByMode[mode]]))

    const listener = () => {
      setChats([...chatsByMode[mode]])
      setActiveChatId(activeChatByMode[mode])
      setMessages([
        ...messagesByMode[mode],
        ...(pendingByMode[mode] ? [pendingByMode[mode]!] : [])
      ])
      setStreamingContentState(streamingByMode[mode])
      setIsStreamingState(isStreamingByMode[mode])
    }

    listenersByMode[mode].add(listener)
    listener()

    return () => {
      listenersByMode[mode].delete(listener)
    }
  }, [mode])

  const selectChat = useCallback(
    async (chatId: string) => {
      activeChatByMode[mode] = chatId
      setActiveChatId(chatId)
      pendingByMode[mode] = null
      streamingByMode[mode] = ''
      isStreamingByMode[mode] = false

      const res = await window.cronos.getMessages(chatId)
      if (res.success) {
        messagesByMode[mode] = (res.data as UIMessage[]) || []
        setMessages(messagesByMode[mode])
      }
    },
    [mode]
  )

  const deleteChat = useCallback(
    async (chatId: string) => {
      await window.cronos.deleteChat(chatId)

      chatsByMode[mode] = chatsByMode[mode].filter(chat => chat.id !== chatId)

      if (activeChatByMode[mode] === chatId) {
        activeChatByMode[mode] = null
        messagesByMode[mode] = []
        pendingByMode[mode] = null
        streamingByMode[mode] = ''
        isStreamingByMode[mode] = false
        setActiveChatId(null)
        setMessages([])
        setStreamingContentState('')
        setIsStreamingState(false)
      }

      await loadChats(mode)
    },
    [mode]
  )

  const renameChat = useCallback(
    async (chatId: string, title: string) => {
      await window.cronos.renameChat(chatId, title)
      await loadChats(mode)
    },
    [mode]
  )

  const newChat = useCallback(
    async () => {
      pendingByMode[mode] = null
      streamingByMode[mode] = ''
      isStreamingByMode[mode] = false
      messagesByMode[mode] = []

      const res = await window.cronos.createChat(
        mode === 'web' ? 'Web Session' : 'New Chat',
        '',
        mode
      )

      if (res.success && res.data) {
        const chat = res.data as UIChat
        activeChatByMode[mode] = chat.id
        setActiveChatId(chat.id)

        await loadChats(mode)
        await refreshMessages(mode, chat.id)
      } else {
        activeChatByMode[mode] = null
        setActiveChatId(null)
        setMessages([])
      }
    },
    [mode]
  )

  return {
    chats,
    activeChatId,
    messages,
    streamingContent,
    isStreaming,
    setStreamingContent: setStreamingContentState,
    setIsStreaming: setIsStreamingState,
    selectChat,
    deleteChat,
    renameChat,
    newChat,
    setMessages
  }
}