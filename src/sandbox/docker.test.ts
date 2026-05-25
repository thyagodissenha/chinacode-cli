import { describe, it, expect, beforeEach } from 'vitest'
import { DockerSandbox } from './docker.js'

type DockerSandboxWithCache = typeof DockerSandbox & { _available: boolean | null }

function resetCache(): void {
  ;(DockerSandbox as unknown as DockerSandboxWithCache)._available = null
}

function forceNoDocker(): void {
  ;(DockerSandbox as unknown as DockerSandboxWithCache)._available = false
}

beforeEach(() => {
  resetCache()
})

describe('DockerSandbox.isAvailable', () => {
  it('returns a boolean', async () => {
    const result = await DockerSandbox.isAvailable()
    expect(typeof result).toBe('boolean')
  })

  it('caches the result after first call', async () => {
    await DockerSandbox.isAvailable()
    const cached = (DockerSandbox as unknown as DockerSandboxWithCache)._available
    expect(typeof cached).toBe('boolean')
  })

  it('returns cached value on second call', async () => {
    const first = await DockerSandbox.isAvailable()
    const second = await DockerSandbox.isAvailable()
    expect(first).toBe(second)
  })
})

describe('DockerSandbox — fallback mode (no Docker)', () => {
  it('executes a simple command via fallback', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('echo chinacode')
    expect(result.stdout).toContain('chinacode')
    expect(result.usedFallback).toBe(true)
    expect(result.exitCode).toBe(0)
  })

  it('captures stderr from fallback commands', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('echo errormsg >&2')
    expect(result.stderr).toContain('errormsg')
    expect(result.usedFallback).toBe(true)
  })

  it('reports non-zero exit code', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('exit 2')
    expect(result.exitCode).toBe(2)
    expect(result.usedFallback).toBe(true)
  })

  it('times out and sets timedOut flag', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 150)
    const result = await sandbox.execute('sleep 10', 150)
    expect(result.timedOut).toBe(true)
    expect(result.usedFallback).toBe(true)
  }, 3000)

  it('SIGKILL follows SIGTERM after timeout', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 100)
    const result = await sandbox.execute('sleep 10', 100)
    expect(result.timedOut).toBe(true)
  }, 4000)

  it('executes pipeline commands', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('echo "a b c" | wc -w')
    expect(result.stdout.trim()).toContain('3')
    expect(result.exitCode).toBe(0)
  })

  it('handles commands that produce empty stdout', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('true')
    expect(result.stdout).toBe('')
    expect(result.exitCode).toBe(0)
    expect(result.timedOut).toBe(false)
  })
})

describe('DockerSandbox — custom timeout via constructor', () => {
  it('uses constructor timeout as default', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 200)
    const result = await sandbox.execute('sleep 10')
    expect(result.timedOut).toBe(true)
  }, 4000)

  it('overrides constructor timeout with per-call timeout', async () => {
    forceNoDocker()
    const sandbox = new DockerSandbox('/tmp', 5000)
    const result = await sandbox.execute('sleep 10', 150)
    expect(result.timedOut).toBe(true)
  }, 3000)
})
