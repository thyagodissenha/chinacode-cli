import { z } from 'zod';

// ─── Tool Call Types ──────────────────────────────────────────────────────────

export const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
});

export const nativeToolCallSchema = z.array(toolCallSchema);

export type ToolCall = z.infer<typeof toolCallSchema>;

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

// ─── Agent Message Types ──────────────────────────────────────────────────────

export interface SystemMessage {
  role: 'system';
  content: string;
}

export interface UserMessage {
  role: 'user';
  content: string;
}

export interface AssistantMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCall[];
}

export type AgentMessage = SystemMessage | UserMessage | AssistantMessage | ToolResult;

// ─── Agent Loop Config ────────────────────────────────────────────────────────

export interface AgentConfig {
  maxIterations: number;
  toolTimeoutMs: number;
  sessionId: string;
  model: string;
  provider: string;
}

// ─── Streaming Events ─────────────────────────────────────────────────────────

export type AgentEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_start'; name: string; args: string }
  | { type: 'tool_end'; name: string; result: string; durationMs: number }
  | { type: 'done'; finalText: string }
  | { type: 'error'; message: string }
  | { type: 'loop_limit'; iterations: number }
  | { type: 'infinite_loop'; tool: string };

// ─── Parsed Tool Call Result ──────────────────────────────────────────────────

export interface ParsedToolCalls {
  calls: ToolCall[];
  usedFallback: boolean;
}
