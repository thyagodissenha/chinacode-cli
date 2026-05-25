import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverPlugins, loadPluginManifest } from "./loader.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "chinacode-plugins-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("discoverPlugins", () => {
	it("returns no plugins or errors when the plugin directory does not exist", () => {
		expect(discoverPlugins(join(tmpDir, "missing"))).toEqual({
			plugins: [],
			errors: [],
		});
	});

	it("loads plugin metadata, commands, and tools from a valid manifest", () => {
		const pluginDir = writePlugin("hello-plugin", {
			name: "hello-plugin",
			version: "1.0.0",
			description: "Hello plugin",
			commands: [
				{
					name: "hello",
					description: "Say hello",
					usage: "/hello <name>",
				},
			],
			tools: [
				{
					name: "hello_tool",
					description: "Hello tool",
					parameters: {
						type: "object",
						properties: {
							name: { type: "string" },
						},
						required: ["name"],
					},
				},
			],
		});

		const result = discoverPlugins(tmpDir);

		expect(result.errors).toEqual([]);
		expect(result.plugins).toHaveLength(1);
		expect(result.plugins[0]?.directory).toBe(pluginDir);
		expect(result.plugins[0]?.manifest.name).toBe("hello-plugin");
		expect(result.plugins[0]?.commands[0]?.name).toBe("hello");
		expect(result.plugins[0]?.tools[0]?.name).toBe("hello_tool");
	});

	it("loads the checked-in example plugin fixture", () => {
		const fixtureDir = join(
			dirname(fileURLToPath(import.meta.url)),
			"fixtures",
		);
		const result = discoverPlugins(fixtureDir);

		expect(result.errors).toEqual([]);
		expect(result.plugins).toHaveLength(1);
		expect(result.plugins[0]?.manifest.name).toBe("example-plugin");
		expect(result.plugins[0]?.commands[0]?.name).toBe("example:hello");
		expect(result.plugins[0]?.tools[0]?.parameters).toMatchObject({
			type: "object",
		});
	});

	it("does not execute declared plugin entrypoints while loading metadata", () => {
		writePlugin("metadata-only", {
			name: "metadata-only",
			version: "1.0.0",
			description: "Metadata only",
			entrypoint: "./entrypoint.js",
			commands: [],
			tools: [],
		});
		writeFileSync(
			join(tmpDir, "metadata-only", "entrypoint.js"),
			"throw new Error('executed')\n",
		);

		const result = discoverPlugins(tmpDir);

		expect(result.errors).toEqual([]);
		expect(result.plugins).toHaveLength(1);
		expect(result.plugins[0]?.manifest.entrypoint).toBe("./entrypoint.js");
	});

	it("ignores child directories that do not contain plugin.json", () => {
		mkdirSync(join(tmpDir, "not-a-plugin"));

		expect(discoverPlugins(tmpDir)).toEqual({ plugins: [], errors: [] });
	});

	it("returns clear errors for invalid plugin manifests and continues loading valid plugins", () => {
		writePlugin("valid-plugin", {
			name: "valid-plugin",
			version: "1.0.0",
			description: "Valid plugin",
			commands: [],
			tools: [],
		});
		writePlugin("invalid-plugin", {
			name: "Invalid Plugin",
			version: "1.0.0",
			description: "",
			commands: [{ name: "bad command", description: "Bad command" }],
			tools: [],
		});

		const result = discoverPlugins(tmpDir);

		expect(result.plugins.map((plugin) => plugin.manifest.name)).toEqual([
			"valid-plugin",
		]);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]?.code).toBe("manifest_invalid");
		expect(result.errors[0]?.message).toContain("Plugin manifest is invalid");
		expect(result.errors[0]?.details?.join("\n")).toContain("name");
		expect(result.errors[0]?.details?.join("\n")).toContain("description");
		expect(result.errors[0]?.details?.join("\n")).toContain("commands.0.name");
	});

	it("returns clear errors for malformed JSON manifests", () => {
		const pluginDir = join(tmpDir, "broken-json");
		mkdirSync(pluginDir);
		writeFileSync(join(pluginDir, "plugin.json"), "{ nope");

		const result = discoverPlugins(tmpDir);

		expect(result.plugins).toEqual([]);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]?.code).toBe("manifest_invalid_json");
		expect(result.errors[0]?.message).toContain(
			"Plugin manifest is not valid JSON",
		);
	});

	it("rejects tool declarations without JSON Schema object parameters", () => {
		writePlugin("bad-tool", {
			name: "bad-tool",
			version: "1.0.0",
			description: "Bad tool",
			tools: [
				{
					name: "bad_tool",
					description: "Bad tool",
					parameters: { type: "string" },
				},
			],
		});

		const result = discoverPlugins(tmpDir);

		expect(result.plugins).toEqual([]);
		expect(result.errors[0]?.details?.join("\n")).toContain("Tool parameters");
	});

	it("rejects duplicate command and tool names", () => {
		writePlugin("duplicates", {
			name: "duplicates",
			version: "1.0.0",
			description: "Duplicate declarations",
			commands: [
				{ name: "same", description: "One" },
				{ name: "same", description: "Two" },
			],
			tools: [
				{
					name: "same_tool",
					description: "One",
					parameters: { type: "object" },
				},
				{
					name: "same_tool",
					description: "Two",
					parameters: { type: "object" },
				},
			],
		});

		const result = discoverPlugins(tmpDir);

		expect(result.plugins).toEqual([]);
		expect(result.errors[0]?.details?.join("\n")).toContain(
			"Duplicate command name: same",
		);
		expect(result.errors[0]?.details?.join("\n")).toContain(
			"Duplicate tool name: same_tool",
		);
	});
});

describe("loadPluginManifest", () => {
	it("loads a direct manifest path", () => {
		const pluginDir = writePlugin("direct", {
			name: "direct",
			version: "1.0.0",
			description: "Direct plugin",
		});
		const result = loadPluginManifest(pluginDir);

		expect("plugin" in result).toBe(true);
		if ("plugin" in result) {
			expect(result.plugin.commands).toEqual([]);
			expect(result.plugin.tools).toEqual([]);
		}
	});

	it("returns a read error when the manifest file is missing", () => {
		const pluginDir = join(tmpDir, "missing-manifest");
		mkdirSync(pluginDir);

		const result = loadPluginManifest(pluginDir);

		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error.code).toBe("manifest_unreadable");
			expect(result.error.message).toContain("Unable to read plugin manifest");
		}
	});
});

function writePlugin(name: string, manifest: Record<string, unknown>): string {
	const pluginDir = join(tmpDir, name);
	mkdirSync(pluginDir, { recursive: true });
	const manifestPath = join(pluginDir, "plugin.json");
	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	expect(existsSync(manifestPath)).toBe(true);
	return pluginDir;
}
