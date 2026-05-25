import { describe, expect, it } from "vitest";
import {
	type BenchmarkRunner,
	defaultBenchmarkScorer,
	estimateCost,
	runBenchmark,
} from "./index.js";

describe("runBenchmark", () => {
	it("runs each configured model against the same task with an injected runner", async () => {
		const calls: string[] = [];
		const runner: BenchmarkRunner = async ({ model, task }) => {
			calls.push(`${model.name}:${task.prompt}`);
			return {
				content:
					model.name === "fast-model" ? "returns beta" : "returns alpha beta",
				usage: {
					inputTokens: 100,
					outputTokens: model.name === "fast-model" ? 20 : 30,
				},
			};
		};

		let tick = 1_000;
		const results = await runBenchmark({
			task: { id: "task-1", prompt: "solve once", expected: "alpha beta" },
			models: [
				{ name: "fast-model", inputCostPer1M: 1, outputCostPer1M: 2 },
				{ name: "quality-model", inputCostPer1M: 3, outputCostPer1M: 4 },
			],
			runner,
			now: () => {
				tick += 25;
				return tick;
			},
		});

		expect(calls).toEqual([
			"fast-model:solve once",
			"quality-model:solve once",
		]);
		expect(results[0]).toMatchObject({
			taskId: "task-1",
			model: "fast-model",
			content: "returns beta",
			inputTokens: 100,
			outputTokens: 20,
			totalTokens: 120,
			durationMs: 25,
			qualityScore: 0.5,
			metadata: undefined,
		});
		expect(results[0]?.costUsd).toBeCloseTo(0.00014);
		expect(results[1]).toMatchObject({
			taskId: "task-1",
			model: "quality-model",
			content: "returns alpha beta",
			inputTokens: 100,
			outputTokens: 30,
			totalTokens: 130,
			durationMs: 25,
			qualityScore: 1,
			metadata: undefined,
		});
		expect(results[1]?.costUsd).toBeCloseTo(0.00042);
	});

	it("uses runner-provided cost and clamps custom quality scores", async () => {
		const results = await runBenchmark({
			task: { id: "task-2", prompt: "answer" },
			models: [{ name: "model-a", inputCostPer1M: 100, outputCostPer1M: 100 }],
			runner: async () => ({
				content: "ok",
				usage: { inputTokens: 10, outputTokens: 5 },
				costUsd: 0.01,
				metadata: { cached: true },
			}),
			scorer: () => 3,
			now: () => 10,
		});

		expect(results[0]?.costUsd).toBe(0.01);
		expect(results[0]?.qualityScore).toBe(1);
		expect(results[0]?.metadata).toEqual({ cached: true });
	});

	it("rejects an empty model list", async () => {
		await expect(
			runBenchmark({
				task: { id: "task-3", prompt: "answer" },
				models: [],
				runner: async () => ({
					content: "",
					usage: { inputTokens: 0, outputTokens: 0 },
				}),
			}),
		).rejects.toThrow("at least one model");
	});
});

describe("estimateCost", () => {
	it("calculates input and output token cost from per-million prices", () => {
		expect(
			estimateCost(
				{ name: "priced", inputCostPer1M: 2, outputCostPer1M: 10 },
				{ inputTokens: 500_000, outputTokens: 50_000 },
			),
		).toBe(1.5);
	});
});

describe("defaultBenchmarkScorer", () => {
	it("returns a basic non-empty score when there is no expected answer", () => {
		expect(
			defaultBenchmarkScorer({
				task: { id: "task", prompt: "say hi" },
				model: { name: "model" },
				output: {
					content: "hello",
					usage: { inputTokens: 1, outputTokens: 1 },
				},
			}),
		).toBe(0.5);
	});
});
