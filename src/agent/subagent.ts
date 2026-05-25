import type { ModelConfig, Message, Tool } from '../types.js'
import { ModelClient } from '../models/client.js'
import type { Skill } from '../skills/loader.js'

export interface SubagentOptions {
  task: string
  skill?: Skill
  modelConfig: ModelConfig
  tools: Tool[]
  maxIterations?: number
  parentContext?: string
}

export interface SubagentResult {
  success: boolean
  output: string
  iterations: number
  error?: string
}

export async function runSubagent(options: SubagentOptions): Promise<SubagentResult> {
  const { task, skill, modelConfig, tools, maxIterations = 5, parentContext } = options

  const systemParts: string[] = [
    'Você é um subagente especializado. Execute a tarefa abaixo de forma concisa e objetiva.',
    'Retorne apenas o resultado final, sem explicações desnecessárias.',
  ]

  if (skill) {
    systemParts.push(skill.content)
  }

  if (parentContext) {
    systemParts.push(parentContext)
  }

  const systemPrompt = systemParts.join('\n\n')

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: task },
  ]

  const client = new ModelClient(modelConfig)
  let iterations = 0
  let finalOutput = ''

  try {
    while (iterations < maxIterations) {
      iterations++

      let assistantContent = ''
      const toolCallsToExecute: import('../types.js').ToolCall[] = []

      const stream = client.streamChat(messages, tools, () => {
        // no-op: subagentes não rastreiam custos
      })

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          assistantContent += chunk
        } else if ('tool_calls' in chunk) {
          toolCallsToExecute.push(...chunk.tool_calls)
        }
      }

      if (toolCallsToExecute.length > 0) {
        messages.push({
          role: 'assistant',
          content: assistantContent || null,
          tool_calls: toolCallsToExecute,
        })

        for (const toolCall of toolCallsToExecute) {
          const { name, arguments: argsRaw } = toolCall.function
          const tool = tools.find((t) => t.name === name)

          let resultContent: string
          if (!tool) {
            resultContent = `Ferramenta desconhecida: ${name}`
          } else {
            let args: unknown
            try {
              args = JSON.parse(argsRaw)
            } catch {
              args = {}
            }
            const result = await tool.execute(args)
            resultContent = result.success ? result.output : (result.error ?? 'Erro desconhecido')
          }

          messages.push({
            role: 'tool',
            content: resultContent,
            tool_call_id: toolCall.id,
            name,
          })
        }
      } else {
        finalOutput = assistantContent
        break
      }
    }

    if (!finalOutput) {
      finalOutput = `Subagente atingiu o limite de ${maxIterations} iterações sem retornar resultado final.`
    }

    return { success: true, output: finalOutput, iterations }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { success: false, output: '', iterations, error }
  }
}
