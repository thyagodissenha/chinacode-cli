import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KeyboardHandler } from './keyboard.js'

describe('KeyboardHandler', () => {
  let onCancel: ReturnType<typeof vi.fn>
  let onExit: ReturnType<typeof vi.fn>
  let handler: KeyboardHandler

  beforeEach(() => {
    onCancel = vi.fn()
    onExit = vi.fn()
    handler = new KeyboardHandler(onCancel, onExit)
  })

  afterEach(() => {
    handler.detach()
  })

  it('constructs without errors', () => {
    expect(handler).toBeDefined()
  })

  it('detach removes listeners without errors', () => {
    handler.attach()
    expect(() => handler.detach()).not.toThrow()
  })

  it('detach without attach does not throw', () => {
    expect(() => handler.detach()).not.toThrow()
  })

  it('calls onCancel on single Ctrl+C', () => {
    // Simulate data event directly by triggering the stdin listener
    handler.attach()
    // Emit Ctrl+C (\x03) on process.stdin
    process.stdin.emit('data', Buffer.from('\x03'))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onExit).not.toHaveBeenCalled()
  })

  it('calls onExit on double Ctrl+C within 800ms', () => {
    handler.attach()
    // First Ctrl+C
    process.stdin.emit('data', Buffer.from('\x03'))
    // Second Ctrl+C immediately after
    process.stdin.emit('data', Buffer.from('\x03'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('second Ctrl+C after 800ms triggers cancel again, not exit', async () => {
    handler.attach()
    process.stdin.emit('data', Buffer.from('\x03'))
    // Wait more than 800ms
    await new Promise(r => setTimeout(r, 850))
    process.stdin.emit('data', Buffer.from('\x03'))
    // onExit should NOT have been called; onCancel should have been called twice
    expect(onExit).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(2)
  }, 2000)

  it('does not call onCancel or onExit for non-special keys after detach', () => {
    handler.attach()
    handler.detach()
    process.stdin.emit('data', Buffer.from('\x03'))
    expect(onCancel).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
  })
})
