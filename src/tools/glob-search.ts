import { z } from 'zod';
import type { Tool } from './types.js';

const globSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files'),
});

type GlobArgs = z.infer<typeof globSchema>;

async function executeGlobSearch(args: GlobArgs): Promise<string> {
  const fg = await import('fast-glob');
  const matches: string[] = await fg.default(args.pattern, {
    cwd: process.cwd(),
    dot: false,
    absolute: false,
    followSymbolicLinks: false,
  });

  if (matches.length > 500) {
    return JSON.stringify({ matches: matches.slice(0, 500), truncated: true });
  }
  return JSON.stringify({ matches });
}

export const globSearchTool: Tool<GlobArgs> = {
  name: 'glob_search',
  description: 'Find files matching a glob pattern within the workspace',
  parameters: globSchema,
  execute: executeGlobSearch,
};
