import { readFile, writeFile } from 'fs/promises';
import { resolve, relative } from 'path';
import { createInterface } from 'readline';
import { z } from 'zod';
import { renderDiff } from './diff-renderer.js';
import { setAutoApprove } from './write-file.js';
import type { Tool } from './types.js';

const editFileSchema = z.object({
  path: z.string().describe('File to edit'),
  old_text: z.string().describe('Exact text to replace (must be unique in the file)'),
  new_text: z.string().describe('Replacement text'),
});

type EditFileArgs = z.infer<typeof editFileSchema>;

let sessionAutoApprove = false;

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

async function executeEditFile(args: EditFileArgs): Promise<string> {
  const workspaceRoot = process.cwd();
  const absPath = resolve(workspaceRoot, args.path);
  const rel = relative(workspaceRoot, absPath);

  let content: string;
  try {
    content = await readFile(absPath, 'utf8');
  } catch {
    return JSON.stringify({ error: `File not found: ${args.path}` });
  }

  const occurrences = content.split(args.old_text).length - 1;
  if (occurrences === 0) {
    return JSON.stringify({ error: 'old_text not found in file' });
  }
  if (occurrences > 1) {
    return JSON.stringify({ error: 'old_text is not unique — provide more context' });
  }

  const newContent = content.replace(args.old_text, args.new_text);

  if (sessionAutoApprove) {
    await writeFile(absPath, newContent, 'utf8');
    return JSON.stringify({ success: true, path: rel });
  }

  const diff = renderDiff(content, newContent, rel);
  console.log('\n' + diff + '\n');

  const answer = await promptUser(`Apply edit to ${rel}? [Y/n/A(all)] `);
  if (answer === 'a') {
    sessionAutoApprove = true;
    setAutoApprove(true);
    await writeFile(absPath, newContent, 'utf8');
    return JSON.stringify({ success: true, path: rel, autoApproveEnabled: true });
  }
  if (answer === '' || answer === 'y') {
    await writeFile(absPath, newContent, 'utf8');
    return JSON.stringify({ success: true, path: rel });
  }
  return JSON.stringify({ skipped: true, path: rel });
}

export const editFileTool: Tool<EditFileArgs> = {
  name: 'edit_file',
  description: 'Edit a file by replacing a unique occurrence of old_text with new_text',
  parameters: editFileSchema,
  execute: executeEditFile,
};
