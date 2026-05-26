import { toolCallSchema, type ParsedToolCalls } from '../../types/agent.js';

const CODE_BLOCK_RE = /```(?:json)?\s*\n?([\s\S]*?)\n?```/g;

export function parseFallbackToolCalls(text: string): ParsedToolCalls {
  const calls = [];
  let match: RegExpExecArray | null;

  CODE_BLOCK_RE.lastIndex = 0;
  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    const raw = match[1].trim();
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      continue;
    }

    // Support both a single call object and an array
    const candidates = Array.isArray(json) ? json : [json];
    for (const candidate of candidates) {
      const parsed = toolCallSchema.safeParse(candidate);
      if (parsed.success) {
        calls.push(parsed.data);
      }
    }
  }

  const usedFallback = calls.length > 0;
  if (usedFallback) {
    console.warn('⚠ Tool call via fallback parser');
  }

  return { calls, usedFallback };
}
