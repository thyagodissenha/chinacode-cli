import { describe, expect, it } from "vitest";
import type {
	McpCallResult,
	McpClient,
	McpClientFactory,
	McpRemoteTool,
} from "./client.js";
import type { McpServersConfig } from "./config.js";
import { McpHub, namespaceMcpToolName } from "./hub.js";

class FakeMcpClient implements McpClient {
	connected = false;
	closed = false;
	calls: Array<{ name: string; args: unknown }> = [];

	constructor(
		private readonly tools: McpRemoteTool[],
		private readonly result: McpCallResult = {
			content: [{ type: "text", text: "ok" }],
		},
	) {}

	async connect(): Promise<void> {
		this.connected = true;
	}

	async listTools(): Promise<McpRemoteTool[]> {
		return this.tools;
	}

	async callTool(name: string, args: unknown): Promise<McpCallResult> {
		this.calls.push({ name, args });
		return this.result;
	}

	async close(): Promise<void> {
		this.closed = true;
	}
}

const inputSchema = {
	type: "object" as const,
	properties: { value: { type: "string" } },
	required: ["value"],
};

describe("McpHub", () => {
	it("namespaces remote tools and exposes registry tools", async () => {
		const fake = new FakeMcpClient([
			{ name: "search", description: "Search remote data", inputSchema },
		]);
		const hub = new McpHub({
			config: {
				servers: [{ name: "linear", transport: "stdio", command: "node" }],
			},
			clientFactory: () => fake,
		});

		const registered = await hub.connect();
		const tools = hub.toTools();

		expect(registered).toEqual([
			{
				namespacedName: "mcp_linear_search",
				serverName: "linear",
				remoteName: "search",
				description: "Search remote data",
				parameters: inputSchema,
			},
		]);
		expect(tools).toHaveLength(1);
		expect(tools[0]?.name).toBe("mcp_linear_search");
		expect(tools[0]?.parameters).toBe(inputSchema);

		const tool = tools[0];
		expect(tool).toBeDefined();
		const result = await tool.execute({ value: "ABC" });
		expect(result).toEqual({ success: true, output: "ok" });
		expect(fake.calls).toEqual([{ name: "search", args: { value: "ABC" } }]);
	});

	it("skips disabled servers", async () => {
		let created = 0;
		const hub = new McpHub({
			config: {
				servers: [
					{ name: "off", transport: "stdio", command: "node", disabled: true },
				],
			},
			clientFactory: () => {
				created++;
				return new FakeMcpClient([]);
			},
		});

		await hub.connect();

		expect(created).toBe(0);
		expect(hub.listRegisteredTools()).toEqual([]);
	});

	it("returns failed ToolResult for remote MCP errors", async () => {
		const fake = new FakeMcpClient([{ name: "fail", inputSchema }], {
			content: [{ type: "text", text: "remote failed" }],
			isError: true,
		});
		const hub = new McpHub({
			config: {
				servers: [{ name: "srv", transport: "stdio", command: "node" }],
			},
			clientFactory: () => fake,
		});

		await hub.connect();

		await expect(hub.execute("mcp_srv_fail", {})).resolves.toEqual({
			success: false,
			output: "remote failed",
			error: "remote failed",
		});
	});

	it("rejects invalid remote tool names", async () => {
		const hub = new McpHub({
			config: {
				servers: [{ name: "srv", transport: "stdio", command: "node" }],
			},
			clientFactory: () =>
				new FakeMcpClient([{ name: "bad/tool", inputSchema }]),
		});

		await hub.connect();

		expect(hub.listRegisteredTools()).toEqual([]);
		expect(hub.errors[0]).toMatchObject({
			serverName: "srv",
			message: expect.stringContaining("Invalid MCP tool name"),
		});
	});

	it("closes connected clients and clears registry", async () => {
		const fake = new FakeMcpClient([{ name: "search", inputSchema }]);
		const hub = new McpHub({
			config: {
				servers: [{ name: "srv", transport: "stdio", command: "node" }],
			},
			clientFactory: () => fake,
		});

		await hub.connect();
		await hub.close();

		expect(fake.closed).toBe(true);
		expect(hub.listRegisteredTools()).toEqual([]);
	});

	it("builds deterministic namespaced names", () => {
		expect(namespaceMcpToolName("git", "log")).toBe("mcp_git_log");
	});

	it("supports multiple transport definitions through the factory boundary", async () => {
		const seen: string[] = [];
		const factory: McpClientFactory = (server) => {
			seen.push(`${server.name}:${server.transport}`);
			return new FakeMcpClient([]);
		};
		const config: McpServersConfig = {
			servers: [
				{ name: "local", transport: "stdio", command: "node" },
				{ name: "remote", transport: "sse", url: "https://example.test/sse" },
			],
		};

		await new McpHub({ config, clientFactory: factory }).connect();

		expect(seen).toEqual(["local:stdio", "remote:sse"]);
	});
});
