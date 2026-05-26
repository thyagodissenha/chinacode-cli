import type { ParsedCommand } from './parser.js';

export type CommandHandler = (args: string[], context: CommandContext) => Promise<void> | void;

export interface CommandContext {
  print: (msg: string) => void;
  [key: string]: unknown;
}

interface CommandEntry {
  handler: CommandHandler;
  aliases: string[];
  description: string;
}

export interface CommandRegistry {
  register(name: string, handler: CommandHandler, aliases?: string[], description?: string): void;
  dispatch(parsed: ParsedCommand, context: CommandContext): Promise<void>;
  getCompletions(partial: string): string[];
  getAll(): Array<{ name: string; aliases: string[]; description: string }>;
}

export function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, CommandEntry>();
  const aliasMap = new Map<string, string>(); // alias → canonical name

  return {
    register(name, handler, aliases = [], description = '') {
      commands.set(name, { handler, aliases, description });
      for (const alias of aliases) {
        aliasMap.set(alias, name);
      }
    },

    async dispatch(parsed, context) {
      const canonical = aliasMap.get(parsed.command) ?? parsed.command;
      const entry = commands.get(canonical);
      if (!entry) {
        context.print(`Unknown command: /${parsed.command}. Type /help.`);
        return;
      }
      await entry.handler(parsed.args, context);
    },

    getCompletions(partial) {
      const all = [...commands.keys(), ...aliasMap.keys()].map(k => `/${k}`);
      return all.filter(k => k.startsWith(partial));
    },

    getAll() {
      return [...commands.entries()].map(([name, entry]) => ({
        name,
        aliases: entry.aliases,
        description: entry.description,
      }));
    },
  };
}
