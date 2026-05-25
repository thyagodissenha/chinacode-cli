import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatGitContext, getGitContext } from "./git.js";
import type { GitContext } from "./git.js";

// Mock child_process module before anything imports it
vi.mock("node:child_process", () => {
	return {
		execFile: vi.fn(),
	};
});

// We need to mock promisify as well — the module uses promisify(_execFile)
// The easiest approach: mock the actual execFile calls via the promisified version
// by intercepting at the module level with a manual mock

import * as childProcess from "node:child_process";

type ExecFileCallback = (
	error: Error | null,
	result?: { stdout: string },
) => void;
type ExecFileMock = (
	cmd: string,
	args: string[],
	opts: object,
	callback: ExecFileCallback,
) => void;

// Helper to set up execFile mock for a sequence of calls
function setupExecFileMock(responses: Array<{ stdout: string } | Error>) {
	let callIndex = 0;
	const mockExecFile = vi.fn<ExecFileMock>((_cmd, _args, _opts, callback) => {
		const response = responses[callIndex] ?? { stdout: "" };
		callIndex++;
		if (response instanceof Error) {
			callback(response);
		} else {
			callback(null, response);
		}
	});
	vi.mocked(childProcess.execFile).mockImplementation(
		mockExecFile as unknown as typeof childProcess.execFile,
	);
}

describe("formatGitContext", () => {
	it("returns empty string when isRepo is false", () => {
		const ctx: GitContext = {
			isRepo: false,
			branch: "",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		expect(formatGitContext(ctx)).toBe("");
	});

	it('includes "## Git Context" header when isRepo is true', () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("## Git Context");
	});

	it("includes branch name", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "feature/my-branch",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("feature/my-branch");
	});

	it('shows "(unknown)" when branch is empty', () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("(unknown)");
	});

	it("lists staged files", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: ["src/a.ts", "src/b.ts"],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("Staged: src/a.ts, src/b.ts");
	});

	it("lists modified files", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: [],
			modifiedFiles: ["README.md"],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("Modified: README.md");
	});

	it("lists recent commits", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: ["abc123 fix: bug", "def456 feat: new thing"],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("Recent commits:");
		expect(result).toContain("abc123 fix: bug");
	});

	it("includes staged diff stat when present", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: ["file.ts"],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: " file.ts | 5 +++++",
		};
		const result = formatGitContext(ctx);
		expect(result).toContain("Staged diff stat:");
		expect(result).toContain("file.ts | 5 +++++");
	});

	it("does not include Staged section when no staged files", () => {
		const ctx: GitContext = {
			isRepo: true,
			branch: "main",
			stagedFiles: [],
			modifiedFiles: [],
			recentCommits: [],
			stagedDiffStat: "",
		};
		const result = formatGitContext(ctx);
		expect(result).not.toContain("Staged:");
	});
});

describe("getGitContext — non-repo scenario", () => {
	beforeEach(() => {
		// First call (isGitRepo check) throws → not a repo
		setupExecFileMock([new Error("not a git repo")]);
	});

	it("returns isRepo: false when directory is not a git repo", async () => {
		const ctx = await getGitContext("/tmp/not-a-repo");
		expect(ctx.isRepo).toBe(false);
	});

	it("returns empty fields when not a repo", async () => {
		const ctx = await getGitContext("/tmp/not-a-repo");
		expect(ctx.branch).toBe("");
		expect(ctx.stagedFiles).toEqual([]);
		expect(ctx.modifiedFiles).toEqual([]);
		expect(ctx.recentCommits).toEqual([]);
		expect(ctx.stagedDiffStat).toBe("");
	});
});

describe("getGitContext — repo scenario", () => {
	beforeEach(() => {
		// Call sequence:
		// 1. isGitRepo → "true"
		// 2. branch --show-current → "main"
		// 3. status --short → "M  src/a.ts\n?? src/b.ts"
		// 4. log --oneline -5 → "abc123 commit msg"
		// 5. diff --cached --stat → " src/a.ts | 2 ++"
		setupExecFileMock([
			{ stdout: "true\n" },
			{ stdout: "main\n" },
			{ stdout: "M  src/a.ts\n" },
			{ stdout: "abc123 commit msg\n" },
			{ stdout: " src/a.ts | 2 ++\n" },
		]);
	});

	it("returns isRepo: true for a valid repo", async () => {
		const ctx = await getGitContext("/some/repo");
		expect(ctx.isRepo).toBe(true);
	});

	it("returns the current branch name", async () => {
		const ctx = await getGitContext("/some/repo");
		expect(ctx.branch).toBe("main");
	});

	it("includes recent commits", async () => {
		const ctx = await getGitContext("/some/repo");
		expect(ctx.recentCommits).toContain("abc123 commit msg");
	});
});
