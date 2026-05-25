import * as path from 'node:path'
import type { Tool, ModelSet } from '../types.js'
import {
  readFileTool,
  writeFileTool,
  editFileTool,
  globSearchTool,
  grepSearchTool,
  listDirectoryTool,
} from './filesystem.js'
import { bashTool } from './bash.js'
import { createDelegateTool } from './delegate.js'

function resolvePath(base: string, filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath
  return path.resolve(base, filePath)
}

function wrapWithWorkspace(tool: Tool, workspaceDir: string, pathArgKeys: string[]): Tool {
  return {
    ...tool,
    async execute(args: unknown): Promise<Awaited<ReturnType<Tool['execute']>>> {
      const resolvedArgs =
        args !== null && typeof args === 'object'
          ? Object.fromEntries(
              Object.entries(args as Record<string, unknown>).map(([k, v]) => [
                k,
                pathArgKeys.includes(k) && typeof v === 'string'
                  ? resolvePath(workspaceDir, v)
                  : v,
              ]),
            )
          : args
      return tool.execute(resolvedArgs)
    },
  }
}

export function createTools(workspaceDir: string, models?: ModelSet): Tool[] {
  const baseTools: Tool[] = [
    wrapWithWorkspace(readFileTool, workspaceDir, ['path']),
    wrapWithWorkspace(writeFileTool, workspaceDir, ['path']),
    wrapWithWorkspace(editFileTool, workspaceDir, ['path']),
    wrapWithWorkspace(globSearchTool, workspaceDir, ['pattern']),
    wrapWithWorkspace(grepSearchTool, workspaceDir, ['path']),
    wrapWithWorkspace(listDirectoryTool, workspaceDir, ['path']),
    bashTool,
  ]

  if (models) {
    baseTools.push(createDelegateTool(models, baseTools, workspaceDir))
  }

  return baseTools
}
