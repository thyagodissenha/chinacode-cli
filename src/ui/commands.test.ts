import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentLoop } from "../agent/loop.js";
import { CostTracker } from "../cost/tracker.js";
import type { SessionStorage } from "../storage/sessions.js";
import type { AgentConfig } from "../types.js";
import { CommandParser } from "./commands.js";
import type { TUI } from "./tui.js";

function makeMockTUI(): TUI {
	return {
		showHeader: vi.fn(),
		showUser: vi.fn(),
		writeToken: vi.fn(),
		endStream: vi.fn(),
		showToolCall: vi.fn(),
		showToolResult: vi.fn(),
		showError: vi.fn(),
		showWarning: vi.fn(),
		startSpinner: vi.fn(),
		stopSpinner: vi.fn(),
		updateStatus: vi.fn(),
		prompt: vi.fn(),
		clear: vi.fn(),
		showSessionSummary: vi.fn(),
	} as unknown as TUI;
}

function makeMockLoop(costTracker?: CostTracker): AgentLoop {
	const tracker = costTracker ?? new CostTracker(0.8, 2.4);
	return {
		costTracker: tracker,
		setMessages: vi.fn(),
		run: vi.fn(),
		cancel: vi.fn(),
		state: { messages: [], iteration: 0, done: false, cost: 0 },
	} as unknown as AgentLoop;
}

function makeMockStorage(
	sessionData?: Record<string, unknown>,
): SessionStorage {
	return {
		getSession: vi.fn().mockReturnValue(sessionData ?? null),
		listSessions: vi.fn().mockReturnValue([]),
		formatSessionList: vi.fn().mockReturnValue("Nenhuma sessão encontrada."),
		createSession: vi.fn().mockReturnValue("mock-id"),
		updateSession: vi.fn(),
		close: vi.fn(),
	} as unknown as SessionStorage;
}

const baseConfig: AgentConfig = {
	models: {
		default: {
			provider: "dashscope",
			model: "qwen-plus",
			baseUrl: "https://dashscope.aliyuncs.com/v1",
			apiKey: "test-key",
		},
	},
	sandboxEnabled: false,
	autoApprove: true,
	maxIterations: 15,
	sessionTimeout: 300000,
	workspaceDir: "/workspace",
	mcpEnabled: false,
	ragEnabled: false,
	ragMaxFiles: 1000,
};

describe("CommandParser.isCommand", () => {
	it("returns true for /help", () => {
		const parser = new CommandParser(
			baseConfig,
			makeMockTUI(),
			makeMockLoop(),
			makeMockStorage(),
		);
		expect(parser.isCommand("/help")).toBe(true);
	});

	it("returns true for /exit", () => {
		const parser = new CommandParser(
			baseConfig,
			makeMockTUI(),
			makeMockLoop(),
			makeMockStorage(),
		);
		expect(parser.isCommand("/exit")).toBe(true);
	});

	it("returns true for command with leading space", () => {
		const parser = new CommandParser(
			baseConfig,
			makeMockTUI(),
			makeMockLoop(),
			makeMockStorage(),
		);
		expect(parser.isCommand("  /help")).toBe(true);
	});

	it("returns false for normal input", () => {
		const parser = new CommandParser(
			baseConfig,
			makeMockTUI(),
			makeMockLoop(),
			makeMockStorage(),
		);
		expect(parser.isCommand("write a function")).toBe(false);
	});

	it("returns false for empty string", () => {
		const parser = new CommandParser(
			baseConfig,
			makeMockTUI(),
			makeMockLoop(),
			makeMockStorage(),
		);
		expect(parser.isCommand("")).toBe(false);
	});
});

