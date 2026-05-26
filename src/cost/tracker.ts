export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedTokens: boolean;
}

export interface SessionCost {
  models: Record<string, ModelUsage & { costUSD: number }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  startedAt: Date;
}

export interface TurnCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  estimated: boolean;
}

export class CostTracker {
  private usage: Map<string, ModelUsage> = new Map();
  private getPriceForModel: (model: string) => { input: number; output: number };
  readonly startedAt = new Date();

  constructor(priceResolver?: (model: string) => { input: number; output: number }) {
    this.getPriceForModel = priceResolver ?? (() => ({ input: 0, output: 0 }));
  }

  addUsage(model: string, inputTokens: number, outputTokens: number, estimated = false): void {
    const existing = this.usage.get(model) ?? { inputTokens: 0, outputTokens: 0, estimatedTokens: false };
    this.usage.set(model, {
      inputTokens: existing.inputTokens + inputTokens,
      outputTokens: existing.outputTokens + outputTokens,
      estimatedTokens: existing.estimatedTokens || estimated,
    });
  }

  getSessionCost(): SessionCost {
    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;
    const models: SessionCost['models'] = {};

    for (const [model, usage] of this.usage) {
      const price = this.getPriceForModel(model);
      const costUSD = (usage.inputTokens * price.input + usage.outputTokens * price.output) / 1_000_000;
      models[model] = { ...usage, costUSD };
      totalInput += usage.inputTokens;
      totalOutput += usage.outputTokens;
      totalCost += costUSD;
    }

    return { models, totalInputTokens: totalInput, totalOutputTokens: totalOutput, totalCostUSD: totalCost, startedAt: this.startedAt };
  }

  getCostForTurn(model: string, inputTokens: number, outputTokens: number): TurnCost {
    const price = this.getPriceForModel(model);
    const costUSD = (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
    return { model, inputTokens, outputTokens, costUSD, estimated: false };
  }

  estimateFromChars(chars: number): number {
    return Math.ceil(chars / 4);
  }
}
