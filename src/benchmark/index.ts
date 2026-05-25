import type { TokenUsage } from "../types.js";

export interface BenchmarkTask {
	id: string;
	prompt: string;
	expected?: string;
	metadata?: Record<string, unknown>;
}

export interface BenchmarkModel {
	name: string;
	inputCostPer1M?: number;
	outputCostPer1M?: number;
	metadata?: Record<string, unknown>;
}

export interface BenchmarkRunInput {
	model: BenchmarkModel;
	task: BenchmarkTask;
}

export interface BenchmarkRunOutput {
	content: string;
	usage: TokenUsage;
	costUsd?: number;
	metadata?: Record<string, unknown>;
}

export type BenchmarkRunner = (
	input: BenchmarkRunInput,
) => Promise<BenchmarkRunOutput>;

export interface BenchmarkScoreInput {
	task: BenchmarkTask;
	model: BenchmarkModel;
	output: BenchmarkRunOutput;
}

export type BenchmarkScorer = (input: BenchmarkScoreInput) => number;

export interface BenchmarkResult {
	taskId: string;
	model: string;
	content: string;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	costUsd: number;
	durationMs: number;
	qualityScore: number;
	metadata?: Record<string, unknown>;
}

export interface BenchmarkOptions {
	models: BenchmarkModel[];
	task: BenchmarkTask;
	runner: BenchmarkRunner;
	scorer?: BenchmarkScorer;
	now?: () => number;
}

export async function runBenchmark(
	options: BenchmarkOptions,
): Promise<BenchmarkResult[]> {
	const {
		models,
		task,
		runner,
		scorer = defaultBenchmarkScorer,
		now = Date.now,
	} = options;

	if (models.length === 0) {
		throw new Error("runBenchmark requires at least one model");
	}

	const results: BenchmarkResult[] = [];

	for (const model of models) {
		const startedAt = now();
		const output = await runner({ model, task });
		const durationMs = Math.max(0, now() - startedAt);
		const costUsd = output.costUsd ?? estimateCost(model, output.usage);
		const qualityScore = clampScore(scorer({ task, model, output }));

		results.push({
			taskId: task.id,
			model: model.name,
			content: output.content,
			inputTokens: output.usage.inputTokens,
			outputTokens: output.usage.outputTokens,
			totalTokens: output.usage.inputTokens + output.usage.outputTokens,
			costUsd,
			durationMs,
			qualityScore,
			metadata: output.metadata,
		});
	}

	return results;
}

export function estimateCost(model: BenchmarkModel, usage: TokenUsage): number {
	const inputCost =
		((model.inputCostPer1M ?? 0) * usage.inputTokens) / 1_000_000;
	const outputCost =
		((model.outputCostPer1M ?? 0) * usage.outputTokens) / 1_000_000;
	return inputCost + outputCost;
}

export function defaultBenchmarkScorer({
	task,
	output,
}: BenchmarkScoreInput): number {
	if (!task.expected) {
		return output.content.trim().length > 0 ? 0.5 : 0;
	}

	const expectedTokens = tokenizeForScore(task.expected);
	if (expectedTokens.size === 0) return 0;

	const outputTokens = tokenizeForScore(output.content);
	let matches = 0;
	for (const token of expectedTokens) {
		if (outputTokens.has(token)) matches += 1;
	}

	return matches / expectedTokens.size;
}

function tokenizeForScore(text: string): Set<string> {
	const matches = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
	return new Set(matches);
}

function clampScore(score: number): number {
	if (!Number.isFinite(score)) return 0;
	if (score < 0) return 0;
	if (score > 1) return 1;
	return score;
}
