import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const DEFAULT_DIMENSIONS = 128;
const DEFAULT_TEXT_EXTENSIONS = new Set([
	".c",
	".cpp",
	".css",
	".go",
	".html",
	".js",
	".json",
	".jsx",
	".md",
	".py",
	".rs",
	".ts",
	".tsx",
	".txt",
	".yaml",
	".yml",
]);
const IGNORED_DIRECTORIES = new Set([".git", "dist", "node_modules"]);

export interface RagDocument {
	path: string;
	relativePath: string;
	content: string;
	tokens: string[];
	vector: number[];
	mtimeMs: number;
	size: number;
}

export interface RagIndexOptions {
	dimensions?: number;
	textExtensions?: string[];
}

export interface RagIndexStats {
	indexed: number;
	skipped: number;
	removed: number;
	total: number;
}

export interface RagSearchResult {
	path: string;
	relativePath: string;
	score: number;
	content: string;
	matchedTokens: string[];
}

export interface RagSearchOptions {
	limit?: number;
	minScore?: number;
}

export class LocalRagIndex {
	private readonly dimensions: number;
	private readonly textExtensions: Set<string>;
	private readonly documents = new Map<string, RagDocument>();

	constructor(options: RagIndexOptions = {}) {
		this.dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;
		this.textExtensions = new Set(
			options.textExtensions ?? DEFAULT_TEXT_EXTENSIONS,
		);
	}

	get size(): number {
		return this.documents.size;
	}

	listDocuments(): RagDocument[] {
		return Array.from(this.documents.values()).map((document) => ({
			...document,
			tokens: [...document.tokens],
			vector: [...document.vector],
		}));
	}

	async indexDirectory(rootDir: string): Promise<RagIndexStats> {
		const root = resolve(rootDir);
		const paths = await collectTextFiles(root, this.textExtensions);
		return this.indexFiles(paths, root);
	}

	async indexFiles(
		paths: string[],
		rootDir = process.cwd(),
	): Promise<RagIndexStats> {
		const root = resolve(rootDir);
		const seen = new Set<string>();
		let indexed = 0;
		let skipped = 0;

		for (const path of paths) {
			const absolutePath = resolve(path);
			seen.add(absolutePath);

			if (!this.isTextFile(absolutePath)) {
				continue;
			}

			const metadata = await stat(absolutePath);
			if (!metadata.isFile()) {
				continue;
			}

			const existing = this.documents.get(absolutePath);
			if (
				existing &&
				existing.mtimeMs === metadata.mtimeMs &&
				existing.size === metadata.size
			) {
				skipped += 1;
				continue;
			}

			const content = await readFile(absolutePath, "utf8");
			const tokens = tokenize(content);
			this.documents.set(absolutePath, {
				path: absolutePath,
				relativePath: relative(root, absolutePath),
				content,
				tokens,
				vector: embedTokens(tokens, this.dimensions),
				mtimeMs: metadata.mtimeMs,
				size: metadata.size,
			});
			indexed += 1;
		}

		let removed = 0;
		for (const path of this.documents.keys()) {
			if (path.startsWith(root) && !seen.has(path)) {
				this.documents.delete(path);
				removed += 1;
			}
		}

		return { indexed, skipped, removed, total: this.documents.size };
	}

	search(query: string, options: RagSearchOptions = {}): RagSearchResult[] {
		const limit = options.limit ?? 5;
		const minScore = options.minScore ?? 0;
		const queryTokens = tokenize(query);
		if (queryTokens.length === 0) return [];

		const queryVector = embedTokens(queryTokens, this.dimensions);
		const queryTokenSet = new Set(queryTokens);

		return Array.from(this.documents.values())
			.map((document) => {
				const matchedTokens = unique(
					document.tokens.filter((token) => queryTokenSet.has(token)),
				);
				const overlapScore = matchedTokens.length / queryTokenSet.size;
				const semanticScore = cosineSimilarity(queryVector, document.vector);
				const score = semanticScore * 0.75 + overlapScore * 0.25;

				return {
					path: document.path,
					relativePath: document.relativePath,
					score,
					content: document.content,
					matchedTokens,
				};
			})
			.filter((result) => result.score > minScore)
			.sort(
				(a, b) =>
					b.score - a.score || a.relativePath.localeCompare(b.relativePath),
			)
			.slice(0, limit);
	}

	private isTextFile(path: string): boolean {
		return this.textExtensions.has(extname(path).toLowerCase());
	}
}

export function tokenize(text: string): string[] {
	return (
		text
			.toLowerCase()
			.match(/[a-z0-9_]+/g)
			?.filter((token) => token.length > 1) ?? []
	);
}

export function embedText(
	text: string,
	dimensions = DEFAULT_DIMENSIONS,
): number[] {
	return embedTokens(tokenize(text), dimensions);
}

export function embedTokens(
	tokens: string[],
	dimensions = DEFAULT_DIMENSIONS,
): number[] {
	const vector = Array.from({ length: dimensions }, () => 0);

	for (const token of tokens) {
		const index = stableHash(token) % dimensions;
		vector[index] = (vector[index] ?? 0) + 1;
	}

	const magnitude = Math.sqrt(
		vector.reduce((sum, value) => sum + value * value, 0),
	);
	if (magnitude === 0) return vector;
	return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
	const length = Math.min(a.length, b.length);
	let dot = 0;

	for (let i = 0; i < length; i += 1) {
		dot += (a[i] ?? 0) * (b[i] ?? 0);
	}

	return dot;
}

function stableHash(value: string): number {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

async function collectTextFiles(
	root: string,
	textExtensions: Set<string>,
): Promise<string[]> {
	const entries = await readdir(root, { withFileTypes: true });
	const paths: string[] = [];

	for (const entry of entries) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			if (!IGNORED_DIRECTORIES.has(entry.name)) {
				paths.push(...(await collectTextFiles(path, textExtensions)));
			}
			continue;
		}

		if (
			entry.isFile() &&
			textExtensions.has(extname(entry.name).toLowerCase())
		) {
			paths.push(path);
		}
	}

	return paths.sort();
}

function unique(values: string[]): string[] {
	return Array.from(new Set(values));
}
