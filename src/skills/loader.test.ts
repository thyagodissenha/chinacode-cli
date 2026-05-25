import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatSkillsForPrompt, getSkillByName, loadSkills } from "./loader.js";
import type { Skill } from "./loader.js";

let tmpDir: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "skills-test-"));
});

afterEach(() => {
	rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadSkills", () => {
	it("returns empty array when directory does not exist", () => {
		const result = loadSkills("/nonexistent/path/abc123");
		expect(result).toEqual([]);
	});

	it("returns empty array when directory has no .md files", () => {
		writeFileSync(join(tmpDir, "readme.txt"), "hello");
		const result = loadSkills(tmpDir);
		expect(result).toEqual([]);
	});

	it("loads a single skill file", () => {
		writeFileSync(
			join(tmpDir, "code-review.md"),
			"# Code Review\nReviews code quality.",
		);
		const result = loadSkills(tmpDir);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("code-review");
	});

	it("loads multiple skill files", () => {
		writeFileSync(join(tmpDir, "skill-a.md"), "# A\nSkill A.");
		writeFileSync(join(tmpDir, "skill-b.md"), "# B\nSkill B.");
		const result = loadSkills(tmpDir);
		expect(result).toHaveLength(2);
		const names = result.map((s) => s.name).sort();
		expect(names).toEqual(["skill-a", "skill-b"]);
	});

	it("stores full content of skill file", () => {
		const content = "# Test Skill\nSome content here.";
		writeFileSync(join(tmpDir, "test-skill.md"), content);
		const result = loadSkills(tmpDir);
		expect(result[0]?.content).toBe(content);
	});

	it('extracts description from "Quando usar" section', () => {
		const content = `# My Skill

## Quando usar
Use this skill when you need to review code.

## Como usar
Do this and that.
`;
		writeFileSync(join(tmpDir, "my-skill.md"), content);
		const result = loadSkills(tmpDir);
		expect(result[0]?.description).toBe(
			"Use this skill when you need to review code.",
		);
	});

	it("falls back to first non-heading line for description", () => {
		const content = "# Title\nThis is the description line.\nMore content.";
		writeFileSync(join(tmpDir, "fallback.md"), content);
		const result = loadSkills(tmpDir);
		expect(result[0]?.description).toBe("This is the description line.");
	});

	it("ignores non-.md files in the directory", () => {
		writeFileSync(join(tmpDir, "skill.md"), "# Skill\nContent.");
		writeFileSync(join(tmpDir, "notes.txt"), "not a skill");
		writeFileSync(join(tmpDir, "config.json"), "{}");
		const result = loadSkills(tmpDir);
		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("skill");
	});
});

describe("getSkillByName", () => {
	const skills: Skill[] = [
		{ name: "code-review", description: "Review code", content: "# CR" },
		{ name: "test-gen", description: "Generate tests", content: "# TG" },
		{ name: "refactor", description: "Refactor code", content: "# R" },
	];

	it("returns the skill matching the given name", () => {
		const result = getSkillByName(skills, "code-review");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("code-review");
	});

	it("returns null when no skill matches the name", () => {
		const result = getSkillByName(skills, "nonexistent");
		expect(result).toBeNull();
	});

	it("returns null for empty skills array", () => {
		const result = getSkillByName([], "code-review");
		expect(result).toBeNull();
	});

	it("is case-sensitive — does not match different case", () => {
		const result = getSkillByName(skills, "Code-Review");
		expect(result).toBeNull();
	});

	it("returns the correct skill among multiple", () => {
		const result = getSkillByName(skills, "refactor");
		expect(result?.description).toBe("Refactor code");
	});
});

describe("formatSkillsForPrompt", () => {
	it("returns empty string when skills array is empty", () => {
		expect(formatSkillsForPrompt([])).toBe("");
	});

	it("includes the section header", () => {
		const skills: Skill[] = [
			{ name: "skill-a", description: "Does A", content: "" },
		];
		const result = formatSkillsForPrompt(skills);
		expect(result).toContain("## Skills carregadas");
	});

	it("lists each skill with name and description", () => {
		const skills: Skill[] = [
			{ name: "code-review", description: "Reviews code quality", content: "" },
			{ name: "test-gen", description: "Generates tests", content: "" },
		];
		const result = formatSkillsForPrompt(skills);
		expect(result).toContain("**code-review**: Reviews code quality");
		expect(result).toContain("**test-gen**: Generates tests");
	});

	it("formats single skill correctly", () => {
		const skills: Skill[] = [
			{ name: "my-skill", description: "My description", content: "" },
		];
		const result = formatSkillsForPrompt(skills);
		expect(result).toBe("## Skills carregadas\n- **my-skill**: My description");
	});

	it("separates lines with newlines", () => {
		const skills: Skill[] = [
			{ name: "a", description: "Desc A", content: "" },
			{ name: "b", description: "Desc B", content: "" },
		];
		const result = formatSkillsForPrompt(skills);
		const lines = result.split("\n");
		expect(lines).toHaveLength(3); // header + 2 skills
	});
});
