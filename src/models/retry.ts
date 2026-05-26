export interface RetryOptions {
  maxAttempts?: number;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']);
const PERMANENT_STATUS = new Set([400, 401, 403, 404]);

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const anyErr = error as any;
    if (anyErr.status && PERMANENT_STATUS.has(anyErr.status)) return false;
    if (anyErr.status && RETRYABLE_STATUS.has(anyErr.status)) return true;
    if (anyErr.code && RETRYABLE_CODES.has(anyErr.code)) return true;
  }
  return false;
}

function jitter(base: number): number {
  return base + Math.floor(Math.random() * 500) - 250;
}

const BASE_DELAYS = [0, 1000, 4000, 16000];

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === maxAttempts) break;

      const delayMs = jitter(BASE_DELAYS[attempt] ?? 16000);
      const delaySec = Math.round(delayMs / 1000);
      if (options.onRetry) {
        options.onRetry(attempt + 1, delayMs, err);
      } else {
        process.stderr.write(`⟳ Rate limited — retrying in ${delaySec}s (attempt ${attempt + 1}/${maxAttempts})…\n`);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}
