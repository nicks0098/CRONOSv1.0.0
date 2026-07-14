type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const level = (process.env.LOG_LEVEL as LogLevel) || 'info'
const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function log(lvl: LogLevel, tag: string, msg: string, data?: unknown) {
  if (levels[lvl] < levels[level]) return
  const ts = new Date().toISOString()
  const line = `[${ts}] [${lvl.toUpperCase()}] [${tag}] ${msg}`
  if (lvl === 'error') console.error(line, data ?? '')
  else if (lvl === 'warn') console.warn(line, data ?? '')
  else console.log(line, data ?? '')
}

export const logger = {
  debug: (tag: string, msg: string, data?: unknown) => log('debug', tag, msg, data),
  info: (tag: string, msg: string, data?: unknown) => log('info', tag, msg, data),
  warn: (tag: string, msg: string, data?: unknown) => log('warn', tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) => log('error', tag, msg, data),
}
