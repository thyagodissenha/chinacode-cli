import readline from 'readline';
import chalk from 'chalk';
import { renderHeader, type LayoutConfig } from './layout.js';
import { showSpinner, stopSpinner, updateSpinner } from './spinner.js';
import { highlightCodeBlocks } from './highlighter.js';
import { parseSlashCommand } from './commands/parser.js';
import { createCommandRegistry, type CommandContext } from './commands/dispatcher.js';

export { createCommandRegistry };
export type { CommandContext };
export type { CommandRegistry } from './commands/dispatcher.js';

export interface REPLConfig extends LayoutConfig {
  onInput: (input: string) => Promise<void>;
  commandRegistry?: ReturnType<typeof createCommandRegistry>;
}

export interface REPL {
  start(): Promise<void>;
  stop(): void;
  print(message: string): void;
  setStatus(text: string): void;
  setHeader(config: Partial<LayoutConfig>): void;
}

export function createREPL(config: REPLConfig): REPL {
  let layoutConfig: LayoutConfig = { ...config };
  const history: string[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    historySize: 100,
  });

  // Track history manually for ↑/↓ navigation
  rl.on('history', (h: string[]) => {
    history.length = 0;
    history.push(...h);
  });

  process.stdout.on('resize', () => {
    printHeader();
  });

  function printHeader(): void {
    process.stdout.write('\x1B[s'); // save cursor
    process.stdout.write('\x1B[0;0H'); // top-left
    process.stdout.write(renderHeader(layoutConfig) + '\n');
    process.stdout.write('\x1B[u'); // restore cursor
  }

  const repl: REPL = {
    async start() {
      console.log(renderHeader(layoutConfig));
      console.log(chalk.gray('Type /help for available commands. Ctrl+C to cancel, Ctrl+C twice to exit.\n'));

      rl.prompt();

      rl.on('line', async (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
          rl.prompt();
          return;
        }

        const parsed = parseSlashCommand(trimmed);
        if (parsed && config.commandRegistry) {
          const ctx: CommandContext = {
            print: (msg: string) => {
              console.log(msg);
              rl.prompt();
            },
          };
          try {
            await config.commandRegistry.dispatch(parsed, ctx);
          } catch (err) {
            console.error(chalk.red(`Command error: ${err instanceof Error ? err.message : String(err)}`));
          }
          rl.prompt();
          return;
        }

        showSpinner('Thinking…');
        (rl as any).__setGenerating?.(true);

        try {
          await config.onInput(trimmed);
        } finally {
          stopSpinner();
          (rl as any).__setGenerating?.(false);
          rl.prompt();
        }
      });

      rl.on('close', () => {
        process.exit(0);
      });

      return new Promise<void>(resolve => {
        rl.once('close', resolve);
      });
    },

    stop() {
      rl.close();
    },

    print(message: string) {
      const highlighted = highlightCodeBlocks(message);
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.log(highlighted);
      rl.prompt(true);
    },

    setStatus(text: string) {
      updateSpinner(text);
    },

    setHeader(partial: Partial<LayoutConfig>) {
      layoutConfig = { ...layoutConfig, ...partial };
      printHeader();
    },
  };

  return repl;
}
