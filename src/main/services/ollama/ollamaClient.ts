import { getSettings } from '../config/settings'
import { OllamaError } from '../../utils/errors'

export function getOllamaHost(): string {
  const settingsHost = getSettings().ollamaHost?.trim()
  const envHost = process.env.OLLAMA_HOST?.trim()
  return settingsHost || envHost || 'http://127.0.0.1:11434'
}

export async function ollamaFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getOllamaHost()
  const url = `${baseUrl}${endpoint}`

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })

    if (!res.ok) {
      const text = await res.text()
      throw new OllamaError(`Ollama responded ${res.status}: ${text}`)
    }

    return res
  } catch (err) {
    if (err instanceof OllamaError) throw err
    throw new OllamaError(`Cannot reach Ollama at ${baseUrl}`, err)
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getOllamaHost()}/api/tags`)
    return res.ok
  } catch {
    return false
  }
}