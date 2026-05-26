import OpenAI from 'openai';
import type { AgentMessage, ToolCall } from '../types/agent.js';
import { createModelClient } from './client.js';
import { getProviderConfig, resolveDefaultProvider, type ProviderName } from './providers.js';
import { routeModel, type SessionModelOverride } from './router.js';
import { withRetry } from './retry.js';
import { mapProviderError } from './error-messages.js';
import { CircuitBreaker } from './circuit-breaker.js';

export type { ModelSelection, ModelTier, SessionModelOverride } from './router.js';
export { routeModel } from './router.js';
export { createModelClient } from './client.js';
export { getProviderConfig, resolveDefaultProvider } from './providers.js';
export { mapProviderError } from './error-messages.js';
export { CircuitBreaker } from './circuit-breaker.js';
export { withRetry } from './retry.js';

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_call'; call: ToolCall }
  | { type: 'done'; usage?: OpenAI.CompletionUsage };

export interface ModelSession {
  id: string;
  modelOverride?: SessionModelOverride;
  provider?: ProviderName;
}

const breakers = new Map<string, CircuitBreaker>();

function getBreaker(provider: string): CircuitBreaker {
  let b = breakers.get(provider);
  if (!b) {
    b = new CircuitBreaker({ provider });
    breakers.set(provider, b);
  }
  return b;
}

async function* streamFromProvider(
  client: OpenAI,
  model: string,
  messages: AgentMessage[],
  tools: OpenAI.ChatCompletionTool[] | undefined,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const stream = await client.chat.completions.create(
    {
      model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      tools,
      stream: true,
    },
    { signal },
  );

  const toolCallAccum: Map<number, { id: string; name: string; args: string }> = new Map();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      yield { type: 'token', content: delta.content };
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolCallAccum.has(idx)) {
          toolCallAccum.set(idx, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
        }
        const acc = toolCallAccum.get(idx)!;
        if (tc.id) acc.id = tc.id;
        if (tc.function?.name) acc.name = tc.function.name;
        if (tc.function?.arguments) acc.args += tc.function.arguments;
      }
    }

    if (chunk.usage) {
      for (const [, acc] of toolCallAccum) {
        yield {
          type: 'tool_call',
          call: { id: acc.id, type: 'function', function: { name: acc.name, arguments: acc.args } },
        };
      }
      yield { type: 'done', usage: chunk.usage };
    }
  }

  // Emit tool calls if no usage chunk came
  if (toolCallAccum.size > 0) {
    for (const [, acc] of toolCallAccum) {
      yield {
        type: 'tool_call',
        call: { id: acc.id, type: 'function', function: { name: acc.name, arguments: acc.args } },
      };
    }
  }
  yield { type: 'done' };
}

export async function* callModel(
  messages: AgentMessage[],
  session: ModelSession,
  signal?: AbortSignal,
  tools?: OpenAI.ChatCompletionTool[],
): AsyncGenerator<StreamEvent> {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const selection = routeModel(
    (lastUser && 'content' in lastUser ? lastUser.content?.toString() : '') ?? '',
    session.modelOverride,
  );

  const providerName = (session.provider ?? selection.provider) as ProviderName;
  const providerCfg = getProviderConfig(providerName);
  const client = createModelClient(providerCfg);
  const breaker = getBreaker(providerName);

  try {
    const gen = await withRetry(() =>
      breaker.call(() =>
        Promise.resolve(streamFromProvider(client, selection.model, messages, tools, signal)),
      ),
    );
    yield* gen;
  } catch (primaryErr: any) {
    if (primaryErr?.degraded) {
      const fallbackModel = process.env.FALLBACK_MODEL ?? 'qwen-turbo';
      const fallbackProvider = getProviderConfig('dashscope');
      const fallbackClient = createModelClient(fallbackProvider);
      try {
        yield* streamFromProvider(fallbackClient, fallbackModel, messages, tools, signal);
        return;
      } catch (fallbackErr) {
        const mapped = mapProviderError(fallbackErr, 'dashscope');
        throw new Error(`${mapped.message}\n${mapped.actionable}`);
      }
    }
    const mapped = mapProviderError(primaryErr, providerName);
    if (mapped.flag === 'context_length_exceeded') {
      const err: any = new Error(mapped.message);
      err.flag = mapped.flag;
      throw err;
    }
    throw new Error(`${mapped.message}\n${mapped.actionable}`);
  }
}
