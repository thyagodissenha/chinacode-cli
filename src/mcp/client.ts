import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
	CallToolResult,
	Tool as SdkTool,
} from "@modelcontextprotocol/sdk/types.js";
import type { McpServerConfig } from "./config.js";

export type McpRemoteTool = Pick<
	SdkTool,
	"name" | "description" | "inputSchema"
>;
export type McpCallResult = CallToolResult;

export interface McpClient {
	connect(): Promise<void>;
	listTools(): Promise<McpRemoteTool[]>;
	callTool(name: string, args: unknown): Promise<McpCallResult>;
	close(): Promise<void>;
}

export type McpClientFactory = (server: McpServerConfig) => McpClient;

export function createSdkMcpClient(server: McpServerConfig): McpClient {
	const client = new Client({ name: "chinacode-mcp-hub", version: "0.1.0" });
	const transport =
		server.transport === "stdio"
			? new StdioClientTransport({
					command: server.command,
					args: server.args,
					env: server.env,
					cwd: server.cwd,
					stderr: "pipe",
				})
			: new SSEClientTransport(new URL(server.url), {
					requestInit: server.headers ? { headers: server.headers } : undefined,
					eventSourceInit: server.headers
						? { fetch: headersFetch(server.headers) }
						: undefined,
				});

	return {
		async connect(): Promise<void> {
			await client.connect(transport);
		},
		async listTools(): Promise<McpRemoteTool[]> {
			const result = await client.listTools();
			return result.tools.map((tool) => ({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			}));
		},
		async callTool(name: string, args: unknown): Promise<McpCallResult> {
			return client.callTool({
				name,
				arguments:
					args && typeof args === "object"
						? (args as Record<string, unknown>)
						: {},
			}) as Promise<McpCallResult>;
		},
		async close(): Promise<void> {
			await client.close();
		},
	};
}

function headersFetch(headers: Record<string, string>): typeof fetch {
	return (input, init) => {
		return fetch(input, {
			...init,
			headers: {
				...headers,
				...headersToRecord(init?.headers),
			},
		});
	};
}

function headersToRecord(headers: unknown): Record<string, string> {
	if (!headers) return {};
	if (headers instanceof Headers) return Object.fromEntries(headers.entries());
	if (Array.isArray(headers)) return Object.fromEntries(headers);
	return headers as Record<string, string>;
}
