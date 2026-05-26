import { z } from 'zod';
import type { Tool } from './types.js';

const delegateSchema = z.object({
  task: z.string().describe('Task description to delegate to a subagent'),
  agent: z.string().optional().describe('Target agent name'),
});

type DelegateArgs = z.infer<typeof delegateSchema>;

export const delegateTaskTool: Tool<DelegateArgs> = {
  name: 'delegate_task',
  description: 'Delegate a task to a subagent (Phase 2 feature)',
  parameters: delegateSchema,
  async execute(args) {
    console.warn(`[delegate_task] Attempted to delegate: ${args.task}`);
    return JSON.stringify({
      error: 'Subagents not yet implemented. This feature is available in Phase 2.',
    });
  },
};
