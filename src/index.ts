#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

// Load .env from ~/.chinacode/.env if present
const chinaEnvPath = join(homedir(), '.chinacode', '.env');
if (existsSync(chinaEnvPath)) {
  const lines = readFileSync(chinaEnvPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

import { parseAgentMd } from './config/agent-md-parser.js';
import { buildSystemPrompt } from './config/system-prompt.js';
import { loadSkills, injectSkill } from './config/skills-loader.js';
import { isFirstRun, runOnboardingWizard } from './repl/onboarding.js';
import { createREPL, createCommandRegistry } from './repl/index.js';
import { registerBasicCommands } from './repl/commands/basic.js';
import { registerModelCostCommands } from './repl/commands/model-cost.js';
import { registerSessionCommands } from './repl/commands/sessions.js';
import { runAgent } from './agent/index.js';
import { callModel, resolveDefaultProvider, getProviderConfig } from './models/index.js';
import { createModelClient } from './models/client.js';
import { createToolRegistry } from './tools/index.js';
import { CostTracker } from './cost/tracker.js';
import { getPrice } from './cost/prices.js';
import { initDB } from './persistence/db.js';
import { createSession, appendMessage, finalizeSession } from './persistence/session-writer.js';
import type { AgentMessage } from './types/agent.js';

const VERSION = '0.1.0';

async function main(): Promise<void> {
  // First-run onboarding
  if (await isFirstRun()) {
    await runOnboardingWizard();
    console.log('');
  }

  // Load agent.md config
  const agentMdConfig = await parseAgentMd(join(process.cwd(), 'agent.md'));
  const systemPrompt = buildSystemPrompt(agentMdConfig);

  // Load skills
  const skillsDir = join(process.cwd(), 'skills');
  const skills = await loadSkills(agentMdConfig.skills, skillsDir);

  // Session setup
  const sessionId = uuidv4();
  const providerName = resolveDefaultProvider();
  const providerCfg = getProviderConfig(providerName);

  const costTracker = new CostTracker(model => {
    const p = getPrice(model);
    return { input: p.input, output: p.output };
  });

  const db = initDB();
  const dbSessionId = createSession(db, {
    model: providerCfg.defaultModel,
    workingDir: process.cwd(),
  });

  const toolRegistry = createToolRegistry({
    workspaceRoot: process.cwd(),
    sandboxEnabled: process.env.SANDBOX_ENABLED === 'true',
  });

  // Build initial message history
  let messages: AgentMessage[] = [{ role: 'system', content: systemPrompt }];
  for (const skill of skills) {
    messages = injectSkill(skill, messages);
  }

  const commandRegistry = createCommandRegistry();

  const repl = createREPL({
    version: VERSION,
    model: providerCfg.defaultModel,
    provider: providerName,
    sandboxEnabled: process.env.SANDBOX_ENABLED === 'true',
    commandRegistry,
    async onInput(input: string) {
      const userMsg: AgentMessage = { role: 'user', content: input };
      messages.push(userMsg);
      appendMessage(db, dbSessionId, userMsg);

      const modelCallFn = (msgs: AgentMessage[], signal?: AbortSignal) =>
        callModel(msgs, { id: sessionId }, signal);

      let finalText = '';
      for await (const event of runAgent(messages, {
        toolRegistry,
        callModel: modelCallFn,
        sessionId,
        maxIterations: parseInt(process.env.MAX_ITERATIONS ?? '15', 10),
        onToken: token => process.stdout.write(token),
        onToolStart: name => repl.setStatus(`Running ${name}…`),
        onToolEnd: (name, result, durationMs) => {
          repl.setStatus('Thinking…');
          console.log(chalk.gray(`\n[${name}] ${durationMs}ms`));
        },
      })) {
        if (event.type === 'done') {
          finalText = event.finalText;
          process.stdout.write('\n');
        } else if (event.type === 'loop_limit') {
          console.log(chalk.yellow(`\nReached maximum iterations (${event.iterations}). Here is what I have so far:`));
        } else if (event.type === 'infinite_loop') {
          console.log(chalk.red(`\n⚠ Infinite loop detected (tool: ${event.tool}). Stopping.`));
        } else if (event.type === 'error') {
          console.error(chalk.red(`\nError: ${event.message}`));
        }
      }

      if (finalText) {
        const assistantMsg: AgentMessage = { role: 'assistant', content: finalText };
        messages.push(assistantMsg);
        appendMessage(db, dbSessionId, assistantMsg);
      }
    },
  });

  const session = {
    id: sessionId,
    model: providerCfg.defaultModel,
    provider: providerName,
    sandboxEnabled: process.env.SANDBOX_ENABLED === 'true',
    localEnabled: process.env.LOCAL_ENABLED === 'true',
  };

  registerBasicCommands(commandRegistry, {
    print: msg => repl.print(msg),
    getMessages: () => messages,
    clearMessages: () => { messages = [{ role: 'system', content: systemPrompt }]; },
    getCostTracker: () => costTracker,
  });

  registerModelCostCommands(commandRegistry, {
    print: msg => repl.print(msg),
    session,
    getCostTracker: () => costTracker,
    getMessages: () => messages,
    updateHeader: () => repl.setHeader({ model: session.model, sandboxEnabled: session.sandboxEnabled }),
  });

  registerSessionCommands(commandRegistry, {
    print: msg => repl.print(msg),
    db,
    currentSession: session,
    loadSessionMessages: (msgs: AgentMessage[]) => { messages = msgs; },
  });

  // Cleanup on exit
  process.on('exit', () => {
    const summary = costTracker.getSessionCost();
    finalizeSession(db, dbSessionId, {
      totalCost: summary.totalCostUSD,
      inputTokens: summary.totalInputTokens,
      outputTokens: summary.totalOutputTokens,
    });
    db.close();
  });

  await repl.start();
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
