/**
 * Git-aware context module (IA-61)
 *
 * Collects information from the local git repository and formats it as a
 * markdown block suitable for injection into an agent system prompt.
 *
 * INTEGRATION NOTE (for when loop.ts is ready to receive changes):
 * -----------------------------------------------------------------
 * 1. Import at the top of src/agent/loop.ts:
 *      import { getGitContext, formatGitContext } from '../context/git.js'
 *
 * 2. Add a private field to AgentLoop:
 *      private gitContextProvider?: () => Promise<string>
 *
 * 3. Add a public setter:
 *      setGitContextProvider(fn: () => Promise<string>): void {
 *        this.gitContextProvider = fn
 *      }
 *
 * 4. At the beginning of AgentLoop.run(), before pushing the user message:
 *      if (this.gitContextProvider) {
 *        const gitBlock = await this.gitContextProvider()
 *        const sysIdx = this.messages.findIndex((m) => m.role === 'system')
 *        if (sysIdx >= 0 && gitBlock) {
 *          const existing = this.messages[sysIdx]!
 *          // Replace or append git block in the system message
 *          const base = typeof existing.content === 'string' ? existing.content : ''
 *          const stripped = base.replace(/\n?## Git Context[\s\S]*$/, '')
 *          this.messages[sysIdx] = { ...existing, content: stripped + '\n\n' + gitBlock }
 *        }
 *      }
 *
 * 5. When constructing the AgentLoop in src/index.ts, wire up the provider:
 *      const loop = new AgentLoop(config, tui, tools, systemPrompt)
 *      loop.setGitContextProvider(() =>
 *        getGitContext(config.workspaceDir).then(formatGitContext)
 *      )
 * -----------------------------------------------------------------
 */

import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(_execFile);

const GIT_TIMEOUT_MS = 3000;

export interface GitContext {
	isRepo: boolean;
	branch: string;
	stagedFiles: string[];
	modifiedFiles: string[];
	recentCommits: string[];
	stagedDiffStat: string;
}

/**
 * Run a git command in the given directory with a fixed timeout.
 * Returns stdout on success or an empty string on any error.
 */
async function runGit(args: string[], cwd: string): Promise<string> {
	try {
		const { stdout } = await execFile("git", args, {
			cwd,
			timeout: GIT_TIMEOUT_MS,
			// Prevent stdout/stderr buffers from blowing up for large repos
			maxBuffer: 1024 * 512,
		});
		return stdout.trim();
	} catch {
		return "";
	}
}

/**
 * Detect whether the given directory is inside a git repository.
 * We intentionally avoid throwing — the caller receives a plain boolean.
 */
async function isGitRepo(cwd: string): Promise<boolean> {
	try {
		const { stdout } = await execFile(
			"git",
			["rev-parse", "--is-inside-work-tree"],
			{ cwd, timeout: GIT_TIMEOUT_MS },
		);
		return stdout.trim() === "true";
	} catch {
		return false;
	}
}

/**
 * Parse `git status --short` output into staged and modified file lists.
 *
 * Each line is two characters (XY) followed by the filename:
 *   - X = index (staged) status
 *   - Y = work-tree (unstaged) status
 */
function parseStatusShort(raw: string): {
	staged: string[];
	modified: string[];
} {
	const staged: string[] = [];
	const modified: string[] = [];

	for (const line of raw.split("\n")) {
		if (line.length < 3) continue;
		const x = line[0] ?? " ";
		const y = line[1] ?? " ";
		const file = line.slice(3).trim();

		if (!file) continue;

		// Index column (X) non-space and non-? means staged change
		if (x !== " " && x !== "?") {
			staged.push(file);
		}

		// Work-tree column (Y) non-space and non-? means unstaged modification
		if (y !== " " && y !== "?") {
			modified.push(file);
		}
	}

	return { staged, modified };
}

/**
 * Collect git context for the given workspace directory.
 *
 * All individual command failures are swallowed — the returned object will
 * contain empty strings / arrays for fields that could not be fetched.
 * The only field that can short-circuit the whole function is `isRepo`.
 */
export async function getGitContext(workspaceDir: string): Promise<GitContext> {
	const empty: GitContext = {
		isRepo: false,
		branch: "",
		stagedFiles: [],
		modifiedFiles: [],
		recentCommits: [],
		stagedDiffStat: "",
	};

	const repoCheck = await isGitRepo(workspaceDir);
	if (!repoCheck) return empty;

	// Run all remaining git commands in parallel to minimise latency
	const [branchRaw, statusRaw, logRaw, diffStatRaw] = await Promise.all([
		runGit(["branch", "--show-current"], workspaceDir),
		runGit(["status", "--short"], workspaceDir),
		runGit(["log", "--oneline", "-5"], workspaceDir),
		runGit(["diff", "--cached", "--stat"], workspaceDir),
	]);

	const { staged, modified } = parseStatusShort(statusRaw);

	const recentCommits = logRaw
		? logRaw.split("\n").filter((l) => l.length > 0)
		: [];

	return {
		isRepo: true,
		branch: branchRaw,
		stagedFiles: staged,
		modifiedFiles: modified,
		recentCommits,
		stagedDiffStat: diffStatRaw,
	};
}

/**
 * Format a GitContext object as a markdown block for injection into a system
 * prompt.  Returns an empty string when `isRepo` is false.
 */
export function formatGitContext(ctx: GitContext): string {
	if (!ctx.isRepo) return "";

	const lines: string[] = ["## Git Context"];

	lines.push(`Branch: ${ctx.branch || "(unknown)"}`);

	if (ctx.stagedFiles.length > 0) {
		lines.push(`Staged: ${ctx.stagedFiles.join(", ")}`);
	}

	if (ctx.modifiedFiles.length > 0) {
		lines.push(`Modified: ${ctx.modifiedFiles.join(", ")}`);
	}

	if (ctx.recentCommits.length > 0) {
		lines.push("Recent commits:");
		for (const commit of ctx.recentCommits) {
			lines.push(`  ${commit}`);
		}
	}

	if (ctx.stagedDiffStat) {
		lines.push("Staged diff stat:");
		for (const statLine of ctx.stagedDiffStat.split("\n")) {
			lines.push(`  ${statLine}`);
		}
	}

	return lines.join("\n");
}
