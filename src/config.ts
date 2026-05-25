import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AgentConfig, ModelConfig, ProviderType } from './types.js'

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

function inferProvider(baseUrl: string): ProviderType {
  if (baseUrl.includes('dashscope')) return 'dashscope'
  if (baseUrl.includes('deepseek')) return 'deepseek'
  if (baseUrl.includes('siliconflow')) return 'siliconflow'
  if (baseUrl.includes('together')) return 'together'
  if (baseUrl.includes('11434')) return 'ollama'
  if (baseUrl.includes('1234')) return 'lmstudio'
  if (baseUrl.includes('8000')) return 'vllm'
  return 'dashscope'
}

function buildModelConfig(model: string, overrideKey?: string): ModelConfig {
  const baseUrl = process.env['OPENAI_BASE_URL'] ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  const apiKey = overrideKey ?? process.env['OPENAI_API_KEY'] ?? ''
  return {
    provider: inferProvider(baseUrl),
    model,
    baseUrl,
    apiKey,
    maxTokens: 8192,
    temperature: 0.6,
  }
}

export function loadConfig(): AgentConfig {
  loadEnvFile()

  const defaultModel = process.env['DEFAULT_MODEL'] ?? 'qwen-plus'
  const reasoningModel = process.env['REASONING_MODEL']
  const fastModel = process.env['FAST_MODEL']
  const localModel = process.env['LOCAL_MODEL']
  const localEnabled = process.env['LOCAL_ENABLED'] === 'true'

  return {
    models: {
      default: buildModelConfig(defaultModel),
      reasoning: reasoningModel ? buildModelConfig(reasoningModel) : undefined,
      fast: fastModel ? buildModelConfig(fastModel) : undefined,
      local: localEnabled && localModel ? {
        ...buildModelConfig(localModel),
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        provider: 'ollama',
      } : undefined,
    },
    sandboxEnabled: process.env['SANDBOX_ENABLED'] !== 'false',
    autoApprove: process.env['AUTO_APPROVE'] === 'true',
    maxIterations: Number(process.env['MAX_ITERATIONS'] ?? 15),
    sessionTimeout: Number(process.env['SESSION_TIMEOUT_MS'] ?? 300_000),
    workspaceDir: resolve(process.cwd(), process.env['WORKSPACE_DIR'] ?? '.'),
  }
}

export function getPricing(): { inputPer1M: number; outputPer1M: number } {
  loadEnvFile()
  return {
    inputPer1M: Number(process.env['PRICE_INPUT'] ?? 0.8),
    outputPer1M: Number(process.env['PRICE_OUTPUT'] ?? 2.4),
  }
}
