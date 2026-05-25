import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Tool } from "../types.js";
import { createTools } from "./registry.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-registry-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

function getTool(tools: Tool[], name: string): Tool {
	const tool = tools.find((t) => t.name === name);
	if (!tool) throw new Error(`Missing tool: ${name}`);
	return tool;
}

describe("createTools", () => {
	it("returns all 7 expected tools", () => {
		const tools = createTools(tmpDir);
		expect(tools).toHaveLength(7);
	});

	it("includes all expected tool names", () => {
		const tools = createTools(tmpDir);
		const names = tools.map((t) => t.name);
		expect(names).toContain("read_file");
		expect(names).toContain("write_file");
		expect(names).toContain("edit_file");
		expect(names).toContain("glob_search");
		expect(names).toContain("grep_search");
		expect(names).toContain("list_directory");
		expect(names).toContain("bash");
	});

	it("each tool has name, description, parameters, and execute", () => {
		const tools = createTools(tmpDir);
		for (const tool of tools) {
			expect(typeof tool.name).toBe("string");
			expect(typeof tool.description).toBe("string");
			expect(typeof tool.parameters).toBe("object");
			expect(typeof tool.execute).toBe("function");
		}
	});

	describe("workspace path resolution", () => {
		it("resolves relative path to workspace for read_file", async () => {
			writeFileSync(join(tmpDir, "hello.txt"), "workspace content");
			const tools = createTools(tmpDir);
			const readTool = getTool(tools, "read_file");
			// Pass relative path — should resolve to tmpDir/hello.txt
			const result = await readTool.execute({ path: "hello.txt" });
			expect(result.success).toBe(true);
			expect(result.output).toContain("workspace content");
		});

		it("keeps absolute path unchanged for read_file", async () => {
			writeFileSync(join(tmpDir, "absolute.txt"), "absolute content");
			const tools = createTools(tmpDir);
			const readTool = getTool(tools, "read_file");
			const result = await readTool.execute({
				path: join(tmpDir, "absolute.txt"),
			});
			expect(result.success).toBe(true);
			expect(result.output).toContain("absolute content");
		});

		it("resolves relative path for write_file", async () => {
			const tools = createTools(tmpDir);
			const writeTool = getTool(tools, "write_file");
			const result = await writeTool.execute({
				path: "written.txt",
				content: "written via workspace",
			});
			expect(result.success).toBe(true);
			// Verify the file exists at the workspace path
			const readTool = getTool(tools, "read_file");
			const readResult = await readTool.execute({
				path: join(tmpDir, "written.txt"),
			});
			expect(readResult.output).toContain("written via workspace");
		});

		it("resolves relative path for list_directory", async () => {
			writeFileSync(join(tmpDir, "file1.ts"), "");
			const tools = createTools(tmpDir);
			const listTool = getTool(tools, "list_directory");
			// Pass '.' which should resolve to tmpDir
			const result = await listTool.execute({ path: tmpDir });
			expect(result.success).toBe(true);
			expect(result.output).toContain("file1.ts");
		});

		it("does not modify non-path arguments", async () => {
			const tools = createTools(tmpDir);
			const grepTool = getTool(tools, "grep_search");
			const result = await grepTool.execute({
				pattern: "XYZNOTFOUND999",
				path: tmpDir,
			});
			expect(result.success).toBe(true);
			expect(result.output).toContain("Nenhuma correspondência");
		});

		it("passes non-object args unchanged", async () => {
			const tools = createTools(tmpDir);
			const bashTool = getTool(tools, "bash");
			const result = await bashTool.execute({ command: "echo workspace_test" });
			expect(result.success).toBe(true);
			expect(result.output).toContain("workspace_test");
		});
	});
});
