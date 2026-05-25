import Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Message, SessionRecord } from '../types.js'

export class SessionStorage {
  private db: Database.Database

  constructor(dbPath?: string) {
    const dir = join(homedir(), '.chinacode')
    mkdirSync(dir, { recursive: true })
    const resolvedPath = dbPath ?? join(dir, 'sessions.db')
    this.db = new Database(resolvedPath)
    this.initSchema()
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        directory TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        total_cost REAL NOT NULL DEFAULT 0,
        message_count INTEGER NOT NULL DEFAULT 0,
        messages TEXT NOT NULL DEFAULT '[]'
      )
    `)
  }

  createSession(directory: string, model: string): string {
    const id = `${Date.now()}-${randomBytes(3).toString('hex')}`
    const now = Date.now()
    this.db
      .prepare(
        'INSERT INTO sessions (id, directory, model, created_at, updated_at, total_cost, message_count, messages) VALUES (?, ?, ?, ?, ?, 0, 0, ?)',
      )
      .run(id, directory, model, now, now, '[]')
    return id
  }

  updateSession(id: string, messages: Message[], totalCost: number): void {
    this.db
      .prepare(
        'UPDATE sessions SET updated_at = ?, total_cost = ?, message_count = ?, messages = ? WHERE id = ?',
      )
      .run(Date.now(), totalCost, messages.length, JSON.stringify(messages), id)
  }

  getSession(id: string): SessionRecord | null {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    return this.rowToRecord(row)
  }

  listSessions(limit = 20): SessionRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ?')
      .all(limit) as Record<string, unknown>[]
    return rows.map((r) => this.rowToRecord(r))
  }

  private rowToRecord(row: Record<string, unknown>): SessionRecord {
    return {
      id: row['id'] as string,
      directory: row['directory'] as string,
      model: row['model'] as string,
      createdAt: row['created_at'] as number,
      updatedAt: row['updated_at'] as number,
      totalCost: row['total_cost'] as number,
      messageCount: row['message_count'] as number,
      messages: row['messages'] as string,
    }
  }

  formatSessionList(sessions: SessionRecord[]): string {
    if (sessions.length === 0) return 'Nenhuma sessão encontrada.'
    const header = 'ID                    | Data       | Diretório            | Modelo       | Custo    | Msgs'
    const sep = '─'.repeat(header.length)
    const rows = sessions.map((s) => {
      const date = new Date(s.createdAt).toLocaleDateString('pt-BR')
      const dir = s.directory.length > 20 ? '...' + s.directory.slice(-17) : s.directory.padEnd(20)
      const model = s.model.length > 12 ? s.model.slice(0, 12) : s.model.padEnd(12)
      const cost = `$${s.totalCost.toFixed(4)}`.padEnd(8)
      return `${s.id.padEnd(21)} | ${date} | ${dir} | ${model} | ${cost} | ${s.messageCount}`
    })
    return [header, sep, ...rows].join('\n')
  }

  close(): void {
    this.db.close()
  }
}
