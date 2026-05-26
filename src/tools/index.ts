import { ToolRegistry } from './registry.js';
import { bashTool } from './bash.js';
import { sandboxTool } from './sandbox.js';
import { readFileTool } from './read-file.js';
import { globSearchTool } from './glob-search.js';
import { grepSearchTool } from './grep-search.js';
import { listDirectoryTool } from './list-directory.js';
import { delegateTaskTool } from './delegate-task.js';
import { writeFileTool } from './write-file.js';
import { editFileTool } from './edit-file.js';

export type { Tool, OpenAIToolParam, ToolExecutionResult } from './types.js';
export { ToolRegistry } from './registry.js';
export { renderDiff } from './diff-renderer.js';

export interface ToolRegistryConfig {
  workspaceRoot?: string;
  sandboxEnabled?: boolean;
  sessionAutoApprove?: boolean;
}

export function createToolRegistry(config: ToolRegistryConfig = {}): ToolRegistry {
  if (config.workspaceRoot) {
    process.chdir(config.workspaceRoot);
  }
  if (config.sandboxEnabled) {
    process.env.SANDBOX_ENABLED = 'true';
  }

  const registry = new ToolRegistry();

  // Use sandbox-aware bash when sandbox is enabled, otherwise plain bash
  registry.register(config.sandboxEnabled ? sandboxTool : bashTool);
  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(editFileTool);
  registry.register(globSearchTool);
  registry.register(grepSearchTool);
  registry.register(listDirectoryTool);
  registry.register(delegateTaskTool);

  return registry;
}
