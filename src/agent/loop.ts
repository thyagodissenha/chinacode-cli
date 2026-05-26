import type { AgentMessage, AgentEvent, ToolCall } from '../types/agent.js';
import { parseNativeToolCalls } from './parsers/native.js';
import { parseFallbackToolCalls } from './parsers/fallback.js';
import { writeAuditEntry } from '../logging/audit.js';

export interface ToolRegistry {
  get(name: string): { execute(args: unknown): Promise<string> } | undefined;
  toOpenAIFormat(): unknown[];
}

export interface AgentLoopConfig {
  maxIterations?: number;
  toolRegistry: ToolRegistry;
  callModel: (messages: AgentMessage[], signal?: AbortSignal) => AsyncGenerator<{
    type: string;
    content?: string;
    call?: ToolCall;
    usage?: unknown;
  }>;
  sessionId: string;
  onToken?: (token: string) => void;
  onToolStart?: (name: string, args: string) => void;
  onToolEnd?: (name: string, result: string, durationMs: number) => void;
}

export class AgentLoop {
  private readonly maxIterations: number;
  private readonly config: AgentLoopConfig;

  constructor(config: AgentLoopConfig) {
    this.config = config;
    this.maxIterations = config.maxIterations ?? 15;
  }

  async *run(messages: AgentMessage[], signal?: AbortSignal): AsyncGenerator<AgentEvent> {
    const history: AgentMessage[] = [...messages];
    let iterations = 0;
    const recentCalls: string[] = [];

    while (iterations < this.maxIterations) {
      if (signal?.aborted) {
        yield { type: 'error', message: 'Cancelled by user' };
        return;
      }

      iterations++;
      let assistantText = '';
      const toolCalls: ToolCall[] = [];

      for await (const event of this.config.callModel(history, signal)) {
        if (event.type === 'token' && event.content) {
          assistantText += event.content;
          yield { type: 'token', content: event.content };
          this.config.onToken?.(event.content);
        } else if (event.type === 'tool_call' && event.call) {
          toolCalls.push(event.call);
        }
      }

      // Try to extract tool calls from text if none came via streaming
      let calls = toolCalls;
      let usedFallback = false;
      if (calls.length === 0 && assistantText) {
        const nativeParsed = parseNativeToolCalls([]);
        if (nativeParsed.length > 0) {
          calls = nativeParsed;
        } else {
          const fallback = parseFallbackToolCalls(assistantText);
          calls = fallback.calls;
          usedFallback = fallback.usedFallback;
        }
      }

      if (usedFallback) {
        await writeAuditEntry({
          timestamp: new Date().toISOString(),
          session_id: this.config.sessionId,
          event: 'fallback_parse',
        });
      }

      // No tool calls → final answer
      if (calls.length === 0) {
        history.push({ role: 'assistant', content: assistantText });
        yield { type: 'done', finalText: assistantText };
        return;
      }

      history.push({ role: 'assistant', content: assistantText || null, tool_calls: calls });

      // Infinite loop detection
      const callSig = calls.map(c => `${c.function.name}:${c.function.arguments}`).join('|');
      recentCalls.push(callSig);
      if (recentCalls.length > 3) recentCalls.shift();
      if (recentCalls.length === 3 && recentCalls.every(s => s === callSig)) {
        yield { type: 'infinite_loop', tool: calls[0]?.function.name ?? 'unknown' };
        return;
      }

      // Execute tools
      for (const call of calls) {
        const tool = this.config.toolRegistry.get(call.function.name);
        if (!tool) {
          history.push({
            tool_call_id: call.id,
            role: 'tool',
            content: `Error: tool "${call.function.name}" not found`,
          });
          continue;
        }

        let args: unknown;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          history.push({ tool_call_id: call.id, role: 'tool', content: 'Error: invalid JSON arguments' });
          continue;
        }

        yield { type: 'tool_start', name: call.function.name, args: call.function.arguments };
        this.config.onToolStart?.(call.function.name, call.function.arguments);
        const t0 = Date.now();

        let result: string;
        try {
          result = await tool.execute(args);
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }

        const durationMs = Date.now() - t0;
        this.config.onToolEnd?.(call.function.name, result, durationMs);
        yield { type: 'tool_end', name: call.function.name, result, durationMs };

        await writeAuditEntry({
          timestamp: new Date().toISOString(),
          session_id: this.config.sessionId,
          event: 'tool_call',
          tool_name: call.function.name,
          args_summary: call.function.arguments.slice(0, 200),
          result_summary: result,
          duration_ms: durationMs,
        });

        history.push({ tool_call_id: call.id, role: 'tool', content: result });
      }
    }

    yield { type: 'loop_limit', iterations: this.maxIterations };
  }
}
