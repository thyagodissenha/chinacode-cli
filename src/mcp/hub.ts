import type { Tool, ToolResult } from "../types.js";
import {
	type McpClient,
	type McpClientFactory,
	type McpRemoteTool,
	createSdkMcpClient,
} from "./client.js";
import type { McpServerConfig, McpServersConfig } from "./config.js";

export interface McpHubOptions {
	config: McpServersConfig;
	clientFactory?: McpClientFactory;
}

export interface McpConnectionError {
	serverName: string;
	message: string;
}

export interface McpRegisteredTool {
	namespacedName: string;
	serverName: string;
	remoteName: string;
	description?: string;
	parameters: Record<string, unknown>;
}

interface ConnectedServer {
	config: McpServerConfig;
	client: McpClient;
}

export class McpHub {
	private readonly clientFactory: McpClientFactory;
	private readonly servers: McpServerConfig[];
	private readonly connected = new Map<string, ConnectedServer>();
	private readonly tools = new Map<string, McpRegisteredTool>();
	private readonly connectionErrors: McpConnectionError[] = [];

	constructor(options: McpHubOptions) {
		this.clientFactory = options.clientFactory ?? createSdkMcpClient;
		this.servers = options.config.servers.filter((server) => !server.disabled);
	}

	get serverConfigs(): McpServerConfig[] {
		return [...this.servers];
	}

	get errors(): McpConnectionError[] {
		return [...this.connectionErrors];
	}

	async connect(): Promise<McpRegisteredTool[]> {
		this.connectionErrors.length = 0;
		for (const server of this.servers) {
			const client = this.clientFactory(server);
			try {
				await client.connect();
				this.connected.set(server.name, { config: server, client });

				const remoteTools = await client.listTools();
				for (const remoteTool of remoteTools) {
					this.registerTool(server.name, remoteTool);
				}
			} catch (err) {
				this.connectionErrors.push({
					serverName: server.name,
					message: String(err),
				});
				await client.close().catch(() => {});
			}
		}

		return this.listRegisteredTools();
	}

	listRegisteredTools(): McpRegisteredTool[] {
		return [...this.tools.values()].sort((a, b) =>
			a.namespacedName.localeCompare(b.namespacedName),
		);
	}

	toTools(): Tool[] {
		return this.listRegisteredTools().map((registered) => ({
			name: registered.namespacedName,
			description:
				registered.description ??
				`MCP tool ${registered.remoteName} from ${registered.serverName}`,
			parameters: registered.parameters,
			execute: (args: unknown) => this.execute(registered.namespacedName, args),
		}));
	}

	async execute(namespacedName: string, args: unknown): Promise<ToolResult> {
		const registered = this.tools.get(namespacedName);
		if (!registered) {
			return {
				success: false,
				output: "",
				error: `Unknown MCP tool: ${namespacedName}`,
			};
		}

		const server = this.connected.get(registered.serverName);
		if (!server) {
			return {
				success: false,
				output: "",
				error: `MCP server is not connected: ${registered.serverName}`,
			};
		}

		try {
			const result = await server.client.callTool(registered.remoteName, args);
			return mcpCallResultToToolResult(result);
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	}

	async close(): Promise<void> {
		const clients = [...this.connected.values()].map((server) => server.client);
		this.connected.clear();
		this.tools.clear();
		await Promise.all(clients.map((client) => client.close()));
	}

	private registerTool(serverName: string, remoteTool: McpRemoteTool): void {
		assertToolNameSegment(remoteTool.name);

		const namespacedName = namespaceMcpToolName(serverName, remoteTool.name);
		if (this.tools.has(namespacedName)) {
			throw new Error(`Duplicate MCP tool name: ${namespacedName}`);
		}

		this.tools.set(namespacedName, {
			namespacedName,
			serverName,
			remoteName: remoteTool.name,
			description: remoteTool.description,
			parameters: remoteTool.inputSchema,
		});
	}
}

export function namespaceMcpToolName(
	serverName: string,
	toolName: string,
): string {
	return `mcp_${serverName}_${toolName}`;
}

function assertToolNameSegment(toolName: string): void {
	if (!/^[A-Za-z0-9_-]+$/.test(toolName)) {
		throw new Error(
			`Invalid MCP tool name "${toolName}": must contain only letters, numbers, underscores, or hyphens`,
		);
	}
}

function mcpCallResultToToolResult(result: unknown): ToolResult {
	if (!result || typeof result !== "object") {
		return { success: true, output: stringifyOutput(result) };
	}

	const record = result as Record<string, unknown>;
	const isError = record.isError === true;
	const content = record.content;
	const output = Array.isArray(content)
		? content.map(formatContentItem).join("\n")
		: "toolResult" in record
			? stringifyOutput(record.toolResult)
			: stringifyOutput(record);

	return {
		success: !isError,
		output,
		...(isError ? { error: output } : {}),
	};
}

function formatContentItem(item: unknown): string {
	if (item && typeof item === "object") {
		const record = item as Record<string, unknown>;
		if (record.type === "text" && typeof record.text === "string") {
			return record.text;
		}
	}

	return stringifyOutput(item);
}

function stringifyOutput(value: unknown): string {
	if (typeof value === "string") return value;
	return JSON.stringify(value);
}
