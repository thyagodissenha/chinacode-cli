import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { CostTracker } from './tracker.js';
import type { AgentMessage } from '../types/agent.js';

export async function exportSession(
  tracker: CostTracker,
  messages: AgentMessage[],
  format: 'json' | 'csv' = 'json',
): Promise<string> {
  const cost = tracker.getSessionCost();
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `chinacode-export-${date}.${format}`;
  const filePath = join(process.cwd(), fileName);

  const turns = messages
    .filter(m => m.role === 'assistant')
    .map((m, i) => ({
      turn: i + 1,
      model: 'unknown',
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      timestamp: new Date().toISOString(),
    }));

  if (format === 'json') {
    const data = {
      session: {
        started_at: cost.startedAt.toISOString(),
        duration_s: Math.round((Date.now() - cost.startedAt.getTime()) / 1000),
      },
      turns,
      totals: {
        input_tokens: cost.totalInputTokens,
        output_tokens: cost.totalOutputTokens,
        total_cost_usd: cost.totalCostUSD,
      },
    };
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } else {
    const header = 'turn,model,input_tokens,output_tokens,cost_usd,timestamp';
    const rows = turns.map(t =>
      `${t.turn},${t.model},${t.input_tokens},${t.output_tokens},${t.cost_usd},${t.timestamp}`,
    );
    await writeFile(filePath, [header, ...rows].join('\n'), 'utf8');
  }

  return filePath;
}
