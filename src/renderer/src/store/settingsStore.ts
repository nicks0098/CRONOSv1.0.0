import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export type AppSettings = {
  localModel: string
  webModel: string
  sendWithEnter: boolean
  ollamaBaseUrl: string
  searxngBaseUrl: string
}

let settingsState: AppSettings = {
  localModel: 'llama3.2:1b',
  webModel: 'llama3.2:1b',
  sendWithEnter: true,
  ollamaBaseUrl: 'http://127.0.0.1:11434',
  searxngBaseUrl: 'http://127.0.0.1:8080'
}

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(listener => listener())
}

async function loadSettings() {
  const res = await api.getSettings()
  if (res.success && res.data) {
    settingsState = {
      ...settingsState,
      ...res.data
    }
    notify()
  }
}

export async function persistSettings(next: Partial<AppSettings>) {
  const res = await api.saveSettings(next)
  if (res.success && res.data) {
    settingsState = {
      ...settingsState,
      ...res.data
    }
    notify()
  }
  return res
}

export function useSettingsStore() {
  const [settings, setSettings] = useState(settingsState)

  useEffect(() => {
    const listener = () => setSettings({ ...settingsState })
    listeners.add(listener)
    loadSettings()
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { settings }
}