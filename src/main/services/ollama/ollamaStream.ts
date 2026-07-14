import { getOllamaHost } from './ollamaClient'
import { OllamaError } from '../../utils/errors'

export interface OllamaMessage {
  role: string
  content: string
}

export async function* streamChat(
  model: string,
  messages: OllamaMessage[],
  system?: string
): AsyncGenerator<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true
  }

  if (system) body.system = system

  const res = await fetch(`${getOllamaHost()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new OllamaError(`Chat stream failed ${res.status}: ${text}`)
  }

  if (!res.body) {
    throw new OllamaError('No response body')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const parsed = JSON.parse(line)

        if (typeof parsed?.message?.content === 'string' && parsed.message.content.length > 0) {
          yield parsed.message.content
        }

        if (parsed?.done === true) {
          return
        }
      } catch {
        continue
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer)
      if (typeof parsed?.message?.content === 'string' && parsed.message.content.length > 0) {
        yield parsed.message.content
      }
    } catch {
      return
    }
  }
}