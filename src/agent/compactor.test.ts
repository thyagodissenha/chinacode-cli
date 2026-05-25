import { describe, expect, it, vi } from "vitest";
import type { ModelClient } from "../models/client.js";
import type { Message } from "../types.js";
import {
	compactMessages,
	estimateTokens,
	getContextLimit,
	needsCompaction,
} from "./compactor.js";

describe("estimateTokens", () => {
	it("returns 0 for empty messages array", () => {
		expect(estimateTokens([])).toBe(0);
	});

	it("estimates tokens as ceil(chars / 4)", () => {
		const messages: Message[] = [{ role: "user", content: "hello" }]; // 5 chars
		expect(estimateTokens(messages)).toBe(2); // ceil(5/4) = 2
	});

	it("counts all messages combined", () => {
		const messages: Message[] = [
			{ role: "user", content: "abcd" }, // 4 chars
			{ role: "assistant", content: "efgh" }, // 4 chars
		];
		// joined: "abcd\nefgh" = 9 chars → ceil(9/4) = 3
		expect(estimateTokens(messages)).toBe(3);
	});

	it("treats null content as empty string", () => {
		const messages: Message[] = [{ role: "assistant", content: null }];
		expect(estimateTokens(messages)).toBe(0);
	});

	it("handles a longer message correctly", () => {
		// 40 chars → ceil(40/4) = 10
		const messages: Message[] = [{ role: "user", content: "a".repeat(40) }];
		expect(estimateTokens(messages)).toBe(10);
	});
});

describe("getContextLimit", () => {
	it("returns 131072 for qwen-plus", () => {
		expect(getContextLimit("qwen-plus")).toBe(131072);
	});

	it("returns 32768 for qwen-max", () => {
		expect(getContextLimit("qwen-max")).toBe(32768);
	});

	it("returns 131072 for qwen-turbo", () => {
		expect(getContextLimit("qwen-turbo")).toBe(131072);
	});

	it("returns 1000000 for qwen-long", () => {
		expect(getContextLimit("qwen-long")).toBe(1000000);
	});

	it("returns 65536 for deepseek-chat", () => {
		expect(getContextLimit("deepseek-chat")).toBe(65536);
	});

	it("returns default 32768 for unknown model", () => {
		expect(getContextLimit("unknown-model")).toBe(32768);
	});

	it("returns 65536 for deepseek-reasoner", () => {
		expect(getContextLimit("deepseek-reasoner")).toBe(65536);
	});
});

describe("needsCompaction", () => {
	it("returns false when tokens are well below limit", () => {
		const messages: Message[] = [{ role: "user", content: "hi" }];
		expect(needsCompaction(messages, "qwen-max")).toBe(false);
	});

	it("returns true when tokens exceed 70% of context limit", () => {
		// qwen-max limit = 32768, 70% = 22937
		// We need more than 22937 tokens = >91748 chars
		const messages: Message[] = [{ role: "user", content: "a".repeat(100000) }];
		expect(needsCompaction(messages, "qwen-max")).toBe(true);
	});

	it("returns false when tokens are exactly at 70% threshold (boundary)", () => {
		// Exactly at boundary should be false (tokens > limit * 0.7)
		const messages: Message[] = [{ role: "user", content: "" }];
		expect(needsCompaction(messages, "qwen-max")).toBe(false);
	});
});

describe("compactMessages", () => {
	function makeFastClient(summaryContent: string): ModelClient {
		return {
			chat: vi.fn().mockResolvedValue({
				content: summaryContent,
				usage: { inputTokens: 10, outputTokens: 20 },
			}),
		} as unknown as ModelClient;
	}

	it("returns messages unchanged when middle is empty (≤6 non-system messages)", async () => {
		const messages: Message[] = [
			{ role: "system", content: "System prompt" },
			{ role: "user", content: "Hello" },
		];
		const fastClient = makeFastClient("summary");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		expect(result).toBe(messages); // same reference
	});

	it("calls fastClient.chat with a summary prompt", async () => {
		const messages: Message[] = [
			{ role: "system", content: "System" },
			...Array.from({ length: 8 }, (_, i) => ({
				role: "user" as const,
				content: `msg${i}`,
			})),
		];
		const fastClient = makeFastClient("Compact summary");
		await compactMessages(messages, "qwen-max", fastClient);
		expect(fastClient.chat).toHaveBeenCalledOnce();
	});

	it("preserves system messages in output", async () => {
		const messages: Message[] = [
			{ role: "system", content: "System prompt" },
			...Array.from({ length: 8 }, (_, i) => ({
				role: "user" as const,
				content: `msg${i}`,
			})),
		];
		const fastClient = makeFastClient("Summary text");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		const systemMsgs = result.filter((m) => m.role === "system");
		expect(systemMsgs.some((m) => m.content === "System prompt")).toBe(true);
	});

	it("includes summary as a system message", async () => {
		const messages: Message[] = [
			{ role: "system", content: "System" },
			...Array.from({ length: 8 }, (_, i) => ({
				role: "user" as const,
				content: `msg${i}`,
			})),
		];
		const fastClient = makeFastClient("The summary content");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		const summaryMsg = result.find(
			(m) =>
				typeof m.content === "string" &&
				m.content.includes("The summary content"),
		);
		expect(summaryMsg).toBeDefined();
		expect(summaryMsg?.role).toBe("system");
	});

	it("preserves the tail (last 6 non-system messages)", async () => {
		const nonSystem: Message[] = Array.from({ length: 10 }, (_, i) => ({
			role: "user" as const,
			content: `msg${i}`,
		}));
		const messages: Message[] = [
			{ role: "system", content: "System" },
			...nonSystem,
		];
		const fastClient = makeFastClient("summary");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		// Last 6 non-system messages should be at the end
		const nonSystemResult = result.filter(
			(m) =>
				m.role !== "system" ||
				(typeof m.content === "string" && m.content.startsWith("## Resumo")),
		);
		const tail = nonSystem.slice(-6);
		for (const tailMsg of tail) {
			expect(result.some((m) => m.content === tailMsg.content)).toBe(true);
		}
	});

	it("returns empty array shape with summary when messages have many non-system msgs", async () => {
		const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
			role: "user" as const,
			content: `message number ${i}`,
		}));
		const fastClient = makeFastClient("compact");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		// Should have: 0 system + 1 summary + 6 tail = 7 messages
		expect(result.length).toBe(7);
	});

	it('summary message contains "Resumo do contexto anterior"', async () => {
		const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
			role: "user" as const,
			content: `msg ${i}`,
		}));
		const fastClient = makeFastClient("summary goes here");
		const result = await compactMessages(messages, "qwen-max", fastClient);
		const summaryMsg = result.find(
			(m) =>
				typeof m.content === "string" &&
				m.content.includes("Resumo do contexto anterior"),
		);
		expect(summaryMsg).toBeDefined();
	});
});
