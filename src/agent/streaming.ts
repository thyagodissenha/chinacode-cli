import type OpenAI from 'openai';
import type { ToolCall } from '../types/agent.js';

export type StreamChunk =
  | { type: 'token'; content: string }
  | { type: 'tool_call_chunk'; index: number; delta: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall }
  | { type: 'done'; toolCalls: ToolCall[]; fullText: string };

export async function* streamResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
): AsyncGenerator<StreamChunk> {
  const toolCallAccum = new Map<number, { id: string; name: string; args: string }>();
  let fullText = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      fullText += delta.content;
      yield { type: 'token', content: delta.content };
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        yield { type: 'tool_call_chunk', index: idx, delta: tc };

        if (!toolCallAccum.has(idx)) {
          toolCallAccum.set(idx, { id: '', name: '', args: '' });
        }
        const acc = toolCallAccum.get(idx)!;
        if (tc.id) acc.id = tc.id;
        if (tc.function?.name) acc.name = tc.function.name;
        if (tc.function?.arguments) acc.args += tc.function.arguments;
      }
    }
  }

  const toolCalls: ToolCall[] = [];
  for (const [, acc] of [...toolCallAccum.entries()].sort(([a], [b]) => a - b)) {
    toolCalls.push({
      id: acc.id || `call_${Math.random().toString(36).slice(2)}`,
      type: 'function',
      function: { name: acc.name, arguments: acc.args },
    });
  }

  yield { type: 'done', toolCalls, fullText };
}
