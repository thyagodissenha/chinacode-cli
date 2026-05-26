import { toolCallSchema, type ToolCall } from '../../types/agent.js';

export function parseNativeToolCalls(rawToolCalls: unknown[]): ToolCall[] {
  const results: ToolCall[] = [];
  for (const raw of rawToolCalls) {
    const parsed = toolCallSchema.safeParse(raw);
    if (parsed.success) {
      results.push(parsed.data);
    }
  }
  return results;
}
