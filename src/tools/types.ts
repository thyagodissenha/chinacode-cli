import type { ZodSchema } from 'zod';

export interface ToolExecutionResult {
  content: string;
  error?: string;
  requires_confirmation?: boolean;
}

export interface Tool<TArgs = unknown> {
  name: string;
  description: string;
  parameters: ZodSchema<TArgs>;
  execute(args: TArgs): Promise<string>;
}

export interface OpenAIToolParam {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
