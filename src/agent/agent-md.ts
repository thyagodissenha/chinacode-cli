import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface AgentMdSections {
	identity: string;
	rules: string[];
	skills: string[];
	subagents: SubagentConfig[];
	raw: string;
}

export interface SubagentConfig {
	name: string;
	model: string;
	skill: string;
}

const DEFAULT_IDENTITY =
	"Você é ChinaCode CLI, um agente de codificação autônomo.";

/**
 * Parse an AGENT.md file from the given workspace directory.
 * Returns an empty/default object if the file does not exist or cannot be read.
 */
export function parseAgentMd(workspaceDir: string): AgentMdSections {
	const agentMdPath = resolve(workspaceDir, "AGENT.md");

	if (!existsSync(agentMdPath)) {
		return emptySection();
	}

	let raw: string;
	try {
		raw = readFileSync(agentMdPath, "utf-8");
	} catch {
		return emptySection();
	}

	return parseSections(raw);
}

function emptySection(): AgentMdSections {
	return { identity: "", rules: [], skills: [], subagents: [], raw: "" };
}

/**
 * Split markdown content into named sections by H1/H2 headings.
 */
function parseSections(raw: string): AgentMdSections {
	const result: AgentMdSections = {
		identity: "",
		rules: [],
		skills: [],
		subagents: [],
		raw,
	};

	const lines = raw.split("\n");

	// Build a map of heading → body
	const sectionMap = new Map<string, string>();
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const headingMatch = /^#{1,2}\s+(.+)$/.exec(line ?? "");
		if (headingMatch) {
			const heading = (headingMatch[1] ?? "").trim().toLowerCase();
			const bodyLines: string[] = [];
			i++;
			while (i < lines.length && !/^#{1,2}\s+/.test(lines[i] ?? "")) {
				bodyLines.push(lines[i] ?? "");
				i++;
			}
			sectionMap.set(heading, bodyLines.join("\n").trim());
		} else {
			i++;
		}
	}

	// Identity
	const identityBody = sectionMap.get("identity") ?? "";
	result.identity = identityBody.trim();

	// Rules — each non-empty line (strip leading "- ")
	const rulesBody = sectionMap.get("rules") ?? "";
	result.rules = rulesBody
		.split("\n")
		.map((l) => l.replace(/^[-*]\s+/, "").trim())
		.filter((l) => l.length > 0);

	// Skills — each non-empty line (strip leading "- ")
	const skillsBody = sectionMap.get("skills") ?? "";
	result.skills = skillsBody
		.split("\n")
		.map((l) => l.replace(/^[-*]\s+/, "").trim())
		.filter((l) => l.length > 0);

	// Subagents — simple YAML-like block parsing
	const subagentsBody = sectionMap.get("subagents") ?? "";
	result.subagents = parseSubagents(subagentsBody);

	return result;
}

function parseSubagents(body: string): SubagentConfig[] {
	if (!body.trim()) return [];

	const configs: SubagentConfig[] = [];
	const blocks = body.split(/\n(?=- name:)/m);

	for (const block of blocks) {
		const nameMatch = /name:\s*(.+)/.exec(block);
		const modelMatch = /model:\s*(.+)/.exec(block);
		const skillMatch = /skill:\s*(.+)/.exec(block);

		if (nameMatch) {
			configs.push({
				name: (nameMatch[1] ?? "").trim(),
				model: (modelMatch?.[1] ?? "").trim(),
				skill: (skillMatch?.[1] ?? "").trim(),
			});
		}
	}

	return configs;
}

/**
 * Build the final system prompt from parsed AGENT.md sections.
 *
 * @param parsed       - Parsed sections from parseAgentMd()
 * @param workspaceDir - Absolute path to the workspace directory
 * @param version      - CLI version string (e.g. "0.1.0")
 * @param skillsSection - Pre-formatted string from formatSkillsForPrompt() (optional)
 */
export function buildSystemPromptFromAgentMd(
	parsed: AgentMdSections,
	workspaceDir: string,
	version: string,
	skillsSection = "",
): string {
	const parts: string[] = [];

	// 1. Identity / persona
	const identity = parsed.identity.trim() || DEFAULT_IDENTITY;
	parts.push(identity);

	// 2. Mandatory rules
	if (parsed.rules.length > 0) {
		parts.push("\n## Regras obrigatórias");
		for (const rule of parsed.rules) {
			parts.push(`- ${rule}`);
		}
	}

	// 3. Available skills listed in AGENT.md
	const allSkillNames = new Set([...parsed.skills]);
	if (parsed.subagents.length > 0) {
		for (const sa of parsed.subagents) {
			if (sa.skill) allSkillNames.add(sa.skill);
		}
	}

	if (allSkillNames.size > 0) {
		parts.push("\n## Skills disponíveis (AGENT.md)");
		for (const sk of allSkillNames) {
			parts.push(`- ${sk}`);
		}
	}

	// 4. Skills loaded from the skills/ directory
	if (skillsSection.trim()) {
		parts.push(`\n${skillsSection.trim()}`);
	}

	// 5. Subagents
	if (parsed.subagents.length > 0) {
		parts.push("\n## Subagentes configurados");
		for (const sa of parsed.subagents) {
			parts.push(`- ${sa.name} (model: ${sa.model}, skill: ${sa.skill})`);
		}
	}

	// 6. Context
	parts.push("\n## Contexto de execução");
	parts.push(`- Diretório de trabalho: ${workspaceDir}`);
	parts.push(`- ChinaCode CLI v${version}`);
	parts.push(
		"- Seja direto, eficiente e cite sempre os arquivos que modificar.",
	);

	return parts.join("\n");
}
