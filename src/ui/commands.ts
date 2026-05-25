import { join } from 'node:path'
import type { AgentConfig } from '../types.js'
import type { TUI } from './tui.js'
import type { AgentLoop } from '../agent/loop.js'
import type { SessionStorage } from '../storage/sessions.js'
import { loadSkills } from '../skills/loader.js'

const HELP_TEXT = `
Comandos disponíveis:
  /help, /h, /?          Lista todos os comandos
  /model <nome>          Troca o modelo padrão
  /sandbox <on|off>      Liga/desliga sandbox Docker
  /cost, /c              Mostra custo da sessão atual
  /clear, /cls           Limpa o histórico da conversa
  /compact               Sumariza contexto longo (em breve)
  /sessions              Lista sessões anteriores
  /resume <id>           Retoma sessão salva
  /export                Exporta sessão para JSON/CSV
  /exit, /q, /quit       Encerra o CLI
`.trim()

export class CommandParser {
  constructor(
    private config: AgentConfig,
    private tui: TUI,
    private loop: AgentLoop,
    private storage: SessionStorage,
  ) {}

  isCommand(input: string): boolean {
    return input.trimStart().startsWith('/')
  }

  async execute(input: string): Promise<boolean> {
    const trimmed = input.trim()
    const [cmd, ...rest] = trimmed.split(/\s+/)
    const arg = rest.join(' ')

    switch (cmd?.toLowerCase()) {
      case '/help':
      case '/h':
      case '/?': {
        this.tui.showError(HELP_TEXT.replace('✗ ', ''))
        process.stdout.write(HELP_TEXT + '\n')
        const skills = loadSkills(join(this.config.workspaceDir, 'skills'))
        if (skills.length > 0) {
          process.stdout.write('\nSkills disponíveis:\n')
          for (const skill of skills) {
            process.stdout.write(`  ${skill.name.padEnd(20)} ${skill.description}\n`)
          }
          process.stdout.write('\n')
        }
        return true
      }

      case '/cost':
      case '/c': {
        const tracker = this.loop.costTracker
        const tokens = tracker.totalTokens
        process.stdout.write(
          `Custo da sessão: ${tracker.totalCost.toFixed(6)} USD\n` +
          `Tokens: ${tokens.inputTokens} input + ${tokens.outputTokens} output\n`,
        )
        return true
      }

      case '/clear':
      case '/cls':
        this.loop.setMessages([])
        this.tui.clear()
        this.tui.showHeader()
        return true

      case '/model':
      case '/m':
        if (!arg) {
          this.tui.showWarning('Uso: /model <nome>')
          return true
        }
        this.config.models.default.model = arg
        this.tui.showHeader()
        process.stdout.write(`Modelo alterado para: ${arg}\n`)
        return true

      case '/sandbox':
      case '/sb':
        if (arg === 'on') {
          this.config.sandboxEnabled = true
          process.stdout.write('Sandbox Docker: habilitado\n')
        } else if (arg === 'off') {
          this.config.sandboxEnabled = false
          process.stdout.write('Sandbox Docker: desabilitado\n')
        } else {
          this.tui.showWarning('Uso: /sandbox <on|off>')
        }
        return true

      case '/sessions':
        process.stdout.write(this.storage.formatSessionList(this.storage.listSessions()) + '\n')
        return true

      case '/resume': {
        if (!arg) {
          this.tui.showWarning('Uso: /resume <id>')
          return true
        }
        const session = this.storage.getSession(arg)
        if (!session) {
          this.tui.showError(`Sessão não encontrada: ${arg}`)
          return true
        }
        const msgs = JSON.parse(session.messages) as import('../types.js').Message[]
        this.loop.setMessages(msgs)
        process.stdout.write(`Sessão restaurada: ${session.messageCount} mensagens, custo ${session.totalCost.toFixed(4)} USD\n`)
        return true
      }

      case '/export': {
        const tracker = this.loop.costTracker
        const json = tracker.toJSON()
        const csv = tracker.toCSV()
        process.stdout.write('=== JSON ===\n' + json + '\n=== CSV ===\n' + csv + '\n')
        return true
      }

      case '/compact':
        this.tui.showWarning('/compact será implementado na Fase 2 (Intelligence).')
        return true

      case '/exit':
      case '/q':
      case '/quit':
        return false

      default:
        this.tui.showWarning(`Comando desconhecido: ${cmd}. Use /help para ver os comandos.`)
        return true
    }
  }
}
