import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import { addPendingUserMessage, clearPendingUserMessage } from '../store/chatStore'
import type { AppMode } from '../types/ui'

export function useChat(mode: AppMode, model: string) {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (message: string, chatId: string | null, searchQuery?: string) => {
      if (!message.trim()) return
      if (mode === 'local' && !model) {
        setError('Please select a model first')
        return
      }

      addPendingUserMessage(mode, message, chatId)
      setIsSending(true)
      setError(null)

      try {
        const res = await api.sendMessage({
          chatId,
          message,
          model,
          mode,
          searchQuery
        })

        if (!res.success) {
          clearPendingUserMessage(mode)
          setError(res.error || 'Unknown error')
        }
      } catch (err) {
        clearPendingUserMessage(mode)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsSending(false)
      }
    },
    [mode, model]
  )

  return { send, isSending, error }
}