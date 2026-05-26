import { spawn } from 'child_process';
import { z } from 'zod';
import type { Tool } from './types.js';

const sandboxSchema = z.object({
  command: z.string(),
  timeout: z.number().optional(),
});

type SandboxArgs = z.infer<typeof sandboxSchema>;

async function isDockerAvailable(): Promise<boolean> {
  return new Promise(resolve => {
    const proc = spawn('docker', ['info'], { stdio: 'ignore' });
    proc.on('close', code => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function runInDocker(command: string, timeout: number): Promise<string> {
  const image = process.env.SANDBOX_IMAGE ?? 'node:20-alpine';
  const cwd = process.cwd();

  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const proc = spawn('docker', [
      'run', '--rm',
      '--network', 'none',
      '-v', `${cwd}:/workspace`,
      '-w', '/workspace',
      image,
      'sh', '-c', command,
    ], { stdio: 'pipe' });

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
      resolve(JSON.stringify({ error: err.message }));
    });
  });
}

async function executeSandbox(args: SandboxArgs): Promise<string> {
  const { command, timeout = 60_000 } = args;

  if (process.env.SANDBOX_ENABLED !== 'true') {
    const { bashTool } = await import('./bash.js');
    return bashTool.execute({ command, timeout });
  }

  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    process.stderr.write('⚠ Docker not found — running in unsandboxed mode\n');
    const { bashTool } = await import('./bash.js');
    return bashTool.execute({ command, timeout });
  }

  return runInDocker(command, timeout);
}

export const sandboxTool: Tool<SandboxArgs> = {
  name: 'bash_sandbox',
  description: 'Execute a shell command in an isolated Docker sandbox',
  parameters: sandboxSchema,
  execute: executeSandbox,
};
