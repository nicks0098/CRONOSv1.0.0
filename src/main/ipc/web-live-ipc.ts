// src/main/ipc/web-live-ipc.ts
import { ipcMain, shell, BrowserWindow } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const SEARXNG_CONTAINER_NAMES = ['searxng', 'cronos-searxng']
const SEARXNG_URL = 'http://localhost:8888'

type WebLiveStatus = {
  dockerInstalled: boolean
  dockerRunning: boolean
  searxngRunning: boolean
  webLiveConnected: boolean
  message?: string
}

async function commandExists(command: string) {
  try {
    await execFileAsync(command, ['--version'])
    return true
  } catch {
    return false
  }
}

async function getDockerInfo(): Promise<WebLiveStatus> {
  const installed = await commandExists('docker')

  if (!installed) {
    return {
      dockerInstalled: false,
      dockerRunning: false,
      searxngRunning: false,
      webLiveConnected: false,
      message: 'Docker Desktop is not installed.'
    }
  }

  try {
    await execFileAsync('docker', ['info'])
  } catch {
    return {
      dockerInstalled: true,
      dockerRunning: false,
      searxngRunning: false,
      webLiveConnected: false,
      message: 'Docker Desktop is installed but not running.'
    }
  }

  return {
    dockerInstalled: true,
    dockerRunning: true,
    searxngRunning: false,
    webLiveConnected: false,
    message: 'Docker Desktop is running.'
  }
}

async function isSearxngRunning(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('docker', ['ps', '--format', '{{.Names}}'])
    const names = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    return names.some((name) => SEARXNG_CONTAINER_NAMES.includes(name))
  } catch {
    return false
  }
}

async function canReachWebLive(): Promise<boolean> {
  try {
    const response = await fetch(`${SEARXNG_URL}/search?q=hello&format=json`)
    return response.ok
  } catch {
    return false
  }
}

async function dockerStatus() {
  const base = await getDockerInfo()

  if (!base.dockerInstalled || !base.dockerRunning) {
    return { success: true, data: base }
  }

  const searxngRunning = await isSearxngRunning()
  const webLiveConnected = searxngRunning ? await canReachWebLive() : false

  const data: WebLiveStatus = {
    ...base,
    searxngRunning,
    webLiveConnected,
    message: !searxngRunning
      ? 'SearXNG is not running yet.'
      : webLiveConnected
        ? 'Web Live is ready.'
        : 'SearXNG is running, but the local endpoint did not respond.'
  }

  return { success: true, data }
}

export function registerWebLiveIpc(win: BrowserWindow) {
  ipcMain.handle('web-live:docker-status', async () => {
    return dockerStatus()
  })

  ipcMain.handle('web-live:start-docker-help', async () => {
    await shell.openExternal('https://www.docker.com/products/docker-desktop/')
    return { success: true }
  })

  ipcMain.handle('web-live:open-docker-settings', async () => {
    win.webContents.send('web-live:open-settings-guide', {
      title: 'Docker settings',
      steps: [
        'Open Docker Desktop.',
        'Go to Settings > General.',
        'Turn on Automatically start Docker Desktop when you sign in to your machine.',
        'Turn off Automatically open the dashboard when starting Docker Desktop.'
      ]
    })
    return { success: true }
  })

  ipcMain.handle('web-live:start-searxng-setup', async () => {
    win.webContents.send('web-live:setup-searxng', {
      message: 'Start your Docker-based SearXNG setup flow here.'
    })
    return { success: true }
  })

  ipcMain.handle('web-live:test-connection', async () => {
    const status = await dockerStatus()
    return {
      success: true,
      data: {
        connected: !!status.data?.webLiveConnected,
        status: status.data
      }
    }
  })
}