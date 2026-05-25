import { readFileSync, existsSync } from 'node:fs'
import type { AgentConfig, Message, Tool, ToolCall, LoopState } from '../types.js'
import { extractToolCallsFromMarkdown, toInternalToolCalls, removeJsonBlocks } from './tool-call-parser.js'
import { ModelRouter } from '../models/router.js'
import { sleep, calcRetryDelay } from '../models/retry.js'
import { parseApiError, formatErrorMessage } from '../models/errors.js'
import { SecretsGuard } from '../security/secrets.js'
import { DiffApproval } from '../ui/diff.js'
import { CostTracker } from '../cost/tracker.js'
import { getPricing } from '../config.js'
import { needsCompaction, compactMessages } from './compactor.js'
import type { TUI } from '../ui/tui.js'

export class AgentLoop {
  private messages: Message[] = []
  private router: ModelRouter
  private guard: SecretsGuard
  private diffApproval: DiffApproval
  private tracker: CostTracker
  private iteration = 0
  private cancelled = false
  private gitContext = ''

  constructor(
    private config: AgentConfig,
    private tui: TUI,
    private tools: Tool[],
    systemPrompt?: string,
  ) {
    this.router = new ModelRouter(config.models)
    this.guard = new SecretsGuard(config.workspaceDir)
    this.diffApproval = new DiffApproval(config.autoApprove)
    const { inputPer1M, outputPer1M } = getPricing()
    this.tracker = new CostTracker(inputPer1M, outputPer1M)

    if (systemPrompt) {
      this.messages.push({ role: 'system', content: systemPrompt })
    }
  }

  cancel(): void {
    this.cancelled = true
  }

  get state(): LoopState {
    return {
      messages: [...this.messages],
      iteration: this.iteration,
      done: false,
      cost: this.tracker.totalCost,
    }
  }

  get costTracker(): CostTracker {
    return this.tracker
  }

  setMessages(messages: Message[]): void {
    this.messages = messages
  }

  setGitContext(gitSection: string): void {
    this.gitContext = gitSection
  }

  async run(userInput: string): Promise<void> {
    this.cancelled = false
    this.iteration = 0

    // Inject git context as a system note if available
    if (this.gitContext) {
      const existing = this.messages.findIndex(m => m.role === 'system' && m.content?.startsWith('## Git Context'))
      if (existing >= 0) {
        this.messages[existing] = { role: 'system', content: this.gitContext }
      } else {
        this.messages.push({ role: 'system', content: this.gitContext })
      }
    }

    this.messages.push({ role: 'user', content: userInput })

    const modelConfig = this.router.select(userInput)

    while (this.iteration < this.config.maxIterations && !this.cancelled) {
      this.iteration++

      if (needsCompaction(this.messages, modelConfig.model)) {
        this.tui.showWarning('📦 Contexto próximo do limite — compactando automaticamente...')
        const fastConfig = this.config.models.fast ?? modelConfig
        const fastClient = this.router.getClient(fastConfig)
        this.messages = await compactMessages(this.messages, modelConfig.model, fastClient)
        this.tui.showWarning('✓ Contexto compactado.')
      }

      const client = this.router.getClient(modelConfig)

      try {
        const toolCallsToExecute: ToolCall[] = []
        let hasContent = false

        const stream = client.streamChat(
          this.messages,
          this.tools,
          (usage) => {
            const entry = this.tracker.add(modelConfig.model, usage)
            const tokens = this.tracker.totalTokens
            this.tui.updateStatus(
              modelConfig.model,
              this.tracker.totalCost,
              tokens.inputTokens + tokens.outputTokens,
            )
            void entry
          },
        )

        let assistantContent = ''

        for await (const chunk of stream) {
          if (this.cancelled) break

          if (typeof chunk === 'string') {
            if (!hasContent) hasContent = true
            assistantContent += chunk
            this.tui.writeToken(chunk)
          } else if ('tool_calls' in chunk) {
            toolCallsToExecute.push(...chunk.tool_calls)
          }
        }

        if (hasContent) {
          this.tui.endStream()
        }

        if (this.cancelled) break

        // Fallback: verificar se o modelo retornou tool calls como blocos JSON em markdown
        if (assistantContent && toolCallsToExecute.length === 0) {
          const fallbackCalls = extractToolCallsFromMarkdown(assistantContent)
          if (fallbackCalls.length > 0) {
            this.tui.showWarning(`⚠ Tool calls detectadas via fallback markdown parser (${fallbackCalls.length} call(s))`)
            toolCallsToExecute.push(...toInternalToolCalls(fallbackCalls))
            // remover os blocos json do assistantContent para não poluir o histórico
            assistantContent = removeJsonBlocks(assistantContent).trim()
          }
        }

        if (toolCallsToExecute.length > 0) {
          this.messages.push({
            role: 'assistant',
            content: assistantContent || null,
            tool_calls: toolCallsToExecute,
          })

          for (const toolCall of toolCallsToExecute) {
            const result = await this.executeTool(toolCall)
            this.messages.push({
              role: 'tool',
              content: result,
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
            })
          }

          this.router.recordSuccess(modelConfig)
        } else {
          if (assistantContent) {
            this.messages.push({ role: 'assistant', content: assistantContent })
          }
          this.router.recordSuccess(modelConfig)
          break
        }
      } catch (err) {
        const apiErr = parseApiError(err)
        this.tui.showError(formatErrorMessage(apiErr))
        this.router.recordFailure(modelConfig)

        if (!apiErr.retryable) break

        if (this.iteration >= this.config.maxIterations) {
          this.tui.showError(`Limite de ${this.config.maxIterations} iterações atingido.`)
          break
        }

        const delay = calcRetryDelay(this.iteration - 1)
        await sleep(delay)
      }
    }

    if (this.iteration >= this.config.maxIterations && !this.cancelled) {
      this.tui.showWarning(`Limite de iterações (${this.config.maxIterations}) atingido.`)
    }
  }

