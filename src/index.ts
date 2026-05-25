#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from './config.js'
import { createTools } from './tools/registry.js'
import { AgentLoop } from './agent/loop.js'
import { TUI } from './ui/tui.js'
import { CommandParser } from './ui/commands.js'
import { KeyboardHandler } from './ui/keyboard.js'
import { SessionStorage } from './storage/sessions.js'

const VERSION = '0.1.0'

function loadSystemPrompt(config: ReturnType<typeof loadConfig>): string {
  const agentMdPath = resolve(process.cwd(), 'AGENT.md')
  let base = `Você é ChinaCode CLI v${VERSION}, um agente de codificação autônomo.
Trabalhe no diretório: ${config.workspaceDir}
Seja direto, eficiente e cite sempre os arquivos que modificar.`

  if (existsSync(agentMdPath)) {
    try {
      const agentMd = readFileSync(agentMdPath, 'utf-8')
      base = `${agentMd}\n\n---\nDiretório de trabalho: ${config.workspaceDir}`
    } catch {
      // ignore
    }
  }

  return base
}

async function main(): Promise<void> {
  const config = loadConfig()
  const tools = createTools(config.workspaceDir)
  const storage = new SessionStorage()
  const tui = new TUI(config)
  const systemPrompt = loadSystemPrompt(config)
  const loop = new AgentLoop(config, tui, tools, systemPrompt)
  const commands = new CommandParser(config, tui, loop, storage)

  const sessionId = storage.createSession(process.cwd(), config.models.default.model)
  const startTime = Date.now()
  let interactionCount = 0

  tui.showHeader()
  process.stdout.write('  ChinaCode CLI v' + VERSION + ' — pronto. Digite /help para ajuda.\n\n')

  let running = true

  const keyboard = new KeyboardHandler(
    () => {
      loop.cancel()
    },
    () => {
      running = false
    },
  )
  keyboard.attach()

  while (running) {
    let input: string
    try {
      input = await tui.prompt()
    } catch {
      break
    }

    const trimmed = input.trim()
    if (!trimmed) continue

    if (commands.isCommand(trimmed)) {
      const shouldContinue = await commands.execute(trimmed)
      if (!shouldContinue) {
        running = false
        break
      }
    } else {
      await loop.run(trimmed)
      interactionCount++

      if (interactionCount % 10 === 0) {
        storage.updateSession(sessionId, loop.state.messages, loop.costTracker.totalCost)
      }
    }
  }

  storage.updateSession(sessionId, loop.state.messages, loop.costTracker.totalCost)
  storage.close()
  keyboard.detach()

  const duration = Date.now() - startTime
  tui.showSessionSummary(loop.costTracker.totalCost, duration, loop.state.messages.length)
  process.exit(0)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
