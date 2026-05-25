import type { CostEntry, TokenUsage } from "../types.js";

export class CostTracker {
	private _entries: CostEntry[] = [];

	constructor(
		private inputPer1M: number,
		private outputPer1M: number,
	) {}

	add(model: string, usage: TokenUsage): CostEntry {
		const inputCost = (usage.inputTokens / 1_000_000) * this.inputPer1M;
		const outputCost = (usage.outputTokens / 1_000_000) * this.outputPer1M;
		const entry: CostEntry = {
			model,
			inputTokens: usage.inputTokens,
			outputTokens: usage.outputTokens,
			inputCost,
			outputCost,
			totalCost: inputCost + outputCost,
			timestamp: Date.now(),
		};
		this._entries.push(entry);
		return entry;
	}

	get totalCost(): number {
		return this._entries.reduce((sum, e) => sum + e.totalCost, 0);
	}

	get totalTokens(): TokenUsage {
		return this._entries.reduce(
			(acc, e) => ({
				inputTokens: acc.inputTokens + e.inputTokens,
				outputTokens: acc.outputTokens + e.outputTokens,
			}),
			{ inputTokens: 0, outputTokens: 0 },
		);
	}

	get entries(): CostEntry[] {
		return [...this._entries];
	}

	static formatCost(usd: number): string {
		if (usd < 0.0001) return "$0.0000";
		return `$${usd.toFixed(4)}`;
	}

	toCSV(): string {
		const header =
			"model,inputTokens,outputTokens,inputCost,outputCost,totalCost,timestamp";
		const rows = this._entries.map(
			(e) =>
				`${e.model},${e.inputTokens},${e.outputTokens},${e.inputCost.toFixed(6)},${e.outputCost.toFixed(6)},${e.totalCost.toFixed(6)},${e.timestamp}`,
		);
		return [header, ...rows].join("\n");
	}

	toJSON(): string {
		return JSON.stringify(this._entries, null, 2);
	}
}
