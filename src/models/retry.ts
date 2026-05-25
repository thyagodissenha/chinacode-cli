/**
 * Retry helpers para uso no AgentLoop.
 * Uso: await sleep(calcRetryDelay(attempt)) entre tentativas de erro retryable.
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export { calcRetryDelay } from "./router.js";
