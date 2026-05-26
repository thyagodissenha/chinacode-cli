import chalk from 'chalk';

export interface LayoutConfig {
  version: string;
  model: string;
  provider: string;
  sandboxEnabled: boolean;
}

export function renderHeader(config: LayoutConfig): string {
  const sandbox = config.sandboxEnabled ? chalk.green('sandbox: on') : chalk.gray('sandbox: off');
  return chalk.bold(`ChinaCode CLI v${config.version}`) + ` | model: ${chalk.cyan(config.model)} | ${sandbox}`;
}

export function clearScreen(): void {
  process.stdout.write('\x1B[2J\x1B[0;0H');
}
