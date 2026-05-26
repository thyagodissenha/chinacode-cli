import { readFile, realpath } from 'fs/promises';
import { resolve, relative } from 'path';
import { z } from 'zod';
import type { Tool } from './types.js';

const readFileSchema = z.object({
  path: z.string().describe('Path to the file to read'),
  offset: z.number().optional().describe('Line number to start reading from (1-based)'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
});

type ReadFileArgs = z.infer<typeof readFileSchema>;

const SECRET_PATTERNS = [
  /^\.env(\..+)?$/,
  /^\.git\/config$/,
  /\.pem$/,
  /\.key$/,
  /^id_rsa/,
  /\.p12$/,
  /\.pfx$/,
];

function isSecretFile(filePath: string): boolean {
  const base = filePath.split('/').pop() ?? filePath;
  return SECRET_PATTERNS.some(p => p.test(base) || p.test(filePath));
}

async function executeReadFile(args: ReadFileArgs): Promise<string> {
  const workspaceRoot = process.cwd();
  const absPath = resolve(workspaceRoot, args.path);

  // Path traversal check
  const rel = relative(workspaceRoot, absPath);
  if (rel.startsWith('..')) {
    return JSON.stringify({ error: 'Access denied: path is outside workspace root' });
  }

  // Symlink check
  try {
    const realAbsPath = await realpath(absPath);
    const realRel = relative(workspaceRoot, realAbsPath);
    if (realRel.startsWith('..')) {
      return JSON.stringify({ error: 'Access denied: symlink points outside workspace root' });
    }
  } catch {
    return JSON.stringify({ error: `File not found: ${args.path}` });
  }

  if (isSecretFile(args.path)) {
    return JSON.stringify({ error: 'Access denied: file matches secrets pattern' });
  }

  let content: Buffer;
  try {
    content = await readFile(absPath);
  } catch {
    return JSON.stringify({ error: `File not found: ${args.path}` });
  }

  // Binary file detection
  const preview = content.subarray(0, 512);
  if (preview.includes(0)) {
    return JSON.stringify({ error: 'Cannot read binary file' });
  }

  const text = content.toString('utf8');
  const lines = text.split('\n');

  if (args.offset !== undefined || args.limit !== undefined) {
    const start = Math.max(0, (args.offset ?? 1) - 1);
    const end = args.limit !== undefined ? start + args.limit : lines.length;
    return lines.slice(start, end).join('\n');
  }

  return text;
}

export const readFileTool: Tool<ReadFileArgs> = {
  name: 'read_file',
  description: 'Read the contents of a file, optionally with line offset and limit',
  parameters: readFileSchema,
  execute: executeReadFile,
};
