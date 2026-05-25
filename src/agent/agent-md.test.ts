import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildSystemPromptFromAgentMd, parseAgentMd } from "./agent-md.js";
import type { AgentMdSections } from "./agent-md.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "agent-md-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("parseAgentMd", () => {
	it("returns empty sections when AGENT.md does not exist", () => {
		const result = parseAgentMd(tmpDir);
		expect(result.identity).toBe("");
		expect(result.rules).toEqual([]);
		expect(result.skills).toEqual([]);
		expect(result.subagents).toEqual([]);
		expect(result.raw).toBe("");
	});

	it("parses identity section correctly", () => {
		writeFileSync(
			join(tmpDir, "AGENT.md"),
			"# Identity\nYou are a helpful agent.\n",
		);
		const result = parseAgentMd(tmpDir);
		expect(result.identity).toBe("You are a helpful agent.");
	});

	it("parses rules section as array of strings", () => {
		const content =
			"# Rules\n- Always be concise\n- Use TypeScript\n- No side effects\n";
		writeFileSync(join(tmpDir, "AGENT.md"), content);
		const result = parseAgentMd(tmpDir);
		expect(result.rules).toEqual([
			"Always be concise",
			"Use TypeScript",
			"No side effects",
		]);
	});

	it("parses skills section as array of strings", () => {
		const content = "# Skills\n- code-review\n- test-generation\n";
		writeFileSync(join(tmpDir, "AGENT.md"), content);
		const result = parseAgentMd(tmpDir);
		expect(result.skills).toEqual(["code-review", "test-generation"]);
	});

	it("parses subagents section correctly", () => {
		const content = `# Subagents
- name: reviewer
  model: qwen-max
  skill: code-review
- name: tester
  model: qwen-plus
  skill: test-generation
`;
		writeFileSync(join(tmpDir, "AGENT.md"), content);
		const result = parseAgentMd(tmpDir);
		expect(result.subagents).toHaveLength(2);
		expect(result.subagents[0]).toEqual({
			name: "reviewer",
			model: "qwen-max",
			skill: "code-review",
		});
		expect(result.subagents[1]).toEqual({
			name: "tester",
			model: "qwen-plus",
			skill: "test-generation",
		});
	});

	it("stores the raw content", () => {
		const raw = "# Identity\nMy agent.\n";
		writeFileSync(join(tmpDir, "AGENT.md"), raw);
		const result = parseAgentMd(tmpDir);
		expect(result.raw).toBe(raw);
	});

	it("handles H2 headings (## Identity)", () => {
		writeFileSync(
			join(tmpDir, "AGENT.md"),
			"## Identity\nSecond-level identity.\n",
		);
		const result = parseAgentMd(tmpDir);
		expect(result.identity).toBe("Second-level identity.");
	});

	it("handles fully populated AGENT.md with all sections", () => {
		const content = `# Identity
You are ChinaCode.

# Rules
- Be direct
- Cite files

# Skills
- search
- edit

# Subagents
- name: helper
  model: qwen-turbo
  skill: search
`;
		writeFileSync(join(tmpDir, "AGENT.md"), content);
		const result = parseAgentMd(tmpDir);
		expect(result.identity).toBe("You are ChinaCode.");
		expect(result.rules).toEqual(["Be direct", "Cite files"]);
		expect(result.skills).toEqual(["search", "edit"]);
		expect(result.subagents).toHaveLength(1);
	});

	it("returns empty sections on empty file", () => {
		writeFileSync(join(tmpDir, "AGENT.md"), "");
		const result = parseAgentMd(tmpDir);
		expect(result.identity).toBe("");
		expect(result.rules).toEqual([]);
	});
});

describe("buildSystemPromptFromAgentMd", () => {
	const emptyParsed: AgentMdSections = {
		identity: "",
		rules: [],
		skills: [],
		subagents: [],
		raw: "",
	};

	it("uses default identity when identity is empty", () => {
		const prompt = buildSystemPromptFromAgentMd(
			emptyParsed,
			"/workspace",
			"0.1.0",
		);
		expect(prompt).toContain("ChinaCode CLI");
	});

	it("uses parsed identity when provided", () => {
		const parsed = { ...emptyParsed, identity: "You are a custom agent." };
		const prompt = buildSystemPromptFromAgentMd(parsed, "/workspace", "0.1.0");
		expect(prompt).toContain("You are a custom agent.");
	});

	it("includes mandatory rules section when rules exist", () => {
		const parsed = { ...emptyParsed, rules: ["Be concise", "Use English"] };
		const prompt = buildSystemPromptFromAgentMd(parsed, "/workspace", "0.1.0");
		expect(prompt).toContain("Regras obrigatórias");
		expect(prompt).toContain("- Be concise");
		expect(prompt).toContain("- Use English");
	});

	it("includes skills listed in AGENT.md", () => {
		const parsed = { ...emptyParsed, skills: ["code-review", "refactor"] };
		const prompt = buildSystemPromptFromAgentMd(parsed, "/workspace", "0.1.0");
		expect(prompt).toContain("- code-review");
		expect(prompt).toContain("- refactor");
	});

	it("includes subagent skills in the skills section", () => {
		const parsed = {
			...emptyParsed,
			subagents: [
				{ name: "reviewer", model: "qwen-max", skill: "code-review" },
			],
		};
		const prompt = buildSystemPromptFromAgentMd(parsed, "/workspace", "0.1.0");
		expect(prompt).toContain("- code-review");
	});

	it("includes subagents section when subagents are configured", () => {
		const parsed = {
			...emptyParsed,
			subagents: [{ name: "helper", model: "qwen-plus", skill: "search" }],
		};
		const prompt = buildSystemPromptFromAgentMd(parsed, "/workspace", "0.1.0");
		expect(prompt).toContain("Subagentes configurados");
		expect(prompt).toContain("helper (model: qwen-plus, skill: search)");
	});

	it("includes workspace dir and version in context", () => {
		const prompt = buildSystemPromptFromAgentMd(
			emptyParsed,
			"/my/workspace",
			"1.2.3",
		);
		expect(prompt).toContain("/my/workspace");
		expect(prompt).toContain("v1.2.3");
	});

	it("appends skillsSection when provided", () => {
		const skillsSection =
			"## Skills carregadas\n- **code-review**: Reviews code";
		const prompt = buildSystemPromptFromAgentMd(
			emptyParsed,
			"/workspace",
			"0.1.0",
			skillsSection,
		);
		expect(prompt).toContain("## Skills carregadas");
		expect(prompt).toContain("**code-review**: Reviews code");
	});

	it("does not include rules section when rules array is empty", () => {
		const prompt = buildSystemPromptFromAgentMd(
			emptyParsed,
			"/workspace",
			"0.1.0",
		);
		expect(prompt).not.toContain("Regras obrigatórias");
	});
});
