// src/main/ipc/system.ipc.ts
import { ipcMain, shell, net } from 'electron'
import Store from 'electron-store'
import { toIpcError } from '../utils/errors'
import { logger } from '../utils/logger'

type AppSettings = {
  searxngBaseUrl?: string
  [key: string]: unknown
}

const store = new Store<AppSettings>({
  name: 'settings'
})

async function testSearxngUrl(url?: string) {
  const rawUrl =
    typeof url === 'string' && url.trim()
      ? url.trim()
      : String(store.get('searxngBaseUrl', 'http://localhost:8888'))

  const cleanUrl = rawUrl.replace(/\/$/, '')
  const target = `${cleanUrl}/search?q=hello&format=json`

  return await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const request = net.request(target)

    request.on('response', (response) => {
      if (response.statusCode === 200) {
        resolve({ success: true })
      } else {
        resolve({
          success: false,
          error: `SearXNG responded with status ${response.statusCode}.`
        })
      }
    })

    request.on('error', (error) => {
      resolve({
        success: false,
        error: `Could not reach SearXNG: ${error.message}`
      })
    })

    request.end()
  })
}

export function registerSystemIpc() {
  ipcMain.handle('system:status', async () => {
    try {
      return {
        success: true,
        data: {
          ok: true,
          searxngBaseUrl: store.get('searxngBaseUrl', 'http://localhost:8888')
        }
      }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:ensure-ollama', async () => {
    try {
      return { success: true }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:get-settings', async () => {
    try {
      return {
        success: true,
        data: store.store
      }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:save-settings', async (_event, settings: Partial<AppSettings>) => {
    try {
      store.set(settings)
      return {
        success: true,
        data: store.store
      }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:searxng-search', async (_event, query: string) => {
    try {
      const baseUrl = String(store.get('searxngBaseUrl', 'http://localhost:8888'))
      const cleanUrl = baseUrl.replace(/\/$/, '')
      const target = `${cleanUrl}/search?q=${encodeURIComponent(query)}&format=json`

      const result = await new Promise<{ success: boolean; data?: unknown; error?: string }>((resolve) => {
        const request = net.request(target)
        let body = ''

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            body += chunk.toString()
          })

          response.on('end', () => {
            if (response.statusCode !== 200) {
              resolve({
                success: false,
                error: `SearXNG responded with status ${response.statusCode}.`
              })
              return
            }

            try {
              resolve({ success: true, data: JSON.parse(body) })
            } catch {
              resolve({ success: false, error: 'SearXNG returned invalid JSON.' })
            }
          })
        })

        request.on('error', (error) => {
          resolve({ success: false, error: `Could not reach SearXNG: ${error.message}` })
        })

        request.end()
      })

      return result
    } catch (err) {
      logger.error('SystemIPC', 'SearXNG search error', err)
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:test-searxng', async (_event, url?: string) => {
    try {
      return await testSearxngUrl(url)
    } catch (err) {
      logger.error('SystemIPC', 'SearXNG test error', err)
      return { success: false, error: toIpcError(err) }
    }
  })

  ipcMain.handle('system:open-external', async (_event, url: string) => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: toIpcError(err) }
    }
  })
}