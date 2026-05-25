import { describe, expect, it } from "vitest";
import { CostTracker } from "./tracker.js";

describe("CostTracker", () => {
	it("starts with zero cost and tokens", () => {
		const tracker = new CostTracker(0.8, 2.4);
		expect(tracker.totalCost).toBe(0);
		expect(tracker.totalTokens).toEqual({ inputTokens: 0, outputTokens: 0 });
		expect(tracker.entries).toHaveLength(0);
	});

	it("calculates input and output cost correctly", () => {
		const tracker = new CostTracker(1.0, 2.0);
		const entry = tracker.add("qwen-plus", {
			inputTokens: 1_000_000,
			outputTokens: 500_000,
		});
		expect(entry.inputCost).toBeCloseTo(1.0);
		expect(entry.outputCost).toBeCloseTo(1.0);
		expect(entry.totalCost).toBeCloseTo(2.0);
	});

	it("accumulates multiple entries", () => {
		const tracker = new CostTracker(1.0, 2.0);
		tracker.add("qwen-plus", { inputTokens: 100, outputTokens: 200 });
		tracker.add("qwen-plus", { inputTokens: 300, outputTokens: 400 });
		const tokens = tracker.totalTokens;
		expect(tokens.inputTokens).toBe(400);
		expect(tokens.outputTokens).toBe(600);
		expect(tracker.entries).toHaveLength(2);
	});

	it("returns entry with correct model and timestamp", () => {
		const tracker = new CostTracker(0.8, 2.4);
		const before = Date.now();
		const entry = tracker.add("qwen-max", {
			inputTokens: 1000,
			outputTokens: 500,
		});
		expect(entry.model).toBe("qwen-max");
		expect(entry.inputTokens).toBe(1000);
		expect(entry.outputTokens).toBe(500);
		expect(entry.timestamp).toBeGreaterThanOrEqual(before);
	});

	it("totalCost sums all entries", () => {
		const tracker = new CostTracker(1.0, 2.0);
		tracker.add("qwen-plus", { inputTokens: 1_000_000, outputTokens: 0 });
		tracker.add("qwen-plus", { inputTokens: 0, outputTokens: 1_000_000 });
		expect(tracker.totalCost).toBeCloseTo(3.0);
	});

	it("formatCost returns $0.0000 for tiny amounts", () => {
		expect(CostTracker.formatCost(0.000001)).toBe("$0.0000");
	});

	it("formatCost formats normal amounts with 4 decimals", () => {
		expect(CostTracker.formatCost(0.0015)).toBe("$0.0015");
		expect(CostTracker.formatCost(1.2345)).toBe("$1.2345");
	});

	it("toCSV includes header and data rows", () => {
		const tracker = new CostTracker(1.0, 2.0);
		tracker.add("qwen-plus", { inputTokens: 1000, outputTokens: 500 });
		const csv = tracker.toCSV();
		expect(csv).toContain("model,inputTokens,outputTokens");
		expect(csv).toContain("qwen-plus");
		expect(csv).toContain("1000");
	});

	it("toJSON returns valid JSON array", () => {
		const tracker = new CostTracker(1.0, 2.0);
		tracker.add("qwen-plus", { inputTokens: 1000, outputTokens: 500 });
		const parsed = JSON.parse(tracker.toJSON()) as unknown[];
		expect(Array.isArray(parsed)).toBe(true);
		expect(parsed).toHaveLength(1);
	});

	it("entries returns a copy that does not mutate internal state", () => {
		const tracker = new CostTracker(1.0, 2.0);
		tracker.add("qwen-plus", { inputTokens: 100, outputTokens: 100 });
		const entries = tracker.entries;
		entries.pop();
		expect(tracker.entries).toHaveLength(1);
	});

	it("handles zero token usage without errors", () => {
		const tracker = new CostTracker(0.8, 2.4);
		const entry = tracker.add("qwen-plus", { inputTokens: 0, outputTokens: 0 });
		expect(entry.totalCost).toBe(0);
		expect(tracker.totalCost).toBe(0);
	});
});
