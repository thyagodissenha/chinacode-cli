import { spawn } from 'node:child_process'
import { z } from 'zod'
import type { Tool, ToolResult } from '../types.js'

const bashSchema = z.object({
  command: z.string(),
  timeout: z.number().default(60000),
})

export const bashTool: Tool = {
  name: 'bash',
  description: 'Execute a shell command and return its output.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in milliseconds', default: 60000 },
    },
    required: ['command'],
  },
  async execute(args: unknown): Promise<ToolResult> {
    try {
      const { command, timeout } = bashSchema.parse(args)
      return await new Promise<ToolResult>((resolve) => {
        const proc = spawn('bash', ['-c', command], { stdio: ['ignore', 'pipe', 'pipe'] })
        let stdout = ''
        let stderr = ''
        let timedOut = false

        const timer = setTimeout(() => {
          timedOut = true
          proc.kill('SIGTERM')
        }, timeout)

        proc.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString()
        })

        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString()
        })

        proc.on('close', (code: number | null) => {
          clearTimeout(timer)
          let output = stdout
          if (stderr.trim().length > 0) {
            output += `\nSTDERR:\n${stderr}`
          }
          if (timedOut) {
            output += `\nTimeout após ${timeout}ms`
          }
          const exitCode = code ?? 1
          if (exitCode !== 0) {
            output += `\nExit code: ${exitCode}`
          }
          resolve({ success: exitCode === 0 && !timedOut, output })
        })

        proc.on('error', (err: Error) => {
          clearTimeout(timer)
          resolve({ success: false, output: '', error: String(err) })
        })
      })
    } catch (err) {
      return { success: false, output: '', error: String(err) }
    }
  },
}
