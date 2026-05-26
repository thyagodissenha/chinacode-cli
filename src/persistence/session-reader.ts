import type { DB } from './db.js';
import type { AgentMessage } from '../types/agent.js';

export interface SessionRow {
  id: string;
  started_at: string;
  ended_at?: string;
  working_dir: string;
  initial_model: string;
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
}

export interface SessionWithMessages extends SessionRow {
  messages: AgentMessage[];
}

export function listSessions(db: DB, limit = 20): SessionRow[] {
  return db.prepare(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?',
  ).all(limit) as SessionRow[];
}

export function loadSession(db: DB, sessionId: string): SessionWithMessages | null {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow | undefined;
  if (!session) return null;

  const rawMessages = db.prepare(
    'SELECT role, content, tool_name FROM session_messages WHERE session_id = ? ORDER BY timestamp ASC',
  ).all(sessionId) as Array<{ role: string; content: string | null; tool_name: string | null }>;

  const messages: AgentMessage[] = rawMessages.map(m => {
    if (m.role === 'tool') {
      return { role: 'tool' as const, tool_call_id: m.tool_name ?? '', content: m.content ?? '' };
    }
    return { role: m.role as 'system' | 'user' | 'assistant', content: m.content ?? '' };
  });

  return { ...session, messages };
}

export function getLastNMessages(session: SessionWithMessages, n: number): AgentMessage[] {
  return session.messages.slice(-n);
}
