import type { Message } from '../types.js'
import type { ModelClient } from '../models/client.js'

const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'qwen-plus': 131072,
  'qwen-max': 32768,
  'qwen-turbo': 131072,
  'qwen-long': 1000000,
  'deepseek-chat': 65536,
  'deepseek-reasoner': 65536,
  default: 32768,
}

export function estimateTokens(messages: Message[]): number {
  const text = messages
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n')
  return Math.ceil(text.length / 4)
}

export function getContextLimit(model: string): number {
  return MODEL_CONTEXT_LIMITS[model] ?? MODEL_CONTEXT_LIMITS['default']!
}

export function needsCompaction(messages: Message[], model: string): boolean {
  const limit = getContextLimit(model)
  const tokens = estimateTokens(messages)
  return tokens > limit * 0.7
}

export async function compactMessages(
  messages: Message[],
  model: string,
  fastClient: ModelClient,
): Promise<Message[]> {
  const systemMessages = messages.filter((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')

  const TAIL_SIZE = 6
  const tail = nonSystem.slice(-TAIL_SIZE)
  const middle = nonSystem.slice(0, nonSystem.length - TAIL_SIZE)

  if (middle.length === 0) {
    return messages
  }

  const serialized = middle
    .map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
    .join('\n')

  const prompt =
    'Faça um resumo conciso do seguinte histórico de conversa, preservando as informações mais importantes, decisões tomadas e contexto relevante para continuar a tarefa:\n\n' +
    serialized

  const { content } = await fastClient.chat([{ role: 'user', content: prompt }])

  const summaryMessage: Message = {
    role: 'system',
    content: `## Resumo do contexto anterior\n${content}`,
  }

  return [...systemMessages, summaryMessage, ...tail]
}
