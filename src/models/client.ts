import OpenAI from 'openai'
import type { ModelConfig, Message, Tool, ToolCall, TokenUsage } from '../types.js'

export class ModelClient {
  private client: OpenAI

  constructor(public readonly config: ModelConfig) {
    this.client = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey })
  }

  async *streamChat(
    messages: Message[],
    tools: Tool[],
    onUsage: (usage: TokenUsage) => void
  ): AsyncGenerator<string | { tool_calls: ToolCall[] }, void, unknown> {
    const openaiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))

    const params: Parameters<typeof this.client.chat.completions.create>[0] = {
      model: this.config.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: true,
      stream_options: { include_usage: true },
      ...(this.config.maxTokens !== undefined && { max_tokens: this.config.maxTokens }),
      ...(this.config.temperature !== undefined && { temperature: this.config.temperature }),
      ...(openaiTools.length > 0 && { tools: openaiTools }),
    }

    const stream = await this.client.chat.completions.create({ ...params, stream: true as const })

    const accumulatedToolCalls: Map<number, {
      id: string
      type: 'function'
      function: { name: string; arguments: string }
    }> = new Map()

    let finishReason: string | null = null

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0]

      if (chunk.usage) {
        onUsage({
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
        })
      }

      if (!choice) continue

      finishReason = choice.finish_reason ?? finishReason

      const delta = choice.delta

      if (delta.content) {
        yield delta.content
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!accumulatedToolCalls.has(idx)) {
            accumulatedToolCalls.set(idx, {
              id: tc.id ?? '',
              type: 'function',
              function: { name: tc.function?.name ?? '', arguments: '' },
            })
          }
          const existing = accumulatedToolCalls.get(idx)!
          if (tc.id) existing.id = tc.id
          if (tc.function?.name) existing.function.name += tc.function.name
          if (tc.function?.arguments) existing.function.arguments += tc.function.arguments
        }
      }

      if (choice.finish_reason === 'tool_calls') {
        const toolCalls: ToolCall[] = Array.from(accumulatedToolCalls.values()).map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        }))
        yield { tool_calls: toolCalls }
      }
    }
  }

  async chat(messages: Message[]): Promise<{ content: string; usage: TokenUsage }> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: false,
      ...(this.config.maxTokens !== undefined && { max_tokens: this.config.maxTokens }),
      ...(this.config.temperature !== undefined && { temperature: this.config.temperature }),
    })

    const content = response.choices[0]?.message?.content ?? ''
    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    }

    return { content, usage }
  }
}
