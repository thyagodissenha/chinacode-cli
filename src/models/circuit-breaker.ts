export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  provider?: string;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly provider: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 60_000;
    this.provider = options.provider ?? 'provider';
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.cooldownMs) {
        process.stderr.write(`⚠ ${this.provider} is degraded — routing to fallback\n`);
        const err: any = new Error(`Circuit open for ${this.provider}`);
        err.degraded = true;
        throw err;
      }
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.reset();
      }
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === 'half-open') {
      this.state = 'open';
    } else if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}
