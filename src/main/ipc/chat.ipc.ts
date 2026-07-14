import { ipcMain, BrowserWindow } from 'electron'
import { orchestrateChat } from '../services/ai/chatOrchestrator'
import { listChats, deleteChat, updateChatTitle, createChat } from '../services/db/chats.repo'
import { getMessages } from '../services/db/messages.repo'
import { toIpcError } from '../utils/errors'
import { logger } from '../utils/logger'

export function registerChatIpc(win: BrowserWindow) {
  ipcMain.handle('chat:send', async (_, payload) => {
    try {
      await orchestrateChat(payload, win)
      return { success: true }
    } catch (err) {
      logger.error('ChatIPC', 'Send error', err)
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('chat:create', async (_, title: string, model: string, mode: 'local' | 'web') => {
    try {
      const chat = createChat(title, model, mode)
      return { success: true, data: chat }
    } catch (err) {
      logger.error('ChatIPC', 'Create error', err)
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('chat:list', async (_, mode?: string) => {
    try {
      const chats = listChats(mode as 'local' | 'web' | undefined)
      return { success: true, data: chats }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('chat:get-messages', async (_, chatId: string) => {
    try {
      const messages = getMessages(chatId)
      return { success: true, data: messages }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('chat:delete', async (_, chatId: string) => {
    try {
      deleteChat(chatId)
      return { success: true }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('chat:rename', async (_, chatId: string, title: string) => {
    try {
      updateChatTitle(chatId, title)
      return { success: true }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })
}