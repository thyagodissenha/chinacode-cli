import { spawn } from 'child_process';
import { z } from 'zod';
import type { Tool } from './types.js';

const DESTRUCTIVE_PATTERNS = [
  /\brm\s+-[a-z]*r[a-z]*f\b/i,
  /\bdrop\s+table\b/i,
  /\bgit\s+push\s+--force\b/i,
  /\bformat\s+[a-z]:/i,
  /\bmkfs\b/i,
];

const bashSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default: 60000)'),
});

type BashArgs = z.infer<typeof bashSchema>;

async function executeBash(args: BashArgs): Promise<string> {
  const { command, timeout = 60_000 } = args;

  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) {
      return JSON.stringify({ requires_confirmation: true, command });
    }
  }

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn('sh', ['-c', command], { stdio: 'pipe' });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeout);

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    proc.on('close', code => {
      clearTimeout(timer);
      if (timedOut) {
        resolve(JSON.stringify({ error: `timeout after ${timeout / 1000}s` }));
        return;
      }
      resolve(JSON.stringify({ stdout, stderr, exit_code: code ?? 0 }));
    });

    proc.on('error', err => {
      clearTimeout(timer);
      resolve(JSON.stringify({ error: err.message, stdout, stderr }));
    });
  });
}

export const bashTool: Tool<BashArgs> = {
  name: 'bash',
  description: 'Execute a shell command and return stdout, stderr, and exit code',
  parameters: bashSchema,
  execute: executeBash,
};
