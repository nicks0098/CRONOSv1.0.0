import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { logger } from '../../utils/logger'

export type AppSettings = {
  localModel: string
  webModel: string
  sendWithEnter: boolean
  ollamaBaseUrl: string
  searxngBaseUrl: string
}

export type SearxngResult = {
  title: string
  url: string
  content: string
  engine?: string
}

const defaultSettings: AppSettings = {
  localModel: 'llama3.2:1b',
  webModel: 'llama3.2:1b',
  sendWithEnter: true,
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  searxngBaseUrl: 'http://127.0.0.1:8080'
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function ensureSettingsFile() {
  const filePath = getSettingsPath()
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), 'utf-8')
  }

  return filePath
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const filePath = ensureSettingsFile()
    const raw = await fs.promises.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>

    return {
      ...defaultSettings,
      ...parsed
    }
  } catch (err) {
    logger.warn('Settings', 'Failed to load settings, using defaults', err)
    return { ...defaultSettings }
  }
}

export async function saveSettings(next: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings()
  const merged: AppSettings = {
    ...current,
    ...next
  }

  const filePath = ensureSettingsFile()
  await fs.promises.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

type SearxngApiResult = {
  title?: string
  url?: string
  content?: string
  engine?: string
}

type SearxngApiResponse = {
  results?: SearxngApiResult[]
}

export async function searxngSearch(query: string): Promise<SearxngResult[]> {
  const settings = await getSettings()
  const baseUrl = (settings.searxngBaseUrl || defaultSettings.searxngBaseUrl).replace(/\/+$/, '')

  const url = new URL(`${baseUrl}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('language', 'en')
  url.searchParams.set('safesearch', '0')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`SearXNG request failed: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      'SearXNG did not return JSON. Enable json in SearXNG settings.yml under search.formats.'
    )
  }

  const data = (await res.json()) as SearxngApiResponse

  return (data.results || [])
    .filter(item => item.title && item.url)
    .map(item => ({
      title: item.title || 'Untitled',
      url: item.url || '',
      content: item.content || '',
      engine: item.engine
    }))
}

export async function testSearxngConnection() {
  const settings = await getSettings()
  const baseUrl = (settings.searxngBaseUrl || defaultSettings.searxngBaseUrl).replace(/\/+$/, '')

  const url = new URL(`${baseUrl}/search`)
  url.searchParams.set('q', 'cronos test')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`SearXNG connection failed: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Connected, but SearXNG JSON API is disabled. Add json to search.formats in settings.yml.'
    )
  }

  return {
    ok: true,
    baseUrl
  }
}