  private async executeTool(toolCall: ToolCall): Promise<string> {
    const { name, arguments: argsRaw } = toolCall.function

    this.tui.showToolCall(name, argsRaw.slice(0, 120))

    const tool = this.tools.find((t) => t.name === name)
    if (!tool) {
      const msg = `Ferramenta desconhecida: ${name}`
      this.tui.showToolResult(name, msg, false)
      return msg
    }

    let args: unknown
    try {
      args = JSON.parse(argsRaw)
    } catch {
      const msg = `Argumentos inválidos (JSON parse error): ${argsRaw.slice(0, 200)}`
      this.tui.showToolResult(name, msg, false)
      return msg
    }

    if (name === 'write_file' || name === 'edit_file') {
      const handled = await this.handleWriteWithApproval(name, args)
      if (handled !== null) return handled
    }

    if (name === 'read_file') {
      const pathArg = (args as Record<string, unknown>)['path']
      if (typeof pathArg === 'string') {
        const blocked = this.guard.checkPath(pathArg)
        if (blocked) {
          this.tui.showToolResult(name, blocked, false)
          return blocked
        }
      }
    }

    if (name === 'bash') {
      const cmd = (args as Record<string, unknown>)['command']
      if (typeof cmd === 'string' && this.guard.isDestructiveCommand(cmd)) {
        const msg = `⚠ Comando destrutivo detectado: "${cmd.slice(0, 80)}". Use /approve para autorizar.`
        this.tui.showWarning(msg)
        return msg
      }
    }

    const result = await tool.execute(args)
    const output = result.success ? result.output : (result.error ?? 'Erro desconhecido')
    this.tui.showToolResult(name, output.slice(0, 300), result.success)
    return output
  }

  private async handleWriteWithApproval(
    toolName: string,
    args: unknown,
  ): Promise<string | null> {
    const a = args as Record<string, unknown>
    const filePath = typeof a['path'] === 'string' ? a['path'] : null
    if (!filePath) return null

    const newContent =
      toolName === 'write_file'
        ? typeof a['content'] === 'string'
          ? a['content']
          : ''
        : null

    if (newContent === null && toolName === 'write_file') return null

    const oldContent = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : null

    const displayContent =
      toolName === 'write_file'
        ? (newContent as string)
        : (() => {
            if (!oldContent) return String(a['new_text'] ?? '')
            return oldContent.replace(
              String(a['old_text'] ?? ''),
              String(a['new_text'] ?? ''),
            )
          })()

    const approval = await this.diffApproval.requestApproval(filePath, oldContent, displayContent)
    if (!approval.approved) {
      return `Escrita cancelada pelo usuário: ${filePath}`
    }
    return null
  }
}
