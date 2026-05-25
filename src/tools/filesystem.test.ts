import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	editFileTool,
	globSearchTool,
	grepSearchTool,
	listDirectoryTool,
	readFileTool,
	writeFileTool,
} from "./filesystem.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-fs-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("readFileTool", () => {
	it("reads an existing file with line numbers", async () => {
		writeFileSync(join(tmpDir, "test.txt"), "line1\nline2\nline3");
		const result = await readFileTool.execute({
			path: join(tmpDir, "test.txt"),
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("line1");
		expect(result.output).toContain("1\t");
		expect(result.output).toContain("3\t");
	});

	it("returns error for missing file", async () => {
		const result = await readFileTool.execute({
			path: join(tmpDir, "missing.txt"),
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("not found");
	});

	it("respects offset (skips lines)", async () => {
		const content = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join(
			"\n",
		);
		writeFileSync(join(tmpDir, "big.txt"), content);
		const result = await readFileTool.execute({
			path: join(tmpDir, "big.txt"),
			offset: 2,
			limit: 3,
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("line3");
		expect(result.output).toContain("line5");
		expect(result.output).not.toContain("line1\n");
		expect(result.output).not.toContain("line6");
	});

	it("reads empty file successfully", async () => {
		writeFileSync(join(tmpDir, "empty.txt"), "");
		const result = await readFileTool.execute({
			path: join(tmpDir, "empty.txt"),
		});
		expect(result.success).toBe(true);
	});

	it("reads file with unicode content", async () => {
		writeFileSync(join(tmpDir, "unicode.txt"), "你好世界\nHello World");
		const result = await readFileTool.execute({
			path: join(tmpDir, "unicode.txt"),
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("你好世界");
	});
});

describe("writeFileTool", () => {
	it("writes a new file", async () => {
		const path = join(tmpDir, "new.txt");
		const result = await writeFileTool.execute({
			path,
			content: "hello world",
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("escrito");
	});

	it("reports byte size in output", async () => {
		const path = join(tmpDir, "sized.txt");
		const result = await writeFileTool.execute({ path, content: "abc" });
		expect(result.success).toBe(true);
		expect(result.output).toContain("bytes");
	});

	it("creates intermediate directories automatically", async () => {
		const path = join(tmpDir, "subdir", "nested", "file.txt");
		const result = await writeFileTool.execute({
			path,
			content: "nested content",
		});
		expect(result.success).toBe(true);
	});

	it("overwrites existing file", async () => {
		const path = join(tmpDir, "existing.txt");
		writeFileSync(path, "old content");
		await writeFileTool.execute({ path, content: "new content" });
		const readResult = await readFileTool.execute({ path });
		expect(readResult.output).toContain("new content");
		expect(readResult.output).not.toContain("old content");
	});
});

describe("editFileTool", () => {
	it("replaces unique text in a file", async () => {
		const path = join(tmpDir, "edit.txt");
		writeFileSync(path, "hello world\nfoo bar\n");
		const result = await editFileTool.execute({
			path,
			old_text: "foo bar",
			new_text: "baz qux",
		});
		expect(result.success).toBe(true);
		const readResult = await readFileTool.execute({ path });
		expect(readResult.output).toContain("baz qux");
		expect(readResult.output).not.toContain("foo bar");
	});

	it('fails with "Nenhuma ocorrência" when old_text not found', async () => {
		const path = join(tmpDir, "notfound.txt");
		writeFileSync(path, "some content here");
		const result = await editFileTool.execute({
			path,
			old_text: "missing text",
			new_text: "replacement",
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("Nenhuma ocorrência");
	});

	it("fails when old_text is ambiguous (multiple occurrences)", async () => {
		const path = join(tmpDir, "ambiguous.txt");
		writeFileSync(path, "foo\nfoo\n");
		const result = await editFileTool.execute({
			path,
			old_text: "foo",
			new_text: "bar",
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("ocorrências");
	});

	it("fails when file does not exist", async () => {
		const result = await editFileTool.execute({
			path: join(tmpDir, "ghost.txt"),
			old_text: "a",
			new_text: "b",
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("not found");
	});

	it("preserves surrounding content after edit", async () => {
		const path = join(tmpDir, "preserve.txt");
		writeFileSync(path, "line1\ntarget\nline3");
		await editFileTool.execute({
			path,
			old_text: "target",
			new_text: "replaced",
		});
		const readResult = await readFileTool.execute({ path });
		expect(readResult.output).toContain("line1");
		expect(readResult.output).toContain("replaced");
		expect(readResult.output).toContain("line3");
	});
});

describe("globSearchTool", () => {
	it("returns success even with no matches", async () => {
		const result = await globSearchTool.execute({
			pattern: "*.nonexistentextension9999",
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("Nenhum arquivo encontrado");
	});

	it("finds TypeScript files in the project", async () => {
		// The tool searches from process.cwd(), which should find our src/*.ts files
		const result = await globSearchTool.execute({ pattern: "*.ts" });
		expect(result.success).toBe(true);
		// Should find at least our source files
		expect(result.output.length).toBeGreaterThan(0);
	});
});

describe("grepSearchTool", () => {
	it("finds pattern in files", async () => {
		writeFileSync(
			join(tmpDir, "code.ts"),
			'const SECRET_KEY = "abc"\nconst x = 1',
		);
		const result = await grepSearchTool.execute({
			pattern: "SECRET_KEY",
			path: tmpDir,
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("SECRET_KEY");
		expect(result.output).toContain("code.ts");
	});

	it("includes file path and line number in output", async () => {
		writeFileSync(join(tmpDir, "search.txt"), "line1\nmatch_here\nline3");
		const result = await grepSearchTool.execute({
			pattern: "match_here",
			path: tmpDir,
		});
		expect(result.success).toBe(true);
		expect(result.output).toMatch(/:\d+:/);
	});

	it('returns "Nenhuma correspondência" when not found', async () => {
		writeFileSync(join(tmpDir, "file.txt"), "hello world");
		const result = await grepSearchTool.execute({
			pattern: "NOTFOUND_XYZ_99999",
			path: tmpDir,
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("Nenhuma correspondência");
	});

	it("returns error for invalid regex", async () => {
		const result = await grepSearchTool.execute({
			pattern: "[invalid(regex",
			path: tmpDir,
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("regex inválido");
	});

	it("searches recursively in subdirectories", async () => {
		mkdirSync(join(tmpDir, "sub"));
		writeFileSync(join(tmpDir, "sub", "nested.ts"), "UNIQUE_MARKER_XYZ");
		const result = await grepSearchTool.execute({
			pattern: "UNIQUE_MARKER_XYZ",
			path: tmpDir,
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("UNIQUE_MARKER_XYZ");
	});

	it("uses current directory when path defaults", async () => {
		const result = await grepSearchTool.execute({
			pattern: "class CostTracker",
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("CostTracker");
	});
});

describe("listDirectoryTool", () => {
	it("lists files in directory", async () => {
		writeFileSync(join(tmpDir, "a.txt"), "");
		writeFileSync(join(tmpDir, "b.txt"), "");
		const result = await listDirectoryTool.execute({ path: tmpDir });
		expect(result.success).toBe(true);
		expect(result.output).toContain("a.txt");
		expect(result.output).toContain("b.txt");
	});

	it("includes file sizes", async () => {
		writeFileSync(join(tmpDir, "sized.txt"), "content");
		const result = await listDirectoryTool.execute({ path: tmpDir });
		expect(result.success).toBe(true);
		expect(result.output).toMatch(/\d+B|\d+KB/);
	});

	it("returns error for missing directory", async () => {
		const result = await listDirectoryTool.execute({
			path: join(tmpDir, "nonexistent"),
		});
		expect(result.success).toBe(false);
		expect(result.error).toContain("não encontrado");
	});

	it("lists recursively when requested", async () => {
		mkdirSync(join(tmpDir, "subdir"));
		writeFileSync(join(tmpDir, "subdir", "nested.ts"), "");
		const result = await listDirectoryTool.execute({
			path: tmpDir,
			recursive: true,
		});
		expect(result.success).toBe(true);
		expect(result.output).toContain("subdir");
		expect(result.output).toContain("nested.ts");
	});

	it("shows trailing slash for directories", async () => {
		mkdirSync(join(tmpDir, "mydir"));
		const result = await listDirectoryTool.execute({ path: tmpDir });
		expect(result.success).toBe(true);
		expect(result.output).toContain("mydir/");
	});

	it("returns empty dir message for empty directory", async () => {
		const emptyDir = join(tmpDir, "empty");
		mkdirSync(emptyDir);
		const result = await listDirectoryTool.execute({ path: emptyDir });
		expect(result.success).toBe(true);
		expect(result.output).toContain("vazio");
	});

	it("ignores node_modules directory", async () => {
		mkdirSync(join(tmpDir, "node_modules"));
		writeFileSync(join(tmpDir, "node_modules", "pkg.js"), "");
		writeFileSync(join(tmpDir, "index.ts"), "");
		const result = await listDirectoryTool.execute({
			path: tmpDir,
			recursive: true,
		});
		expect(result.output).not.toContain("node_modules");
	});
});
