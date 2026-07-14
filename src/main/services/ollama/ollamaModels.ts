type OllamaModelDetails = {
  parent_model?: string
  format?: string
  family?: string
  families?: string[]
  parameter_size?: string
  quantization_level?: string
}

export type OllamaModel = {
  name: string
  model?: string
  modified_at?: string
  size?: number
  digest?: string
  details?: OllamaModelDetails
}

type OllamaTagsResponse = {
  models?: OllamaModel[]
}

export type OllamaOperationResponse = {
  status?: string
  error?: string
  digest?: string
  total?: number
  completed?: number
}

const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'

function normalizeBaseUrl(baseUrl = DEFAULT_OLLAMA_BASE_URL) {
  return baseUrl.replace(/\/+$/, '')
}

function buildUrl(path: string, baseUrl = DEFAULT_OLLAMA_BASE_URL) {
  return `${normalizeBaseUrl(baseUrl)}${path}`
}

async function safeJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await res.text()
    throw new Error(`Expected JSON response, got: ${text.slice(0, 200)}`)
  }

  return (await res.json()) as T
}

function parseJsonLine(line: string): OllamaOperationResponse | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed) as OllamaOperationResponse
  } catch {
    return null
  }
}

export async function checkOllamaStatus(baseUrl = DEFAULT_OLLAMA_BASE_URL): Promise<boolean> {
  try {
    const res = await fetch(buildUrl('/api/tags', baseUrl), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    return res.ok
  } catch {
    return false
  }
}

export async function listLocalModels(baseUrl = DEFAULT_OLLAMA_BASE_URL): Promise<OllamaModel[]> {
  const res = await fetch(buildUrl('/api/tags', baseUrl), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status} ${res.statusText}`)
  }

  const data = await safeJson<OllamaTagsResponse>(res)
  return data.models || []
}

export async function* pullLocalModel(
  name: string,
  baseUrl = DEFAULT_OLLAMA_BASE_URL
): AsyncGenerator<OllamaOperationResponse, OllamaOperationResponse, void> {
  const model = name.trim()
  if (!model) {
    throw new Error('Model name is required')
  }

  const res = await fetch(buildUrl('/api/pull', baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson, application/json'
    },
    body: JSON.stringify({
      model,
      stream: true
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to pull model: ${res.status} ${res.statusText}${text ? ` - ${text.slice(0, 200)}` : ''}`)
  }

  if (!res.body) {
    throw new Error('Pull response body is empty')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let lastEvent: OllamaOperationResponse = { status: 'starting', completed: 0, total: 0 }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const parsed = parseJsonLine(line)
        if (!parsed) continue

        if (parsed.error) {
          throw new Error(parsed.error)
        }

        lastEvent = parsed
        yield parsed
      }
    }

    const tail = decoder.decode()
    if (tail) {
      buffer += tail
    }

    const finalParsed = parseJsonLine(buffer)
    if (finalParsed) {
      if (finalParsed.error) {
        throw new Error(finalParsed.error)
      }
      lastEvent = finalParsed
      yield finalParsed
    }

    return lastEvent
  } finally {
    reader.releaseLock()
  }
}

export async function deleteLocalModel(
  name: string,
  baseUrl = DEFAULT_OLLAMA_BASE_URL
): Promise<{ success: true }> {
  const model = name.trim()
  if (!model) {
    throw new Error('Model name is required')
  }

  const res = await fetch(buildUrl('/api/delete', baseUrl), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      model
    })
  })

  if (!res.ok) {
    throw new Error(`Failed to delete model: ${res.status} ${res.statusText}`)
  }

  return { success: true }
}

/**
 * Backward-compatible aliases for older IPC imports.
 */
export function pullModel(
  name: string,
  baseUrl = DEFAULT_OLLAMA_BASE_URL
): AsyncGenerator<OllamaOperationResponse, OllamaOperationResponse, void> {
  return pullLocalModel(name, baseUrl)
}

export async function deleteModel(
  name: string,
  baseUrl = DEFAULT_OLLAMA_BASE_URL
): Promise<{ success: true }> {
  return deleteLocalModel(name, baseUrl)
}