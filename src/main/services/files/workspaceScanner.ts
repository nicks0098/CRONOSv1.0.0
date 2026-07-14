import fs from 'fs'
import path from 'path'

export interface WorkspaceFile {
  name: string
  path: string
  ext: string
  size: number
}

const ALLOWED_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.py', '.css', '.html']

export function scanWorkspace(dir: string, maxFiles = 50): WorkspaceFile[] {
  const results: WorkspaceFile[] = []
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'out', '.vite'])

  function walk(current: string, depth: number) {
    if (depth > 4 || results.length >= maxFiles) return
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(current, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue
      const full = path.join(current, e.name)
      if (e.isDirectory()) {
        walk(full, depth + 1)
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase()
        if (ALLOWED_EXTS.includes(ext)) {
          const stat = fs.statSync(full)
          results.push({ name: e.name, path: full, ext, size: stat.size })
        }
      }
    }
  }

  walk(dir, 0)
  return results
}
