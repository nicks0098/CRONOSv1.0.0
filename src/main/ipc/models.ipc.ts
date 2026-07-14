import { ipcMain, BrowserWindow } from 'electron'
import { listLocalModels, deleteModel, pullModel } from '../services/ollama/ollamaModels'
import { toIpcError } from '../utils/errors'
import { logger } from '../utils/logger'

export function registerModelsIpc(win: BrowserWindow) {
  ipcMain.handle('models:list', async () => {
    try {
      const models = await listLocalModels()
      return { success: true, data: models }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('models:delete', async (_, name: string) => {
    try {
      await deleteModel(name)
      return { success: true }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('models:pull', async (_, name: string) => {
    try {
      for await (const progress of pullModel(name)) {
        win.webContents.send('models:pull-progress', {
          name,
          ...progress
        })
      }

      return { success: true }
    } catch (err) {
      logger.error('ModelsIPC', 'Pull error', err)

      win.webContents.send('models:pull-progress', {
        name,
        status: 'error',
        completed: 0,
        total: 0
      })

      return { success: false, error: toIpcError(err) }
    }
  })
}