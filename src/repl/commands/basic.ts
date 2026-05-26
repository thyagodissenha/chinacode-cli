import chalk from 'chalk';
import type { CommandContext, CommandRegistry } from './dispatcher.js';
import type { AgentMessage } from '../../types/agent.js';
import type { CostTracker } from '../../cost/tracker.js';
import { renderSessionSummary } from '../../cost/summary.js';

export interface BasicCommandContext extends CommandContext {
  getMessages(): AgentMessage[];
  clearMessages(): void;
  getCostTracker(): CostTracker;
}

export function registerBasicCommands(registry: CommandRegistry, context: BasicCommandContext): void {
  registry.register(
    'help',
    (_, ctx) => {
      const cmds = registry.getAll();
      const lines = [chalk.bold('Available commands:'), ''];
      for (const cmd of cmds) {
        const aliases = cmd.aliases.length ? ` (${cmd.aliases.map(a => `/${a}`).join(', ')})` : '';
        lines.push(`  ${chalk.cyan(`/${cmd.name}`)}${aliases} — ${cmd.description}`);
      }
      ctx.print(lines.join('\n'));
    },
    ['h', '?'],
    'Show this help message',
  );

  registry.register(
    'exit',
    (_, ctx) => {
      ctx.print(renderSessionSummary(context.getCostTracker()));
      process.exit(0);
    },
    ['q', 'quit'],
    'Exit the CLI (shows session summary)',
  );

  registry.register(
    'clear',
    (_, ctx) => {
      context.clearMessages();
      process.stdout.write('\x1B[2J\x1B[0;0H');
      ctx.print('Context cleared.');
    },
    ['cls'],
    'Clear message history and terminal',
  );

  registry.register(
    'compact',
    (_, ctx) => {
      ctx.print('Context compaction not yet implemented (Phase 2).');
    },
    [],
    'Compact conversation context (Phase 2)',
  );
}
