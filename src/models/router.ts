import type { ModelConfig, ModelSet, CircuitBreaker } from '../types.js'
import { ModelClient } from './client.js'
import { classifyIntent } from './errors.js'

export class ModelRouter {
  private breakers: Map<string, CircuitBreaker> = new Map()

  constructor(private models: ModelSet) {}

  select(userInput: string): ModelConfig {
    const intent = classifyIntent(userInput)

    if (intent === 'reasoning' && this.models.reasoning && !this.isOpen(this.models.reasoning)) {
      return this.models.reasoning
    }

    if (intent === 'fast' && this.models.fast && !this.isOpen(this.models.fast)) {
      return this.models.fast
    }

    if (!this.isOpen(this.models.default)) {
      return this.models.default
    }

    if (this.models.fast && !this.isOpen(this.models.fast)) {
      return this.models.fast
    }

    if (this.models.local && !this.isOpen(this.models.local)) {
      return this.models.local
    }

    const all = [
      this.models.reasoning,
      this.models.fast,
      this.models.local,
    ].filter((m): m is ModelConfig => m !== undefined)

    for (const m of all) {
      if (!this.isOpen(m)) return m
    }

    return this.models.default
  }

  setDefault(model: string, baseUrl: string, apiKey: string): void {
    this.models.default = { ...this.models.default, model, baseUrl, apiKey }
  }

  getClient(config: ModelConfig): ModelClient {
    return new ModelClient(config)
  }

  recordSuccess(config: ModelConfig): void {
    const key = this.breakerKey(config)
    this.breakers.set(key, {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      nextProbe: 0,
    })
  }

  recordFailure(config: ModelConfig): void {
    const key = this.breakerKey(config)
    const existing = this.breakers.get(key) ?? {
      state: 'closed' as const,
      failures: 0,
      lastFailure: 0,
      nextProbe: 0,
    }
    const failures = existing.failures + 1
    const now = Date.now()
    if (failures >= 5) {
      this.breakers.set(key, {
        state: 'open',
        failures,
        lastFailure: now,
        nextProbe: now + 60000,
      })
    } else {
      this.breakers.set(key, {
        state: existing.state,
        failures,
        lastFailure: now,
        nextProbe: existing.nextProbe,
      })
    }
  }

  private breakerKey(config: ModelConfig): string {
    return `${config.provider}:${config.baseUrl}`
  }

  private isOpen(config: ModelConfig): boolean {
    const key = this.breakerKey(config)
    const breaker = this.breakers.get(key)
    if (!breaker || breaker.state === 'closed') return false

    if (breaker.state === 'open') {
      if (Date.now() < breaker.nextProbe) return true
      this.breakers.set(key, { ...breaker, state: 'half-open' })
      return false
    }

    return false
  }
}
