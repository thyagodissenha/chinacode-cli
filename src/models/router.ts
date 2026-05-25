/**
 * calcRetryDelay — backoff exponencial com jitter para uso no AgentLoop.
 *
 * Uso recomendado em loop.ts:
 *   import { calcRetryDelay } from './retry.js'   // ou de './router.js'
 *   // entre tentativas de erro retryable:
 *   await sleep(calcRetryDelay(attempt))           // attempt começa em 0
 */

import type { ModelConfig, ModelSet, CircuitBreaker, CircuitState } from '../types.js'
import { ModelClient } from './client.js'
import { classifyIntent } from './errors.js'

/**
 * Calcula o delay de retry com backoff exponencial e jitter ±30%.
 * @param attempt - índice da tentativa (0-based)
 * @param baseMs  - delay base em ms (padrão 1000)
 * @param maxMs   - delay máximo em ms (padrão 30000)
 * @returns delay em ms (mínimo 500)
 */
export function calcRetryDelay(attempt: number, baseMs = 1000, maxMs = 30000): number {
  const exp = Math.min(baseMs * Math.pow(2, attempt), maxMs)
  const jitter = exp * 0.3 * (Math.random() * 2 - 1)
  return Math.max(500, Math.round(exp + jitter))
}

export class ModelRouter {
  private breakers: Map<string, CircuitBreaker> = new Map()

  constructor(
    private models: ModelSet,
    private log: (msg: string) => void = () => {},
  ) {}

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

  getCircuitState(config: ModelConfig): CircuitState {
    const breaker = this.breakers.get(this.breakerKey(config))
    return breaker?.state ?? 'closed'
  }

  recordSuccess(config: ModelConfig): void {
    const key = this.breakerKey(config)
    const existing = this.breakers.get(key)
    if (existing && existing.state !== 'closed') {
      this.log(`[CB] Circuit CLOSED: ${key} — provedor restaurado`)
    }
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
      this.log(`[CB] Circuit OPEN: ${key} após ${failures} falhas. Probe em 60s`)
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
      this.log(`[CB] Circuit HALF-OPEN: ${key} — enviando probe`)
      return false
    }

    return false
  }
}
