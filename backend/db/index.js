import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const folder = dirname(fileURLToPath(import.meta.url))
export const databasePath = process.env.DB_PATH
  ? resolve(process.cwd(), process.env.DB_PATH)
  : resolve(folder, '..', 'data', 'cafes.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
export const db = new DatabaseSync(databasePath)
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;')
db.exec(readFileSync(resolve(folder, 'schema.sql'), 'utf8'))
