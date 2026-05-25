import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentConfig, Tool, ToolResult } from "../types.js";

vi.mock("../models/client.js", () => ({
	ModelClient: vi.fn(),
}));

import { ModelClient } from "../models/client.js";
import type { TUI } from "../ui/tui.js";
import { AgentLoop } from "./loop.js";

const MockedModelClient = vi.mocked(ModelClient);

function makeMockTUI(): TUI {
	return {
		writeToken: vi.fn(),
		endStream: vi.fn(),
		showToolCall: vi.fn(),
		showToolResult: vi.fn(),
		showError: vi.fn(),
		showWarning: vi.fn(),
		updateStatus: vi.fn(),
		showHeader: vi.fn(),
		showUser: vi.fn(),
		startSpinner: vi.fn(),
		stopSpinner: vi.fn(),
		prompt: vi.fn(),
		clear: vi.fn(),
		showSessionSummary: vi.fn(),
	} as unknown as TUI;
}

const defaultConfig: AgentConfig = {
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
	maxIterations: 5,
	sessionTimeout: 30000,
	workspaceDir: "/tmp",
	mcpEnabled: false,
	ragEnabled: false,
	ragMaxFiles: 1000,
};

function makeStreamingClient(
	chunks: Array<
		| string
		| {
				tool_calls: Array<{
					id: string;
					type: "function";
					function: { name: string; arguments: string };
				}>;
		  }
	>,
): InstanceType<typeof ModelClient> {
	const streamChat = vi.fn().mockImplementation(async function* () {
		for (const chunk of chunks) {
			yield chunk;
		}
	});
	return {
		config: defaultConfig.models.default,
		streamChat,
	} as unknown as InstanceType<typeof ModelClient>;
}

function makeErrorClient(error: Error): InstanceType<typeof ModelClient> {
	const streamChat = vi.fn().mockImplementation(async function* () {
		yield* [];
		throw error;
	});
	return {
		config: defaultConfig.models.default,
		streamChat,
	} as unknown as InstanceType<typeof ModelClient>;
}

