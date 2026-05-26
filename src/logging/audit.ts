import { appendFile, mkdir, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface AuditEntry {
  timestamp: string;
  session_id: string;
  event: 'tool_call' | 'tool_result' | 'fallback_parse' | 'session_start' | 'session_end' | string;
  tool_name?: string;
  args_summary?: string;
  result_summary?: string;
  duration_ms?: number;
}

const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS ?? '30', 10);
const MAX_RESULT_BYTES = 2048;

let initialized = false;

export function getLogDir(): string {
  return join(homedir(), '.chinacode', 'logs');
}

export function getLogPath(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10);
  return join(getLogDir(), `${iso}.jsonl`);
}

async function ensureInit(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const logDir = getLogDir();
  await mkdir(logDir, { recursive: true });

  // Delete old log files
  try {
    const files = await readdir(logDir);
    const cutoff = Date.now() - LOG_RETENTION_DAYS * 86_400_000;
    await Promise.all(
      files.map(async f => {
        if (!f.endsWith('.jsonl')) return;
        const fp = join(logDir, f);
        const s = await stat(fp);
        if (s.mtimeMs < cutoff) await unlink(fp);
      }),
    );
  } catch {
    // best-effort cleanup
  }
}

export async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  await ensureInit();

  const normalized: AuditEntry = { ...entry };
  if (normalized.result_summary && Buffer.byteLength(normalized.result_summary) > MAX_RESULT_BYTES) {
    normalized.result_summary = normalized.result_summary.slice(0, MAX_RESULT_BYTES) + '…[truncated]';
  }

  const line = JSON.stringify(normalized) + '\n';
  await appendFile(getLogPath(), line, 'utf8');
}
