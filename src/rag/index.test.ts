import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	LocalRagIndex,
	cosineSimilarity,
	embedText,
	tokenize,
} from "./index.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-rag-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("tokenize", () => {
	it("normalizes text into deterministic tokens", () => {
		expect(tokenize("Hello, HELLO TypeScript_5! a")).toEqual([
			"hello",
			"hello",
			"typescript_5",
		]);
	});
});

describe("embedText", () => {
	it("returns deterministic normalized vectors", () => {
		const first = embedText("alpha beta beta", 16);
		const second = embedText("alpha beta beta", 16);

		expect(first).toEqual(second);
		expect(cosineSimilarity(first, second)).toBeCloseTo(1);
	});
});

describe("LocalRagIndex", () => {
	it("indexes local text files and ranks semantic-ish matches first", async () => {
		writeFileSync(
			join(tmpDir, "agent.md"),
			"Agent loop uses tools and model routing.",
		);
		writeFileSync(
			join(tmpDir, "recipe.txt"),
			"Pasta sauce with tomatoes and basil.",
		);
		writeFileSync(join(tmpDir, "binary.bin"), "tools model routing");

		const index = new LocalRagIndex();
		const stats = await index.indexDirectory(tmpDir);
		const results = index.search("model tool routing");

		expect(stats).toEqual({ indexed: 2, skipped: 0, removed: 0, total: 2 });
		expect(results[0]?.relativePath).toBe("agent.md");
		expect(results[0]?.matchedTokens).toEqual(
			expect.arrayContaining(["model", "routing"]),
		);
		expect(results.map((result) => result.relativePath)).not.toContain(
			"binary.bin",
		);
	});

	it("skips unchanged files on incremental indexing and updates changed files", async () => {
		const notesPath = join(tmpDir, "notes.md");
		writeFileSync(notesPath, "alpha beta");

		const index = new LocalRagIndex();
		expect(await index.indexDirectory(tmpDir)).toMatchObject({
			indexed: 1,
			skipped: 0,
			total: 1,
		});
		expect(await index.indexDirectory(tmpDir)).toMatchObject({
			indexed: 0,
			skipped: 1,
			total: 1,
		});

		writeFileSync(notesPath, "gamma delta search term");
		const stats = await index.indexDirectory(tmpDir);
		const results = index.search("search term");

		expect(stats).toMatchObject({ indexed: 1, skipped: 0, total: 1 });
		expect(results[0]?.content).toBe("gamma delta search term");
	});

	it("removes documents that disappear from a directory scan", async () => {
		const keepPath = join(tmpDir, "keep.md");
		const removePath = join(tmpDir, "remove.md");
		writeFileSync(keepPath, "keep document");
		writeFileSync(removePath, "remove document");

		const index = new LocalRagIndex();
		await index.indexDirectory(tmpDir);
		rmSync(removePath);

		const stats = await index.indexDirectory(tmpDir);

		expect(stats).toEqual({ indexed: 0, skipped: 1, removed: 1, total: 1 });
		expect(index.search("remove")).toEqual([]);
	});

	it("can incrementally index an explicit file set", async () => {
		mkdirSync(join(tmpDir, "nested"));
		const firstPath = join(tmpDir, "first.md");
		const secondPath = join(tmpDir, "nested", "second.txt");
		writeFileSync(firstPath, "first document");
		writeFileSync(secondPath, "second nested document");

		const index = new LocalRagIndex();
		const stats = await index.indexFiles([firstPath, secondPath], tmpDir);

		expect(stats).toEqual({ indexed: 2, skipped: 0, removed: 0, total: 2 });
		expect(index.search("nested")[0]?.relativePath).toBe("nested/second.txt");
	});
});
