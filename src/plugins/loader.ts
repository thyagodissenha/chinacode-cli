import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ZodError } from "zod";
import { type PluginManifest, PluginManifestSchema } from "./manifest.js";

export type PluginLoadErrorCode =
	| "plugins_dir_unreadable"
	| "manifest_unreadable"
	| "manifest_invalid_json"
	| "manifest_invalid";

export interface LoadedPlugin {
	manifest: PluginManifest;
	directory: string;
	manifestPath: string;
	commands: PluginManifest["commands"];
	tools: PluginManifest["tools"];
}

export interface PluginLoadError {
	code: PluginLoadErrorCode;
	pluginDirectory: string;
	manifestPath?: string;
	message: string;
	details?: string[];
}

export interface PluginDiscoveryResult {
	plugins: LoadedPlugin[];
	errors: PluginLoadError[];
}

const MANIFEST_FILE = "plugin.json";

/**
 * Discover local plugins from a configurable directory.
 *
 * The loader only reads and validates plugin.json manifests. It deliberately
 * does not import entrypoints or execute plugin code.
 */
export function discoverPlugins(pluginsDir: string): PluginDiscoveryResult {
	const root = resolve(pluginsDir);
	if (!existsSync(root)) return { plugins: [], errors: [] };

	let candidateDirs: string[];
	try {
		candidateDirs = listPluginCandidateDirs(root);
	} catch (err) {
		return {
			plugins: [],
			errors: [
				{
					code: "plugins_dir_unreadable",
					pluginDirectory: root,
					message: `Unable to read plugins directory: ${root}`,
					details: [String(err)],
				},
			],
		};
	}

	const plugins: LoadedPlugin[] = [];
	const errors: PluginLoadError[] = [];

	for (const pluginDirectory of candidateDirs) {
		const manifestPath = join(pluginDirectory, MANIFEST_FILE);
		const loaded = loadPluginManifest(pluginDirectory, manifestPath);
		if ("error" in loaded) {
			errors.push(loaded.error);
		} else {
			plugins.push(loaded.plugin);
		}
	}

	return { plugins, errors };
}

export function loadPluginManifest(
	pluginDirectory: string,
	manifestPath = join(pluginDirectory, MANIFEST_FILE),
): { plugin: LoadedPlugin } | { error: PluginLoadError } {
	let raw: string;
	try {
		raw = readFileSync(manifestPath, "utf-8");
	} catch (err) {
		return {
			error: {
				code: "manifest_unreadable",
				pluginDirectory,
				manifestPath,
				message: `Unable to read plugin manifest: ${manifestPath}`,
				details: [String(err)],
			},
		};
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		return {
			error: {
				code: "manifest_invalid_json",
				pluginDirectory,
				manifestPath,
				message: `Plugin manifest is not valid JSON: ${manifestPath}`,
				details: [String(err)],
			},
		};
	}

	const result = PluginManifestSchema.safeParse(parsed);
	if (!result.success) {
		return {
			error: {
				code: "manifest_invalid",
				pluginDirectory,
				manifestPath,
				message: `Plugin manifest is invalid: ${manifestPath}`,
				details: formatZodError(result.error),
			},
		};
	}

	const manifest = result.data;
	return {
		plugin: {
			manifest,
			directory: pluginDirectory,
			manifestPath,
			commands: manifest.commands,
			tools: manifest.tools,
		},
	};
}

function listPluginCandidateDirs(root: string): string[] {
	const candidates: string[] = [];
	if (existsSync(join(root, MANIFEST_FILE))) candidates.push(root);

	const entries = readdirSync(root, { withFileTypes: true });
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const pluginDirectory = join(root, entry.name);
		if (existsSync(join(pluginDirectory, MANIFEST_FILE))) {
			candidates.push(pluginDirectory);
		}
	}

	return candidates;
}

function formatZodError(error: ZodError): string[] {
	return error.issues.map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join(".") : "manifest";
		return `${path}: ${issue.message}`;
	});
}
