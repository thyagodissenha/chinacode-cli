import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const identifierSchema = z
	.string()
	.regex(
		/^[A-Za-z0-9_-]+$/,
		"must contain only letters, numbers, underscores, or hyphens",
	);

const baseServerSchema = z.object({
	name: identifierSchema,
	description: z.string().optional(),
	disabled: z.boolean().optional(),
});

const stdioServerSchema = baseServerSchema.extend({
	transport: z.literal("stdio"),
	command: z.string().min(1),
	args: z.array(z.string()).optional(),
	env: z.record(z.string()).optional(),
	cwd: z.string().optional(),
});

const sseServerSchema = baseServerSchema.extend({
	transport: z.literal("sse"),
	url: z.string().url(),
	headers: z.record(z.string()).optional(),
});

const configSchema = z.object({
	servers: z
		.array(
			z.discriminatedUnion("transport", [stdioServerSchema, sseServerSchema]),
		)
		.default([]),
});

export type McpServerConfig = z.infer<typeof configSchema>["servers"][number];
export type McpServersConfig = z.infer<typeof configSchema>;

export interface LoadMcpServersConfigOptions {
	path?: string;
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	workspaceDir?: string;
}

export function loadMcpServersConfig(
	options: LoadMcpServersConfigOptions = {},
): McpServersConfig {
	const cwd = options.cwd ?? process.cwd();
	const configPath = options.path ?? resolve(cwd, "mcp-servers.json");

	if (!existsSync(configPath)) {
		return { servers: [] };
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(configPath, "utf-8"));
	} catch (err) {
		throw new Error(
			`Failed to parse MCP config at ${configPath}: ${String(err)}`,
		);
	}

	const result = configSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(
			`Invalid MCP config at ${configPath}: ${result.error.message}`,
		);
	}

	const env = options.env ?? process.env;
	const interpolationEnv = {
		...env,
		WORKSPACE_DIR: options.workspaceDir ?? env.WORKSPACE_DIR ?? cwd,
	};

	const servers = result.data.servers.map((server) =>
		interpolateServer(server, interpolationEnv),
	);
	assertUniqueServerNames(servers, configPath);

	return { servers };
}

function interpolateServer(
	server: McpServerConfig,
	env: NodeJS.ProcessEnv,
): McpServerConfig {
	if (server.transport === "stdio") {
		return {
			...server,
			command: interpolateString(server.command, env),
			args: server.args?.map((arg) => interpolateString(arg, env)),
			env: interpolateRecord(server.env, env),
			cwd: server.cwd ? interpolateString(server.cwd, env) : undefined,
		};
	}

	return {
		...server,
		url: interpolateString(server.url, env),
		headers: interpolateRecord(server.headers, env),
	};
}

function interpolateRecord(
	record: Record<string, string> | undefined,
	env: NodeJS.ProcessEnv,
): Record<string, string> | undefined {
	if (!record) return undefined;
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			interpolateString(value, env),
		]),
	);
}

function interpolateString(value: string, env: NodeJS.ProcessEnv): string {
	return value.replace(
		/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
		(_match, name: string) => env[name] ?? "",
	);
}

function assertUniqueServerNames(
	servers: McpServerConfig[],
	configPath: string,
): void {
	const seen = new Set<string>();
	for (const server of servers) {
		if (seen.has(server.name)) {
			throw new Error(
				`Invalid MCP config at ${configPath}: duplicate server name "${server.name}"`,
			);
		}
		seen.add(server.name);
	}
}
