import chalk from 'chalk';
import type { CommandRegistry, CommandContext } from './dispatcher.js';
import type { CostTracker } from '../../cost/tracker.js';
import type { AgentMessage } from '../../types/agent.js';
import { exportSession } from '../../cost/export.js';

export interface ModelSession {
  id: string;
  model: string;
  provider: string;
  sandboxEnabled: boolean;
  localEnabled: boolean;
}

export interface ModelCostContext extends CommandContext {
  session: ModelSession;
  getCostTracker(): CostTracker;
  getMessages(): AgentMessage[];
  updateHeader: () => void;
}

const MODEL_TABLE = [
  { name: 'qwen-turbo', tier: 'fast', inputPer1M: 0.05, outputPer1M: 0.20 },
  { name: 'qwen-plus', tier: 'default', inputPer1M: 0.40, outputPer1M: 1.20 },
  { name: 'qwen-max', tier: 'default', inputPer1M: 2.40, outputPer1M: 9.60 },
  { name: 'qwen3-max', tier: 'reasoning', inputPer1M: 1.10, outputPer1M: 4.40 },
  { name: 'deepseek-chat', tier: 'default', inputPer1M: 0.27, outputPer1M: 1.10 },
  { name: 'deepseek-reasoner', tier: 'reasoning', inputPer1M: 0.55, outputPer1M: 2.19 },
];

export function registerModelCostCommands(registry: CommandRegistry, context: ModelCostContext): void {
  registry.register(
    'model',
    async (args, ctx) => {
      if (args[0] === 'list') {
        const header = chalk.bold('Model             Tier       In/1M  Out/1M');
        const rows = MODEL_TABLE.map(m =>
          `${m.name.padEnd(18)}${m.tier.padEnd(11)}$${m.inputPer1M.toFixed(2).padEnd(7)}$${m.outputPer1M.toFixed(2)}`
        );
        ctx.print([header, ...rows].join('\n'));
        return;
      }
      if (args[0]) {
        context.session.model = args[0];
        context.updateHeader();
        ctx.print(`✓ Model switched to: ${args[0]}`);
      } else {
        ctx.print(`Current model: ${context.session.model}`);
      }
    },
    [],
    'Switch model or list available models (/model list)',
  );

  registry.register(
    'sandbox',
    (args, ctx) => {
      const enable = args[0] === 'on';
      context.session.sandboxEnabled = enable;
      process.env.SANDBOX_ENABLED = enable ? 'true' : 'false';
      context.updateHeader();
      ctx.print(`Sandbox: ${enable ? 'enabled' : 'disabled'}`);
    },
    [],
    'Toggle Docker sandbox (on/off)',
  );

  registry.register(
    'local',
    (args, ctx) => {
      const enable = args[0] === 'on';
      context.session.localEnabled = enable;
      process.env.LOCAL_ENABLED = enable ? 'true' : 'false';
      context.updateHeader();
      ctx.print(`Local models: ${enable ? 'enabled' : 'disabled'}`);
    },
    [],
    'Toggle Ollama local model routing (on/off)',
  );

  registry.register(
    'cost',
    (_, ctx) => {
      const cost = context.getCostTracker().getSessionCost();
      const lines = [chalk.bold('── Cost Summary ─────────────────────')];
      for (const [model, usage] of Object.entries(cost.models)) {
        lines.push(`  ${model}: ${usage.inputTokens}in / ${usage.outputTokens}out = $${usage.costUSD.toFixed(4)}`);
      }
      lines.push(`  Total: $${cost.totalCostUSD.toFixed(4)}`);
      ctx.print(lines.join('\n'));
    },
    [],
    'Show session cost breakdown',
  );

  registry.register(
    'export',
    async (args, ctx) => {
      const format = args[0] === 'csv' ? 'csv' : 'json';
      const path = await exportSession(context.getCostTracker(), context.getMessages(), format);
      ctx.print(`Exported to: ${path}`);
    },
    [],
    'Export session data to JSON or CSV (/export csv)',
  );
}
