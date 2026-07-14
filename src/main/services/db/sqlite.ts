// src/main/services/db/sqlite.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { logger } from '../../utils/logger'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'cronos.db')
    logger.info('DB', `Opening database at ${dbPath}`)
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
  }
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}