#!/usr/bin/env node
import { join } from "node:path";
import {
	buildSystemPromptFromAgentMd,
	parseAgentMd,
} from "./agent/agent-md.js";
import { AgentLoop } from "./agent/loop.js";
import { loadConfig } from "./config.js";
import { formatGitContext, getGitContext } from "./context/git.js";
import { McpHub, loadMcpServersConfig } from "./mcp/index.js";
import {
	type LoadedPlugin,
	type PluginLoadError,
	discoverPlugins,
} from "./plugins/index.js";
import { LocalRagIndex, type RagSearchResult } from "./rag/index.js";
import { formatSkillsForPrompt, loadSkills } from "./skills/loader.js";
import { SessionStorage } from "./storage/sessions.js";
import { createTools } from "./tools/registry.js";
import { CommandParser } from "./ui/commands.js";
import { KeyboardHandler } from "./ui/keyboard.js";
import { TUI } from "./ui/tui.js";

const VERSION = "0.1.0";

function loadSystemPrompt(config: ReturnType<typeof loadConfig>): string {
	const parsed = parseAgentMd(config.workspaceDir);
	const skills = loadSkills(join(config.workspaceDir, "skills"));
	const plugins = discoverPlugins(join(config.workspaceDir, "plugins"));
	const skillsSection = [
		formatSkillsForPrompt(skills),
		formatPluginsForPrompt(plugins.plugins, plugins.errors),
	]
		.filter(Boolean)
		.join("\n\n");
	return buildSystemPromptFromAgentMd(
		parsed,
		config.workspaceDir,
		VERSION,
		skillsSection,
	);
}

async function main(): Promise<void> {
	const config = loadConfig();
	const tools = createTools(config.workspaceDir, config.models);
	const mcpHub = config.mcpEnabled
		? new McpHub({
				config: loadMcpServersConfig({ workspaceDir: config.workspaceDir }),
			})
		: null;
	if (mcpHub) {
		const mcpTools = await mcpHub.connect();
		tools.push(...mcpHub.toTools());
		if (mcpTools.length > 0) {
			process.stdout.write(
				`  MCP: ${mcpTools.length} ferramenta(s) carregada(s).\n`,
			);
		}
		for (const error of mcpHub.errors) {
			process.stderr.write(
				`  MCP: servidor ${error.serverName} ignorado: ${error.message}\n`,
			);
		}
	}

	const ragIndex = config.ragEnabled ? new LocalRagIndex() : null;
	if (ragIndex) {
		const stats = await ragIndex.indexDirectory(config.workspaceDir);
		process.stdout.write(`  RAG: ${stats.total} arquivo(s) indexado(s).\n`);
	}

	const storage = new SessionStorage();
	const tui = new TUI(config);
	const systemPrompt = loadSystemPrompt(config);
	const loop = new AgentLoop(config, tui, tools, systemPrompt);
	const commands = new CommandParser(config, tui, loop, storage);

	const sessionId = storage.createSession(
		process.cwd(),
		config.models.default.model,
	);
	const startTime = Date.now();
	let interactionCount = 0;

	tui.showHeader();
	process.stdout.write(
		`  ChinaCode CLI v${VERSION} — pronto. Digite /help para ajuda.\n\n`,
	);

	let running = true;

	const keyboard = new KeyboardHandler(
		() => {
			loop.cancel();
		},
		() => {
			running = false;
		},
	);
	keyboard.attach();

	while (running) {
		let input: string;
		try {
			input = await tui.prompt();
		} catch {
			break;
		}

		const trimmed = input.trim();
		if (!trimmed) continue;

		if (commands.isCommand(trimmed)) {
			const shouldContinue = await commands.execute(trimmed);
			if (!shouldContinue) {
				running = false;
				break;
			}
		} else {
			// Refresh git context before each turn and update system prompt suffix
			const gitCtx = await getGitContext(config.workspaceDir);
			const gitSection = formatGitContext(gitCtx);
			const ragSection = ragIndex
				? formatRagContext(ragIndex.search(trimmed, { limit: 5 }))
				: "";
			const contextSections = [gitSection, ragSection]
				.filter(Boolean)
				.join("\n\n");
			if (contextSections) loop.setGitContext(contextSections);

			await loop.run(trimmed);
			interactionCount++;

			if (interactionCount % 10 === 0) {
				storage.updateSession(
					sessionId,
					loop.state.messages,
					loop.costTracker.totalCost,
				);
			}
		}
	}

	storage.updateSession(
		sessionId,
		loop.state.messages,
		loop.costTracker.totalCost,
	);
	storage.close();
	if (mcpHub) await mcpHub.close();
	keyboard.detach();

	const duration = Date.now() - startTime;
	tui.showSessionSummary(
		loop.costTracker.totalCost,
		duration,
		loop.state.messages.length,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Erro fatal:", err);
	process.exit(1);
});

function formatPluginsForPrompt(
	plugins: LoadedPlugin[],
	errors: PluginLoadError[],
): string {
	const lines: string[] = [];
	if (plugins.length > 0) {
		lines.push("## Plugins carregados");
		for (const plugin of plugins) {
			lines.push(
				`- **${plugin.manifest.name}** (${plugin.manifest.version}): ${plugin.manifest.description}`,
			);
			for (const command of plugin.commands) {
				lines.push(`  - comando ${command.name}: ${command.description}`);
			}
			for (const tool of plugin.tools) {
				lines.push(`  - ferramenta ${tool.name}: ${tool.description}`);
			}
		}
	}
	if (errors.length > 0) {
		lines.push("## Plugins ignorados");
		for (const error of errors) {
			lines.push(`- ${error.pluginDirectory}: ${error.message}`);
		}
	}
	return lines.join("\n");
}

function formatRagContext(results: RagSearchResult[]): string {
	if (results.length === 0) return "";
	const lines = ["## RAG Context"];
	for (const result of results) {
		const preview = result.content.replace(/\s+/g, " ").trim().slice(0, 700);
		lines.push(`### ${result.relativePath} (score ${result.score.toFixed(3)})`);
		lines.push(preview);
	}
	return lines.join("\n");
}
