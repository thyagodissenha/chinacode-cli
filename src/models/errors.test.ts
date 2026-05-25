import { describe, it, expect } from 'vitest'
import { parseApiError, formatErrorMessage, classifyIntent } from './errors.js'

describe('parseApiError', () => {
  it('parses standard OpenAI-style error with status and error body', () => {
    const err = { status: 401, error: { code: 'InvalidApiKey', message: 'Invalid API key' } }
    const result = parseApiError(err)
    expect(result.status).toBe(401)
    expect(result.code).toBe('InvalidApiKey')
    expect(result.message).toBe('Invalid API key')
    expect(result.retryable).toBe(false)
  })

  it('marks 429 rate limit as retryable', () => {
    const err = { status: 429, error: { code: 'limit_requests', message: 'Rate limited' } }
    expect(parseApiError(err).retryable).toBe(true)
  })

  it('marks 500 as retryable', () => {
    const err = { status: 500, error: { code: 'internal_error', message: 'Server error' } }
    expect(parseApiError(err).retryable).toBe(true)
  })

  it('marks 502 as retryable', () => {
    const err = { status: 502, error: { code: 'bad_gateway', message: '' } }
    expect(parseApiError(err).retryable).toBe(true)
  })

  it('marks 503 as retryable', () => {
    const err = { status: 503, error: { code: 'service_unavailable', message: '' } }
    expect(parseApiError(err).retryable).toBe(true)
  })

  it('marks 401 as not retryable', () => {
    const err = { status: 401, error: { code: 'InvalidApiKey', message: '' } }
    expect(parseApiError(err).retryable).toBe(false)
  })

  it('marks 400 as not retryable', () => {
    const err = { status: 400, error: { code: 'InvalidParameter', message: '' } }
    expect(parseApiError(err).retryable).toBe(false)
  })

  it('treats missing status as network error (retryable)', () => {
    const err = { message: 'ECONNREFUSED' }
    const result = parseApiError(err)
    expect(result.code).toBe('network_error')
    expect(result.retryable).toBe(true)
  })

  it('handles plain string errors', () => {
    const result = parseApiError('some string error')
    expect(result.code).toBe('network_error')
    expect(result.retryable).toBe(true)
    expect(result.message).toContain('some string error')
  })

  it('handles null gracefully', () => {
    const result = parseApiError(null)
    expect(result.code).toBe('network_error')
    expect(result.retryable).toBe(true)
  })

  it('uses type field when code is absent', () => {
    const err = { status: 400, error: { type: 'invalid_request_error', message: 'bad input' } }
    const result = parseApiError(err)
    expect(result.code).toBe('invalid_request_error')
  })
})

describe('formatErrorMessage', () => {
  it('formats InvalidApiKey with actionable message', () => {
    const msg = formatErrorMessage({ status: 401, code: 'InvalidApiKey', message: '', retryable: false })
    expect(msg).toContain('API key inválida')
    expect(msg).toContain('OPENAI_API_KEY')
  })

  it('formats invalid_api_key with actionable message', () => {
    const msg = formatErrorMessage({ status: 401, code: 'invalid_api_key', message: '', retryable: false })
    expect(msg).toContain('API key inválida')
  })

  it('formats Arrearage billing issue', () => {
    const msg = formatErrorMessage({ status: 401, code: 'Arrearage', message: '', retryable: false })
    expect(msg).toContain('billing')
  })

  it('formats 429 rate limit', () => {
    const msg = formatErrorMessage({ status: 429, code: 'limit_requests', message: '', retryable: true })
    expect(msg).toContain('Rate limit')
  })

  it('formats context_length_exceeded with /compact hint', () => {
    const msg = formatErrorMessage({ status: 400, code: 'context_length_exceeded', message: '', retryable: false })
    expect(msg).toContain('/compact')
  })

  it('formats model_not_exist with env var hint', () => {
    const msg = formatErrorMessage({ status: 400, code: 'model_not_exist', message: '', retryable: false })
    expect(msg).toContain('DEFAULT_MODEL')
  })

  it('formats 500 server error with retry message', () => {
    const msg = formatErrorMessage({ status: 500, code: 'internal_error', message: '', retryable: true })
    expect(msg).toContain('Tentando novamente')
  })

  it('formats 503 server error with retry message', () => {
    const msg = formatErrorMessage({ status: 503, code: 'service_unavailable', message: '', retryable: true })
    expect(msg).toContain('Tentando novamente')
  })

  it('formats unknown errors generically with status code', () => {
    const msg = formatErrorMessage({ status: 418, code: 'teapot', message: 'I am a teapot', retryable: false })
    expect(msg).toContain('418')
    expect(msg).toContain('teapot')
    expect(msg).toContain('I am a teapot')
  })
})

describe('classifyIntent', () => {
  it('classifies "debug" as reasoning', () => {
    expect(classifyIntent('debug this function')).toBe('reasoning')
  })

  it('classifies "explain" as reasoning', () => {
    expect(classifyIntent('explain how this works')).toBe('reasoning')
  })

  it('classifies "analyse" as reasoning', () => {
    expect(classifyIntent('analyse the performance bottleneck')).toBe('reasoning')
  })

  it('classifies "refactor" as reasoning', () => {
    expect(classifyIntent('refactor this module')).toBe('reasoning')
  })

  it('classifies "review" as reasoning', () => {
    expect(classifyIntent('review the pull request')).toBe('reasoning')
  })

  it('classifies "architect" as reasoning', () => {
    expect(classifyIntent('architect the new system')).toBe('reasoning')
  })

  it('classifies "read" as fast', () => {
    expect(classifyIntent('read the file')).toBe('fast')
  })

  it('classifies "list" as fast', () => {
    expect(classifyIntent('list all files')).toBe('fast')
  })

  it('classifies "search" as fast', () => {
    expect(classifyIntent('search for the pattern')).toBe('fast')
  })

  it('classifies "show" as fast', () => {
    expect(classifyIntent('show me the content')).toBe('fast')
  })

  it('classifies "find" as fast', () => {
    expect(classifyIntent('find the component')).toBe('fast')
  })

  it('classifies generic input as default', () => {
    expect(classifyIntent('hello')).toBe('default')
    expect(classifyIntent('write a function')).toBe('default')
    expect(classifyIntent('')).toBe('default')
  })

  it('is case-insensitive', () => {
    expect(classifyIntent('DEBUG this issue')).toBe('reasoning')
    expect(classifyIntent('READ the docs')).toBe('fast')
  })
})
