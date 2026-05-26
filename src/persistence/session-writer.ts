import { v4 as uuidv4 } from 'uuid';
import type { DB } from './db.js';
import type { AgentMessage } from '../types/agent.js';

export interface SessionConfig {
  model: string;
  workingDir: string;
  gitBranch?: string;
}

export interface SessionSummary {
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
}

function withRetryOnLock<T>(fn: () => T, maxRetries = 3): T {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (err: any) {
      if (err.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
        const delay = 100 * (i + 1);
        // Sync sleep for SQLite busy retry
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
        continue;
      }
      if (i === maxRetries - 1) {
        console.warn(`[session-writer] DB busy after ${maxRetries} retries, skipping persistence`);
        return undefined as unknown as T;
      }
      throw err;
    }
  }
  return undefined as unknown as T;
}

export function createSession(db: DB, config: SessionConfig): string {
  const id = uuidv4();
  const now = new Date().toISOString();

  withRetryOnLock(() => {
    db.prepare(
      'INSERT INTO sessions (id, started_at, working_dir, initial_model, git_branch) VALUES (?, ?, ?, ?, ?)',
    ).run(id, now, config.workingDir, config.model, config.gitBranch ?? null);
  });

  return id;
}

export function appendMessage(db: DB, sessionId: string, message: AgentMessage): void {
  const id = uuidv4();
  const content = 'content' in message ? (message.content ?? null) : null;
  const toolName = 'tool_call_id' in message ? (message as any).tool_call_id : null;

  withRetryOnLock(() => {
    db.prepare(
      'INSERT INTO session_messages (id, session_id, role, content, tool_name, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, sessionId, message.role, content, toolName, new Date().toISOString());
  });
}

export function finalizeSession(db: DB, sessionId: string, summary: SessionSummary): void {
  withRetryOnLock(() => {
    db.prepare(
      'UPDATE sessions SET ended_at = ?, total_cost = ?, input_tokens = ?, output_tokens = ? WHERE id = ?',
    ).run(new Date().toISOString(), summary.totalCost, summary.inputTokens, summary.outputTokens, sessionId);
  });
}
