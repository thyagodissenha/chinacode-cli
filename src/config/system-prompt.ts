import type { AgentMdConfig } from './agent-md-parser.js';

export const BUILTIN_SYSTEM_PROMPT = `You are ChinaCode, an expert autonomous coding agent built for developers who value transparency and control.

You have access to tools to read files, execute commands, search code, and write/edit files.

Always reason about the task before using tools. Be precise and minimal in your changes. When executing commands, prefer safe operations over destructive ones. When in doubt, ask for clarification.

You must always provide a final text response summarizing what you did and what the result was.`;

export function buildSystemPrompt(config: AgentMdConfig, builtinPrompt: string = BUILTIN_SYSTEM_PROMPT): string {
  const parts: string[] = [];

  if (config.identity) {
    parts.push(config.identity);
  }

  parts.push(builtinPrompt);

  if (config.rules) {
    parts.push(`\n## Rules\n${config.rules}`);
  }

  return parts.join('\n\n');
}