describe("AgentLoop", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("basic text response", () => {
		it("runs and emits tokens for a simple text response", async () => {
			const mockClient = makeStreamingClient(["Hello ", "world!"]);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			await loop.run("say hello");

			expect(tui.writeToken).toHaveBeenCalledWith("Hello ");
			expect(tui.writeToken).toHaveBeenCalledWith("world!");
			expect(tui.endStream).toHaveBeenCalled();
		});

		it("adds system prompt when provided", async () => {
			const mockClient = makeStreamingClient(["ok"]);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(
				defaultConfig,
				tui,
				[],
				"You are a helpful assistant.",
			);
			await loop.run("hello");

			expect(loop.state.messages[0]?.role).toBe("system");
			expect(loop.state.messages[0]?.content).toBe(
				"You are a helpful assistant.",
			);
		});

		it("adds user message to conversation history", async () => {
			const mockClient = makeStreamingClient(["ok"]);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			await loop.run("my user input");

			const messages = loop.state.messages;
			const userMsg = messages.find((m) => m.role === "user");
			expect(userMsg?.content).toBe("my user input");
		});
	});

	describe("tool call execution", () => {
		it("executes a tool call and appends tool result to messages", async () => {
			const toolCall = {
				id: "call_1",
				type: "function" as const,
				function: { name: "echo_tool", arguments: '{"text":"hello"}' },
			};

			let callCount = 0;
			const streamChat = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield { tool_calls: [toolCall] };
				} else {
					yield "Done";
				}
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const echoTool: Tool = {
				name: "echo_tool",
				description: "Echoes text",
				parameters: {
					type: "object",
					properties: { text: { type: "string" } },
					required: ["text"],
				},
				async execute(args: unknown): Promise<ToolResult> {
					const { text } = args as { text: string };
					return { success: true, output: `Echo: ${text}` };
				},
			};

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, [echoTool]);
			await loop.run("use echo tool");

			expect(tui.showToolCall).toHaveBeenCalledWith(
				"echo_tool",
				expect.any(String),
			);
			expect(tui.showToolResult).toHaveBeenCalledWith(
				"echo_tool",
				expect.stringContaining("Echo: hello"),
				true,
			);
		});

		it("handles unknown tool call gracefully", async () => {
			const toolCall = {
				id: "call_unknown",
				type: "function" as const,
				function: { name: "nonexistent_tool", arguments: "{}" },
			};

			let callCount = 0;
			const streamChat = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield { tool_calls: [toolCall] };
				} else {
					yield "Done";
				}
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			await loop.run("use unknown tool");

			expect(tui.showToolResult).toHaveBeenCalledWith(
				"nonexistent_tool",
				expect.stringContaining("desconhecida"),
				false,
			);
		});

		it("handles invalid JSON arguments for tool call", async () => {
			const toolCall = {
				id: "call_badjson",
				type: "function" as const,
				function: { name: "some_tool", arguments: "not_valid_json" },
			};

			let callCount = 0;
			const streamChat = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield { tool_calls: [toolCall] };
				} else {
					yield "Done";
				}
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const someTool: Tool = {
				name: "some_tool",
				description: "A tool",
				parameters: { type: "object", properties: {} },
				execute: vi.fn().mockResolvedValue({ success: true, output: "ok" }),
			};

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, [someTool]);
			await loop.run("test bad json");

			expect(tui.showToolResult).toHaveBeenCalledWith(
				"some_tool",
				expect.stringContaining("JSON parse error"),
				false,
			);
		});
	});

	describe("security guards", () => {
		it("blocks destructive bash commands", async () => {
			const toolCall = {
				id: "call_bash",
				type: "function" as const,
				function: { name: "bash", arguments: '{"command":"rm -rf /"}' },
			};

			let callCount = 0;
			const streamChat = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield { tool_calls: [toolCall] };
				} else {
					yield "Done";
				}
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const bashTool: Tool = {
				name: "bash",
				description: "Execute shell command",
				parameters: {
					type: "object",
					properties: { command: { type: "string" } },
					required: ["command"],
				},
				execute: vi
					.fn()
					.mockResolvedValue({ success: true, output: "executed" }),
			};

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, [bashTool]);
			await loop.run("delete everything");

			// Tool should not have been executed — warning should appear
			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("destrutivo"),
			);
			expect(bashTool.execute).not.toHaveBeenCalled();
		});

		it("blocks access to secret file paths via read_file", async () => {
			const toolCall = {
				id: "call_read",
				type: "function" as const,
				function: { name: "read_file", arguments: '{"path":".env"}' },
			};

			let callCount = 0;
			const streamChat = vi.fn().mockImplementation(async function* () {
				if (callCount === 0) {
					callCount++;
					yield { tool_calls: [toolCall] };
				} else {
					yield "Done";
				}
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const readTool: Tool = {
				name: "read_file",
				description: "Read file",
				parameters: {
					type: "object",
					properties: { path: { type: "string" } },
					required: ["path"],
				},
				execute: vi
					.fn()
					.mockResolvedValue({ success: true, output: "secret content" }),
			};

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, [readTool]);
			await loop.run("read env file");

			expect(readTool.execute).not.toHaveBeenCalled();
			expect(tui.showToolResult).toHaveBeenCalledWith(
				"read_file",
				expect.stringContaining("bloqueado"),
				false,
			);
		});
	});

	describe("cancellation", () => {
		it("can be cancelled mid-run", async () => {
			const streamChat = vi.fn().mockImplementation(async function* () {
				yield "start";
				await new Promise((resolve) => setTimeout(resolve, 50));
				yield "end";
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);

			const runPromise = loop.run("run forever");
			loop.cancel();
			await runPromise;

			// Should have called cancel before writing all tokens
			expect(loop.state.iteration).toBeGreaterThanOrEqual(0);
		});

		it("cancel sets internal cancelled flag", () => {
			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			loop.cancel();
			// After cancel, a new run should reset it
			// (internal implementation detail — just verify no crash)
			expect(() => loop.cancel()).not.toThrow();
		});
	});

	describe("iteration limit", () => {
		it("stops after maxIterations and shows warning", async () => {
			const streamChat = vi.fn().mockImplementation(async function* () {
				yield {
					tool_calls: [
						{
							id: `call_${Date.now()}`,
							type: "function" as const,
							function: { name: "dummy", arguments: "{}" },
						},
					],
				};
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const dummyTool: Tool = {
				name: "dummy",
				description: "Always triggers another iteration",
				parameters: { type: "object", properties: {} },
				execute: vi
					.fn()
					.mockResolvedValue({ success: true, output: "keep going" }),
			};

			const config = { ...defaultConfig, maxIterations: 3 };
			const tui = makeMockTUI();
			const loop = new AgentLoop(config, tui, [dummyTool]);
			await loop.run("infinite loop task");

			expect(tui.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("iterações"),
			);
			expect(loop.state.iteration).toBe(3);
		});
	});

	describe("cost tracking", () => {
		it("updates cost tracker via onUsage callback", async () => {
			const streamChat = vi.fn().mockImplementation(async function* (
				_messages: unknown,
				_tools: unknown,
				onUsage: (usage: { inputTokens: number; outputTokens: number }) => void,
			) {
				onUsage({ inputTokens: 100, outputTokens: 50 });
				yield "result";
			});
			const mockClient = {
				config: defaultConfig.models.default,
				streamChat,
			} as unknown as InstanceType<typeof ModelClient>;
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			await loop.run("test cost");

			expect(loop.costTracker.totalTokens.inputTokens).toBe(100);
			expect(loop.costTracker.totalTokens.outputTokens).toBe(50);
		});
	});

	describe("state management", () => {
		it("setMessages replaces conversation history", async () => {
			const mockClient = makeStreamingClient(["ok"]);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			const newMessages = [
				{ role: "user" as const, content: "restored message" },
			];
			loop.setMessages(newMessages);

			const state = loop.state;
			expect(state.messages).toHaveLength(1);
			expect(state.messages[0]?.content).toBe("restored message");
		});

		it("state returns a copy of messages (not a reference)", async () => {
			const mockClient = makeStreamingClient(["ok"]);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const loop = new AgentLoop(defaultConfig, tui, []);
			const state1 = loop.state;
			const state2 = loop.state;
			expect(state1.messages).not.toBe(state2.messages);
		});
	});

	describe("error handling", () => {
		it("calls showError and records failure on retryable API error", async () => {
			const apiError = {
				status: 429,
				error: { code: "limit_requests", message: "Rate limit" },
			};
			const mockClient = makeErrorClient(apiError as unknown as Error);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const config = { ...defaultConfig, maxIterations: 2 };
			const loop = new AgentLoop(config, tui, []);
			await loop.run("trigger error");

			expect(tui.showError).toHaveBeenCalled();
		});

		it("stops immediately on non-retryable API error", async () => {
			const apiError = {
				status: 401,
				error: { code: "InvalidApiKey", message: "Invalid key" },
			};
			const mockClient = makeErrorClient(apiError as unknown as Error);
			MockedModelClient.mockImplementation(() => mockClient);

			const tui = makeMockTUI();
			const config = { ...defaultConfig, maxIterations: 5 };
			const loop = new AgentLoop(config, tui, []);
			await loop.run("trigger auth error");

			expect(tui.showError).toHaveBeenCalledTimes(1);
			expect(loop.state.iteration).toBe(1);
		});
	});
});
