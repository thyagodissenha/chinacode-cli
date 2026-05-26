import { createReadStream, readdirSync, statSync } from 'fs';
import { createInterface } from 'readline';
import { join, relative } from 'path';
import { z } from 'zod';
import type { Tool } from './types.js';

const grepSchema = z.object({
  pattern: z.string().describe('Search pattern (string or regex)'),
  path: z.string().optional().describe('Directory or file to search in (default: workspace root)'),
});

type GrepArgs = z.infer<typeof grepSchema>;

interface Match { file: string; line: number; content: string; }

function buildRegex(pattern: string): RegExp {
  try {
    const m = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
    if (m) return new RegExp(m[1], m[2]);
  } catch {
    // fall through
  }
  return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function* walkFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function searchFile(filePath: string, re: RegExp): Promise<Match[]> {
  return new Promise(resolve => {
    const matches: Match[] = [];
    const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
    let lineNum = 0;
    rl.on('line', line => {
      lineNum++;
      if (re.test(line)) {
        matches.push({ file: filePath, line: lineNum, content: line.trim() });
      }
    });
    rl.on('close', () => resolve(matches));
    rl.on('error', () => resolve(matches));
  });
}

async function executeGrepSearch(args: GrepArgs): Promise<string> {
  const workspaceRoot = process.cwd();
  const searchRoot = args.path ? join(workspaceRoot, args.path) : workspaceRoot;
  const re = buildRegex(args.pattern);
  const allMatches: Match[] = [];

  let stat: ReturnType<typeof statSync>;
  try { stat = statSync(searchRoot); } catch { return JSON.stringify({ matches: [] }); }

  const files = stat.isFile() ? [searchRoot] : [...walkFiles(searchRoot)];

  for (const file of files) {
    const fileMatches = await searchFile(file, re);
    for (const m of fileMatches) {
      allMatches.push({ ...m, file: relative(workspaceRoot, m.file) });
    }
  }

  return JSON.stringify({ matches: allMatches });
}

export const grepSearchTool: Tool<GrepArgs> = {
  name: 'grep_search',
  description: 'Search file contents for a string or regex pattern',
  parameters: grepSchema,
  execute: executeGrepSearch,
};
