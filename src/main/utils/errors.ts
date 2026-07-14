export class CronosError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'CronosError'
  }
}

export class OllamaError extends CronosError {
  constructor(message: string, details?: unknown) {
    super(message, 'OLLAMA_ERROR', details)
    this.name = 'OllamaError'
  }
}

export class DatabaseError extends CronosError {
  constructor(message: string, details?: unknown) {
    super(message, 'DB_ERROR', details)
    this.name = 'DatabaseError'
  }
}

export class SearchError extends CronosError {
  constructor(message: string, details?: unknown) {
    super(message, 'SEARCH_ERROR', details)
    this.name = 'SearchError'
  }
}

export function toIpcError(err: unknown): string {
  if (err instanceof CronosError) return `${err.code}: ${err.message}`
  if (err instanceof Error) return err.message
  return String(err)
}
