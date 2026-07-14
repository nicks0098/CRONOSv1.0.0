import fs from 'fs'

export function readFileContext(filePath: string, maxChars = 4000): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content.slice(0, maxChars)
  } catch {
    return ''
  }
}

export function buildFileContextPrompt(files: Array<{ path: string; content: string }>): string {
  return files.map(f => `--- File: ${f.path} ---\n${f.content}`).join('\n\n')
}
