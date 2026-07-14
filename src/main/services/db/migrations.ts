import type Database from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'
import { logger } from '../../utils/logger'

export function runMigrations(db: Database.Database) {
  logger.info('DB', 'Running migrations')
  db.exec(SCHEMA_SQL)
  logger.info('DB', 'Migrations complete')
}
