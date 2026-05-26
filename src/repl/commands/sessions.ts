import chalk from 'chalk';
import type { CommandRegistry, CommandContext } from './dispatcher.js';
import type { AgentMessage } from '../../types/agent.js';
import { listSessions, loadSession, getLastNMessages } from '../../persistence/session-reader.js';
import type { DB } from '../../persistence/db.js';

export interface SessionCommandContext extends CommandContext {
  db: DB;
  currentSession: { id: string; model: string };
  loadSessionMessages(msgs: AgentMessage[]): void;
}

export function registerSessionCommands(registry: CommandRegistry, context: SessionCommandContext): void {
  registry.register(
    'sessions',
    (_, ctx) => {
      const sessions = listSessions(context.db, 20);
      if (sessions.length === 0) {
        ctx.print('No sessions found.');
        return;
      }
      const header = chalk.bold('ID (short)  Date                 Dir              Model      Cost');
      const rows = sessions.map(s => {
        const shortId = s.id.slice(0, 8);
        const date = s.started_at.slice(0, 16);
        const dir = (s.working_dir ?? '').slice(-16).padEnd(16);
        const model = (s.initial_model ?? '').slice(0, 10).padEnd(10);
        const cost = `$${(s.total_cost ?? 0).toFixed(4)}`;
        return `${shortId}  ${date}  ${dir} ${model} ${cost}`;
      });
      ctx.print([header, ...rows].join('\n'));
    },
    [],
    'List recent sessions',
  );

  registry.register(
    'resume',
    (args, ctx) => {
      const sessionId = args[0];
      if (!sessionId) {
        ctx.print('Usage: /resume <session-id>');
        return;
      }

      // Try prefix match
      const all = listSessions(context.db, 100);
      const match = all.find(s => s.id.startsWith(sessionId) || s.id === sessionId);
      if (!match) {
        ctx.print(`Session ${sessionId} not found.`);
        return;
      }

      const session = loadSession(context.db, match.id);
      if (!session) {
        ctx.print(`Session ${sessionId} not found.`);
        return;
      }

      const lastFive = getLastNMessages(session, 5);
      if (match.initial_model !== context.currentSession.model) {
        ctx.print(chalk.yellow(`⚠ Session used model ${match.initial_model}, current model is ${context.currentSession.model}`));
      }
      ctx.print(`Resuming session ${match.id.slice(0, 8)} (${session.messages.length} messages)`);
      ctx.print('Last 5 messages:');
      for (const msg of lastFive) {
        const role = msg.role.padEnd(10);
        const content = ('content' in msg ? msg.content : '') ?? '';
        ctx.print(`  [${role}] ${content?.toString().slice(0, 80)}`);
      }

      context.loadSessionMessages(session.messages);
    },
    [],
    'Resume a previous session by ID',
  );
}
