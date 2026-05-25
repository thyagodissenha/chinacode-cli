import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadMcpServersConfig } from "./config.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-mcp-config-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadMcpServersConfig", () => {
	it("returns an empty config when the file does not exist", () => {
		expect(loadMcpServersConfig({ cwd: tmpDir })).toEqual({ servers: [] });
	});

	it("loads stdio and sse servers with interpolation", () => {
		const configPath = join(tmpDir, "mcp-servers.json");
		writeFileSync(
			configPath,
			JSON.stringify({
				servers: [
					{
						name: "files",
						transport: "stdio",
						command: "${RUNNER}",
						args: ["--root", "${WORKSPACE_DIR}"],
						env: { TOKEN: "${TOKEN}" },
					},
					{
						name: "events",
						transport: "sse",
						url: "https://example.test/sse",
						headers: { Authorization: "Bearer ${TOKEN}" },
					},
				],
			}),
		);

		const config = loadMcpServersConfig({
			cwd: tmpDir,
			env: { RUNNER: "node", TOKEN: "secret" },
			workspaceDir: "/workspace",
		});

		expect(config.servers).toEqual([
			{
				name: "files",
				transport: "stdio",
				command: "node",
				args: ["--root", "/workspace"],
				env: { TOKEN: "secret" },
			},
			{
				name: "events",
				transport: "sse",
				url: "https://example.test/sse",
				headers: { Authorization: "Bearer secret" },
			},
		]);
	});

	it("rejects invalid server definitions", () => {
		const configPath = join(tmpDir, "mcp-servers.json");
		writeFileSync(
			configPath,
			JSON.stringify({
				servers: [{ name: "bad name", transport: "stdio", command: "node" }],
			}),
		);

		expect(() => loadMcpServersConfig({ cwd: tmpDir })).toThrow(
			/Invalid MCP config/,
		);
	});

	it("rejects duplicate server names", () => {
		const configPath = join(tmpDir, "mcp-servers.json");
		writeFileSync(
			configPath,
			JSON.stringify({
				servers: [
					{ name: "same", transport: "stdio", command: "node" },
					{ name: "same", transport: "sse", url: "https://example.test/sse" },
				],
			}),
		);

		expect(() => loadMcpServersConfig({ cwd: tmpDir })).toThrow(
			/duplicate server name/,
		);
	});
});
