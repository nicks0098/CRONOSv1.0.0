// src/main/index.ts
import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/mainWindow'
import { registerChatIpc } from './ipc/chat.ipc'
import { registerModelsIpc } from './ipc/models.ipc'
import { registerSystemIpc } from './ipc/system.ipc'
import { closeDb } from './services/db/sqlite'
import { ensureOllamaRunning } from './services/ollama/ollamaLauncher'
import { logger } from './utils/logger'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.cronos.ai')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await ensureOllamaRunning()

  const win = createMainWindow()
  registerChatIpc(win)
  registerModelsIpc(win)
  registerSystemIpc()

  logger.info('Main', 'CRONOS AI started')

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await ensureOllamaRunning()
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDb()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDb()
})