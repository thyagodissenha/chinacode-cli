import { createRequire } from 'module';
import { mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

export type DB = ReturnType<typeof Database>;

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getDefaultDbPath(): string {
  return join(homedir(), '.chinacode', 'sessions.db');
}

export function initDB(dbPath: string = getDefaultDbPath()): DB {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db: DB = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  return db;
}