describe("CommandParser.execute", () => {
	let tui: TUI;
	let loop: AgentLoop;
	let storage: SessionStorage;
	let config: AgentConfig;

	beforeEach(() => {
		tui = makeMockTUI();
		loop = makeMockLoop();
		storage = makeMockStorage();
		config = {
			...baseConfig,
			models: { default: { ...baseConfig.models.default } },
		};
	});

	describe("/help command", () => {
		it("/help returns true (stay in loop)", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			const result = await parser.execute("/help");
			expect(result).toBe(true);
		});

		it("/h returns true", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/h")).toBe(true);
		});

		it("/? returns true", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/?")).toBe(true);
		});
	});

	describe("/exit command", () => {
		it("/exit returns false (exit loop)", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/exit")).toBe(false);
		});

		it("/q returns false", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/q")).toBe(false);
		});

		it("/quit returns false", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/quit")).toBe(false);
		});
	});

	describe("/cost command", () => {
		it("/cost returns true", async () => {
			const tracker = new CostTracker(0.8, 2.4);
			tracker.add("qwen-plus", { inputTokens: 1000, outputTokens: 500 });
			const mockLoop = makeMockLoop(tracker);
			const parser = new CommandParser(config, tui, mockLoop, storage);
			expect(await parser.execute("/cost")).toBe(true);
		});

		it("/c is an alias for /cost", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			expect(await parser.execute("/c")).toBe(true);
		});
	});

	describe("/clear command", () => {
		it("/clear calls loop.setMessages with empty array", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/clear");
			expect(loop.setMessages).toHaveBeenCalledWith([]);
		});

		it("/cls is an alias for /clear", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/cls");
			expect(loop.setMessages).toHaveBeenCalledWith([]);
		});

		it("/clear calls tui.clear and showHeader", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/clear");
			expect(tui.clear).toHaveBeenCalled();
			expect(tui.showHeader).toHaveBeenCalled();
		});
	});

	describe("/model command", () => {
		it("/model changes the default model", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/model qwen-turbo");
			expect(config.models.default.model).toBe("qwen-turbo");
		});

		it("/model without argument shows warning", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/model");
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("/model"),
			);
		});

		it("/m is an alias for /model", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/m qwen-max");
			expect(config.models.default.model).toBe("qwen-max");
		});
	});

	describe("/sandbox command", () => {
		it("/sandbox on enables sandbox", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/sandbox on");
			expect(config.sandboxEnabled).toBe(true);
		});

		it("/sandbox off disables sandbox", async () => {
			config.sandboxEnabled = true;
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/sandbox off");
			expect(config.sandboxEnabled).toBe(false);
		});

		it("/sandbox without valid arg shows warning", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/sandbox invalid");
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("/sandbox"),
			);
		});

		it("/sb is an alias for /sandbox", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/sb on");
			expect(config.sandboxEnabled).toBe(true);
		});
	});

	describe("/sessions command", () => {
		it("/sessions returns true and calls storage.listSessions", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			const result = await parser.execute("/sessions");
			expect(result).toBe(true);
			expect(storage.listSessions).toHaveBeenCalled();
			expect(storage.formatSessionList).toHaveBeenCalled();
		});
	});

	describe("/resume command", () => {
		it("/resume with valid id restores messages", async () => {
			const messages = [{ role: "user" as const, content: "restored" }];
			const mockStorage = makeMockStorage({
				id: "sess-1",
				messages: JSON.stringify(messages),
				messageCount: 1,
				totalCost: 0.001,
				directory: "/workspace",
				model: "qwen-plus",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			const parser = new CommandParser(config, tui, loop, mockStorage);
			const result = await parser.execute("/resume sess-1");
			expect(result).toBe(true);
			expect(loop.setMessages).toHaveBeenCalledWith(messages);
		});

		it("/resume with unknown id shows error", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/resume unknown-id");
			expect(tui.showError).toHaveBeenCalledWith(
				expect.stringContaining("não encontrada"),
			);
		});

		it("/resume without id shows warning", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/resume");
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("/resume"),
			);
		});
	});

	describe("/export command", () => {
		it("/export returns true", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			const result = await parser.execute("/export");
			expect(result).toBe(true);
		});
	});

	describe("/compact command", () => {
		it("/compact warns when there is no context to compact", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			await parser.execute("/compact");
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("Nenhum contexto"),
			);
		});
	});

	describe("unknown command", () => {
		it("unknown command shows warning and returns true", async () => {
			const parser = new CommandParser(config, tui, loop, storage);
			const result = await parser.execute("/unknown_cmd");
			expect(result).toBe(true);
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("desconhecido"),
			);
		});
	});
});
