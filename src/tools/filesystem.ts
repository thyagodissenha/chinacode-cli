import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { Tool, ToolResult } from "../types.js";

const readFileSchema = z.object({
	path: z.string(),
	offset: z.number().default(0),
	limit: z.number().default(2000),
});

export const readFileTool: Tool = {
	name: "read_file",
	description: "Read the contents of a file with line numbers.",
	parameters: {
		type: "object",
		properties: {
			path: { type: "string", description: "Path to the file to read" },
			offset: {
				type: "number",
				description: "Starting line number (0-based)",
				default: 0,
			},
			limit: {
				type: "number",
				description: "Maximum number of lines to return",
				default: 2000,
			},
		},
		required: ["path"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { path: filePath, offset, limit } = readFileSchema.parse(args);
			if (!fs.existsSync(filePath)) {
				return {
					success: false,
					output: "",
					error: `File not found: ${filePath}`,
				};
			}
			const raw = fs.readFileSync(filePath, "utf8");
			const lines = raw.split("\n");
			const sliced = lines.slice(offset, offset + limit);
			const numbered = sliced
				.map((line, i) => `${offset + i + 1}\t${line}`)
				.join("\n");
			return { success: true, output: numbered };
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};

const writeFileSchema = z.object({
	path: z.string(),
	content: z.string(),
});

export const writeFileTool: Tool = {
	name: "write_file",
	description: "Write content to a file, creating directories as needed.",
	parameters: {
		type: "object",
		properties: {
			path: { type: "string", description: "Path to the file to write" },
			content: { type: "string", description: "Content to write to the file" },
		},
		required: ["path", "content"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { path: filePath, content } = writeFileSchema.parse(args);
			const dir = path.dirname(filePath);
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(filePath, content, "utf8");
			const bytes = Buffer.byteLength(content, "utf8");
			return {
				success: true,
				output: `Arquivo escrito: ${filePath} (${bytes} bytes)`,
			};
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};

const editFileSchema = z.object({
	path: z.string(),
	old_text: z.string(),
	new_text: z.string(),
});

export const editFileTool: Tool = {
	name: "edit_file",
	description: "Surgically replace a unique string in a file.",
	parameters: {
		type: "object",
		properties: {
			path: { type: "string", description: "Path to the file to edit" },
			old_text: {
				type: "string",
				description: "Exact text to find and replace",
			},
			new_text: { type: "string", description: "Replacement text" },
		},
		required: ["path", "old_text", "new_text"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { path: filePath, old_text, new_text } = editFileSchema.parse(args);
			if (!fs.existsSync(filePath)) {
				return {
					success: false,
					output: "",
					error: `File not found: ${filePath}`,
				};
			}
			const content = fs.readFileSync(filePath, "utf8");
			const occurrences = content.split(old_text).length - 1;
			if (occurrences === 0) {
				return {
					success: false,
					output: "",
					error: `Nenhuma ocorrência encontrada de old_text em ${filePath}`,
				};
			}
			if (occurrences > 1) {
				return {
					success: false,
					output: "",
					error: `${occurrences} ocorrências encontradas (ambíguo) em ${filePath}`,
				};
			}
			const updated = content.replace(old_text, new_text);
			fs.writeFileSync(filePath, updated, "utf8");
			return { success: true, output: `Arquivo editado: ${filePath}` };
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};

const globSearchSchema = z.object({
	pattern: z.string(),
});

const IGNORED_DIRS = new Set(["node_modules", ".git"]);

function globRecursive(
	dir: string,
	pattern: RegExp,
	results: string[],
	max: number,
): void {
	if (results.length >= max) return;
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (results.length >= max) return;
		if (IGNORED_DIRS.has(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			globRecursive(fullPath, pattern, results, max);
		} else if (pattern.test(entry.name)) {
			results.push(fullPath);
		}
	}
}

function globPatternToRegex(pattern: string): RegExp {
	const globstarPlaceholder = "__CHINACODE_GLOBSTAR__";
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, (c) =>
			c === "*" || c === "?" ? c : `\\${c}`,
		)
		.replace(/\*\*/g, globstarPlaceholder)
		.replace(/\*/g, "[^/]*")
		.replace(/\?/g, "[^/]")
		.replaceAll(globstarPlaceholder, ".*");
	return new RegExp(`^${escaped}$`);
}

export const globSearchTool: Tool = {
	name: "glob_search",
	description: "Search for files matching a glob pattern.",
	parameters: {
		type: "object",
		properties: {
			pattern: {
				type: "string",
				description: "Glob pattern to match filenames",
			},
		},
		required: ["pattern"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { pattern } = globSearchSchema.parse(args);
			const baseName = path.basename(pattern);
			const regex = globPatternToRegex(baseName);
			const results: string[] = [];
			globRecursive(process.cwd(), regex, results, 500);
			if (results.length === 0) {
				return { success: true, output: "Nenhum arquivo encontrado." };
			}
			return { success: true, output: results.join("\n") };
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};

const grepSearchSchema = z.object({
	pattern: z.string(),
	path: z.string().default("."),
});

const BINARY_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".bmp",
	".ico",
	".svg",
	".pdf",
	".zip",
	".tar",
	".gz",
	".7z",
	".rar",
	".exe",
	".dll",
	".so",
	".dylib",
	".bin",
	".mp3",
	".mp4",
	".avi",
	".mov",
	".webm",
	".woff",
	".woff2",
	".ttf",
	".eot",
	".db",
	".sqlite",
	".sqlite3",
	".lock",
]);

function isBinaryPath(filePath: string): boolean {
	return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function grepRecursive(
	dir: string,
	regex: RegExp,
	results: Array<{ file: string; line: number; content: string }>,
	max: number,
): void {
	if (results.length >= max) return;
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (results.length >= max) return;
		if (IGNORED_DIRS.has(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			grepRecursive(fullPath, regex, results, max);
		} else if (!isBinaryPath(fullPath)) {
			let content: string;
			try {
				content = fs.readFileSync(fullPath, "utf8");
			} catch {
				continue;
			}
			const lines = content.split("\n");
			for (let i = 0; i < lines.length && results.length < max; i++) {
				const line = lines[i] ?? "";
				if (regex.test(line)) {
					results.push({ file: fullPath, line: i + 1, content: line });
				}
			}
		}
	}
}

export const grepSearchTool: Tool = {
	name: "grep_search",
	description: "Search for a regex pattern in file contents recursively.",
	parameters: {
		type: "object",
		properties: {
			pattern: {
				type: "string",
				description: "Regular expression pattern to search for",
			},
			path: {
				type: "string",
				description: "Directory to search in",
				default: ".",
			},
		},
		required: ["pattern"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { pattern, path: searchPath } = grepSearchSchema.parse(args);
			let regex: RegExp;
			try {
				regex = new RegExp(pattern);
			} catch {
				return {
					success: false,
					output: "",
					error: `Padrão regex inválido: ${pattern}`,
				};
			}
			const results: Array<{ file: string; line: number; content: string }> =
				[];
			grepRecursive(searchPath, regex, results, 100);
			if (results.length === 0) {
				return { success: true, output: "Nenhuma correspondência encontrada." };
			}
			const output = results
				.map((r) => `${r.file}:${r.line}: ${r.content}`)
				.join("\n");
			return { success: true, output };
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};

const listDirectorySchema = z.object({
	path: z.string(),
	recursive: z.boolean().default(false),
});

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function listDir(
	dir: string,
	depth: number,
	maxDepth: number,
	lines: string[],
	indent: string,
): void {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (IGNORED_DIRS.has(entry.name)) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			lines.push(`${indent}${entry.name}/`);
			if (depth < maxDepth) {
				listDir(fullPath, depth + 1, maxDepth, lines, `${indent}  `);
			}
		} else {
			let size = "";
			try {
				const stat = fs.statSync(fullPath);
				size = ` (${formatSize(stat.size)})`;
			} catch {
				// ignore
			}
			lines.push(`${indent}${entry.name}${size}`);
		}
	}
}

export const listDirectoryTool: Tool = {
	name: "list_directory",
	description: "List files and directories at a path, optionally recursive.",
	parameters: {
		type: "object",
		properties: {
			path: { type: "string", description: "Directory path to list" },
			recursive: {
				type: "boolean",
				description: "List recursively up to 3 levels",
				default: false,
			},
		},
		required: ["path"],
	},
	async execute(args: unknown): Promise<ToolResult> {
		try {
			const { path: dirPath, recursive } = listDirectorySchema.parse(args);
			if (!fs.existsSync(dirPath)) {
				return {
					success: false,
					output: "",
					error: `Diretório não encontrado: ${dirPath}`,
				};
			}
			const lines: string[] = [];
			const maxDepth = recursive ? 3 : 1;
			listDir(dirPath, 1, maxDepth, lines, "");
			if (lines.length === 0) {
				return { success: true, output: "(diretório vazio)" };
			}
			return { success: true, output: lines.join("\n") };
		} catch (err) {
			return { success: false, output: "", error: String(err) };
		}
	},
};
