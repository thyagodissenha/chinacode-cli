import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, resolve, relative } from 'path';
import { createInterface } from 'readline';
import { z } from 'zod';
import { renderDiff } from './diff-renderer.js';
import type { Tool } from './types.js';

const writeFileSchema = z.object({
  path: z.string().describe('Path to write'),
  content: z.string().describe('File content'),
});

type WriteFileArgs = z.infer<typeof writeFileSchema>;

// Session-level auto-approve flag
let sessionAutoApprove = false;

export function setAutoApprove(value: boolean): void {
  sessionAutoApprove = value;
}

async function promptUser(question: string): Promise<string> {
  if (!process.stdin.isTTY) return 'y';
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function executeWriteFile(args: WriteFileArgs): Promise<string> {
  const workspaceRoot = process.cwd();
  const absPath = resolve(workspaceRoot, args.path);
  const rel = relative(workspaceRoot, absPath);

  if (sessionAutoApprove) {
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, args.content, 'utf8');
    return JSON.stringify({ success: true, path: rel });
  }

  let existingContent = '';
  try { existingContent = await readFile(absPath, 'utf8'); } catch { /* new file */ }

  const diff = renderDiff(existingContent, args.content, rel);
  console.log('\n' + diff + '\n');

  const answer = await promptUser(`Write ${rel}? [Y/n/A(all)] `);
  if (answer === 'a') {
    sessionAutoApprove = true;
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, args.content, 'utf8');
    return JSON.stringify({ success: true, path: rel, autoApproveEnabled: true });
  }
  if (answer === '' || answer === 'y') {
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, args.content, 'utf8');
    return JSON.stringify({ success: true, path: rel });
  }
  return JSON.stringify({ skipped: true, path: rel });
}

export const writeFileTool: Tool<WriteFileArgs> = {
  name: 'write_file',
  description: 'Write content to a file (shows diff and asks for confirmation)',
  parameters: writeFileSchema,
  execute: executeWriteFile,
};
