import { spawn } from 'node:child_process'
import { checkOllamaHealth } from './ollamaClient'
import { logger } from '../../utils/logger'

let starting = false

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function ensureOllamaRunning(): Promise<boolean> {
  const alreadyOnline = await checkOllamaHealth()
  if (alreadyOnline) return true

  if (starting) {
    for (let i = 0; i < 20; i++) {
      await delay(500)
      if (await checkOllamaHealth()) return true
    }
    return false
  }

  starting = true
  logger.info('Ollama', 'Ollama offline, attempting auto-start')

  try {
    const child = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
      shell: true,
      windowsHide: true
    })

    child.unref()

    for (let i = 0; i < 30; i++) {
      await delay(500)
      if (await checkOllamaHealth()) {
        logger.info('Ollama', 'Ollama auto-started successfully')
        starting = false
        return true
      }
    }

    logger.warn('Ollama', 'Ollama auto-start timed out')
    starting = false
    return false
  } catch (err) {
    logger.error('Ollama', 'Failed to auto-start Ollama', err)
    starting = false
    return false
  }
}