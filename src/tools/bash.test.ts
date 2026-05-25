import { describe, it, expect } from 'vitest'
import { bashTool } from './bash.js'

describe('bashTool', () => {
  it('executes a simple echo command', async () => {
    const result = await bashTool.execute({ command: 'echo hello' })
    expect(result.success).toBe(true)
    expect(result.output).toContain('hello')
  })

  it('captures stdout correctly', async () => {
    const result = await bashTool.execute({ command: 'printf "line1\nline2\nline3"' })
    expect(result.success).toBe(true)
    expect(result.output).toContain('line1')
    expect(result.output).toContain('line3')
  })

  it('captures stderr in output', async () => {
    const result = await bashTool.execute({ command: 'echo errormsg >&2; exit 0' })
    expect(result.output).toContain('errormsg')
  })

  it('reports non-zero exit code as failure', async () => {
    const result = await bashTool.execute({ command: 'exit 1' })
    expect(result.success).toBe(false)
    expect(result.output).toContain('Exit code: 1')
  })

  it('reports exit code 2 as failure', async () => {
    const result = await bashTool.execute({ command: 'exit 2' })
    expect(result.success).toBe(false)
    expect(result.output).toContain('Exit code: 2')
  })

  it('handles pipeline commands', async () => {
    const result = await bashTool.execute({ command: 'echo "a b c" | wc -w' })
    expect(result.success).toBe(true)
    expect(result.output.trim()).toContain('3')
  })

  it('handles commands that produce no output', async () => {
    const result = await bashTool.execute({ command: 'true' })
    expect(result.success).toBe(true)
  })

  it('times out slow commands', async () => {
    const result = await bashTool.execute({ command: 'sleep 10', timeout: 150 })
    expect(result.success).toBe(false)
    expect(result.output).toContain('Timeout')
  }, 3000)

  it('returns failure for unknown commands', async () => {
    const result = await bashTool.execute({ command: 'nonexistent_command_12345_xyz' })
    expect(result.success).toBe(false)
  })

  it('executes multi-line scripts', async () => {
    const result = await bashTool.execute({
      command: 'x=1\ny=2\necho $((x + y))',
    })
    expect(result.success).toBe(true)
    expect(result.output.trim()).toContain('3')
  })

  it('uses default 60s timeout when not specified', async () => {
    // Just verify it doesn't reject quickly for a fast command
    const result = await bashTool.execute({ command: 'echo fast' })
    expect(result.success).toBe(true)
  })
})
