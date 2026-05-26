import type { CostTracker } from '../cost/tracker.js';

export interface StatusBarData {
  tokens: { input: number; output: number };
  sessionCostUSD: number;
  estimated: boolean;
}

export function formatStatusBar(data: StatusBarData): string {
  const costStr = data.sessionCostUSD < 0.00005
    ? '< $0.0001'
    : `$${data.sessionCostUSD.toFixed(4)}`;

  const estimatedMark = data.estimated ? ' (est.)' : '';
  return `tokens: ${data.tokens.input} in / ${data.tokens.output} out | session: ${costStr}${estimatedMark}`;
}

export function updateStatusBar(tracker: CostTracker): string {
  const cost = tracker.getSessionCost();
  const hasEstimated = Object.values(cost.models).some(m => m.estimatedTokens);

  return formatStatusBar({
    tokens: { input: cost.totalInputTokens, output: cost.totalOutputTokens },
    sessionCostUSD: cost.totalCostUSD,
    estimated: hasEstimated,
  });
}
