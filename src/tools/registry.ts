import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool, OpenAIToolParam } from './types.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return [...this.tools.values()];
  }

  toOpenAIFormat(): OpenAIToolParam[] {
    return this.getAll().map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.parameters, { target: 'openApi3' }) as Record<string, unknown>,
      },
    }));
  }
}
