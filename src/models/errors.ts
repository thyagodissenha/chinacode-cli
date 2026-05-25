import type { ApiError } from '../types.js'

export function parseApiError(error: unknown): ApiError {
  if (error !== null && typeof error === 'object') {
    const e = error as Record<string, unknown>

    if ('status' in e && 'error' in e && e.error !== null && typeof e.error === 'object') {
      const body = e.error as Record<string, unknown>
      const status = Number(e.status)
      const code = String(body.code ?? body.type ?? 'unknown_error')
      const message = String(body.message ?? '')
      const retryable = [429, 500, 502, 503, 504, 408].includes(status)
      return { status, code, message, retryable }
    }

    if (!('status' in e)) {
      return {
        status: 0,
        code: 'network_error',
        message: String(e.message ?? 'Network error'),
        retryable: true,
      }
    }

    const status = Number(e.status)
    const code = String((e as Record<string, unknown>).code ?? 'unknown_error')
    const message = String((e as Record<string, unknown>).message ?? '')
    const retryable = [429, 500, 502, 503, 504, 408, 0].includes(status)
    return { status, code, message, retryable }
  }

  return { status: 0, code: 'network_error', message: String(error), retryable: true }
}

export function formatErrorMessage(err: ApiError): string {
  if (err.status === 401 && (err.code === 'InvalidApiKey' || err.code === 'invalid_api_key')) {
    return '❌ API key inválida ou expirada.\n🔧 Acesse o console do provedor, gere uma nova key e atualize OPENAI_API_KEY no .env'
  }
  if (err.status === 401 && err.code === 'Arrearage') {
    return '❌ Conta com fatura em aberto. Regularize o billing no console do provedor.'
  }
  if (err.status === 429) {
    return '⏳ Rate limit atingido. Aguarde alguns segundos e tente novamente.'
  }
  if (err.status === 400 && err.code === 'context_length_exceeded') {
    return '📏 Contexto excedido. Use /compact para sumarizar o histórico.'
  }
  if (err.status === 400 && err.code === 'model_not_exist') {
    return '🔍 Modelo não encontrado. Verifique o nome em DEFAULT_MODEL no .env.'
  }
  if ([500, 502, 503, 504].includes(err.status)) {
    return '🔧 Erro temporário do servidor. Tentando novamente...'
  }
  return `❌ Erro ${err.status}: ${err.code} — ${err.message}`
}

export function classifyIntent(userInput: string): 'reasoning' | 'fast' | 'default' {
  const lower = userInput.toLowerCase()

  const reasoningKeywords = [
    'debug', 'analys', 'refactor', 'why', 'explain', 'review',
    'think', 'reason', 'investigat', 'architect', 'design',
  ]
  for (const kw of reasoningKeywords) {
    if (lower.includes(kw)) return 'reasoning'
  }

  const fastKeywords = [
    'read', 'list', 'search', 'find', 'show', 'get',
    'ls', 'cat', 'print', 'display',
  ]
  for (const kw of fastKeywords) {
    if (lower.includes(kw)) return 'fast'
  }

  return 'default'
}
