import type { AgentMessage, AgentEvent } from '../types/agent.js';
import { AgentLoop, type AgentLoopConfig, type ToolRegistry } from './loop.js';
import { writeAuditEntry } from '../logging/audit.js';

export type { ToolRegistry };

export interface RunAgentConfig {
  toolRegistry: ToolRegistry;
  callModel: AgentLoopConfig['callModel'];
  sessionId: string;
  maxIterations?: number;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onToolStart?: (name: string, args: string) => void;
  onToolEnd?: (name: string, result: string, durationMs: number) => void;
}

export async function* runAgent(
  messages: AgentMessage[],
  config: RunAgentConfig,
): AsyncGenerator<AgentEvent> {
  await writeAuditEntry({
    timestamp: new Date().toISOString(),
    session_id: config.sessionId,
    event: 'session_start',
  });

  const loop = new AgentLoop({
    maxIterations: config.maxIterations,
    toolRegistry: config.toolRegistry,
    callModel: (msgs, signal) => config.callModel(msgs, signal ?? config.signal),
    sessionId: config.sessionId,
    onToken: config.onToken,
    onToolStart: config.onToolStart,
    onToolEnd: config.onToolEnd,
  });

  yield* loop.run(messages, config.signal);

  await writeAuditEntry({
    timestamp: new Date().toISOString(),
    session_id: config.sessionId,
    event: 'session_end',
  });
}
