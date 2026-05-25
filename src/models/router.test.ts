import { describe, it, expect } from 'vitest'
import { ModelRouter } from './router.js'
import type { ModelConfig } from '../types.js'

const defaultModel: ModelConfig = {
  provider: 'dashscope',
  model: 'qwen-plus',
  baseUrl: 'https://dashscope.aliyuncs.com/v1',
  apiKey: 'test-key',
}

const fastModel: ModelConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: 'test-key',
}

const reasoningModel: ModelConfig = {
  provider: 'dashscope',
  model: 'qwen-max',
  baseUrl: 'https://dashscope.aliyuncs.com/v1',
  apiKey: 'test-key',
}

describe('ModelRouter.select', () => {
  it('returns default model for generic input', () => {
    const router = new ModelRouter({ default: defaultModel })
    expect(router.select('write a function').model).toBe('qwen-plus')
  })

  it('returns reasoning model for "debug" input when configured', () => {
    const router = new ModelRouter({ default: defaultModel, reasoning: reasoningModel })
    expect(router.select('debug this issue').model).toBe('qwen-max')
  })

  it('returns reasoning model for "explain" input', () => {
    const router = new ModelRouter({ default: defaultModel, reasoning: reasoningModel })
    expect(router.select('explain the architecture').model).toBe('qwen-max')
  })

  it('returns fast model for "read" input when configured', () => {
    const router = new ModelRouter({ default: defaultModel, fast: fastModel })
    expect(router.select('read this file').model).toBe('deepseek-chat')
  })

  it('returns fast model for "list" input', () => {
    const router = new ModelRouter({ default: defaultModel, fast: fastModel })
    expect(router.select('list all files').model).toBe('deepseek-chat')
  })

  it('falls back to default when reasoning model not configured', () => {
    const router = new ModelRouter({ default: defaultModel })
    expect(router.select('debug this').model).toBe('qwen-plus')
  })

  it('falls back to default when fast model not configured', () => {
    const router = new ModelRouter({ default: defaultModel })
    expect(router.select('read the file').model).toBe('qwen-plus')
  })
})

describe('ModelRouter — circuit breaker', () => {
  it('opens circuit after 5 consecutive failures', () => {
    const router = new ModelRouter({ default: defaultModel, fast: fastModel })
    for (let i = 0; i < 5; i++) {
      router.recordFailure(defaultModel)
    }
    // default circuit open → should fall back to fast for generic input
    const selected = router.select('write some code')
    expect(selected.model).toBe('deepseek-chat')
  })

  it('does not open circuit before 5 failures', () => {
    const router = new ModelRouter({ default: defaultModel })
    for (let i = 0; i < 4; i++) {
      router.recordFailure(defaultModel)
    }
    expect(router.select('write some code').model).toBe('qwen-plus')
  })

  it('resets circuit on success', () => {
    const router = new ModelRouter({ default: defaultModel, fast: fastModel })
    for (let i = 0; i < 5; i++) {
      router.recordFailure(defaultModel)
    }
    router.recordSuccess(defaultModel)
    expect(router.select('write some code').model).toBe('qwen-plus')
  })

  it('returns default as last resort when all circuits open', () => {
    const router = new ModelRouter({ default: defaultModel })
    for (let i = 0; i < 5; i++) {
      router.recordFailure(defaultModel)
    }
    // No fallback configured — must return default even if open
    const selected = router.select('write some code')
    expect(selected.model).toBe('qwen-plus')
  })
})

describe('ModelRouter.setDefault', () => {
  it('updates the default model', () => {
    const router = new ModelRouter({ default: defaultModel })
    router.setDefault('qwen-turbo', 'https://dashscope.aliyuncs.com/v1', 'new-key')
    expect(router.select('hello').model).toBe('qwen-turbo')
  })

  it('preserves other fields when updating default', () => {
    const router = new ModelRouter({ default: defaultModel })
    router.setDefault('qwen-turbo', 'https://dashscope.aliyuncs.com/v1', 'new-key')
    const selected = router.select('hello')
    expect(selected.apiKey).toBe('new-key')
    expect(selected.baseUrl).toBe('https://dashscope.aliyuncs.com/v1')
  })
})

describe('ModelRouter.getClient', () => {
  it('returns a client with correct model config', () => {
    const router = new ModelRouter({ default: defaultModel })
    const client = router.getClient(defaultModel)
    expect(client).toBeDefined()
    expect(client.config.model).toBe('qwen-plus')
    expect(client.config.provider).toBe('dashscope')
  })
})
