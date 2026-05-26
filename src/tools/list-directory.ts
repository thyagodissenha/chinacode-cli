import { readdir } from 'fs/promises';
import { join, relative } from 'path';
import { z } from 'zod';
import type { Tool } from './types.js';

const listDirSchema = z.object({
  path: z.string().describe('Directory path to list'),
  recursive: z.boolean().optional().describe('List recursively'),
});

type ListDirArgs = z.infer<typeof listDirSchema>;
type EntryType = 'file' | 'dir';
interface Entry { name: string; type: EntryType; path: string; }

async function walkDir(dir: string, rootPath: string, depth: number, entries: Entry[]): Promise<void> {
  if (entries.length >= 1000 || depth > 10) return;

  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    if (entries.length >= 1000) break;
    const full = join(dir, item.name);
    const relPath = relative(rootPath, full);
    const type: EntryType = item.isDirectory() ? 'dir' : 'file';
    entries.push({ name: item.name, type, path: relPath });
    if (item.isDirectory() && depth < 10) {
      await walkDir(full, rootPath, depth + 1, entries);
    }
  }
}

async function executeListDirectory(args: ListDirArgs): Promise<string> {
  const workspaceRoot = process.cwd();
  const absPath = join(workspaceRoot, args.path);
  const entries: Entry[] = [];

  try {
    if (args.recursive) {
      await walkDir(absPath, workspaceRoot, 0, entries);
    } else {
      const items = await readdir(absPath, { withFileTypes: true });
      for (const item of items) {
        const full = join(absPath, item.name);
        entries.push({
          name: item.name,
          type: item.isDirectory() ? 'dir' : 'file',
          path: relative(workspaceRoot, full),
        });
      }
    }
  } catch {
    return JSON.stringify({ error: `Directory not found: ${args.path}` });
  }

  if (entries.length >= 1000) {
    return JSON.stringify({ entries, truncated: true });
  }
  return JSON.stringify({ entries });
}

export const listDirectoryTool: Tool<ListDirArgs> = {
  name: 'list_directory',
  description: 'List directory contents, optionally recursively',
  parameters: listDirSchema,
  execute: executeListDirectory,
};
