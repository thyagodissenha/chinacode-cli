import chalk from 'chalk';
import type { CostTracker } from './tracker.js';

export function renderSessionSummary(tracker: CostTracker): string {
  const cost = tracker.getSessionCost();
  const durationMs = Date.now() - cost.startedAt.getTime();
  const durationSec = Math.round(durationMs / 1000);

  const lines: string[] = ['', chalk.bold('── Session Summary ──────────────────')];
  lines.push(`Duration:  ${durationSec}s`);
  lines.push(`Input:     ${cost.totalInputTokens.toLocaleString()} tokens`);
  lines.push(`Output:    ${cost.totalOutputTokens.toLocaleString()} tokens`);

  for (const [model, usage] of Object.entries(cost.models)) {
    lines.push(`  ${model}: ${usage.inputTokens}in / ${usage.outputTokens}out = $${usage.costUSD.toFixed(4)}`);
  }

  const totalStr = `$${cost.totalCostUSD.toFixed(4)}`;
  let totalLine = `Total:     ${totalStr}`;
  if (cost.totalCostUSD > 5) {
    totalLine = chalk.red(totalLine) + chalk.red(' ⚠ Consider using qwen-turbo for simple tasks');
  } else if (cost.totalCostUSD > 1) {
    totalLine = chalk.yellow(totalLine);
  }
  lines.push(totalLine);
  lines.push(chalk.bold('─────────────────────────────────────'));

  return lines.join('\n');
}
