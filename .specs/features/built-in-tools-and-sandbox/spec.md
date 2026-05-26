# Built-in Tools & Sandbox Specification

## Problem Statement

An autonomous coding agent is useless without reliable tools to read, write, search, and execute code. Beyond functionality, every write to disk and every shell command is a potential security risk — the agent must provide sandboxed execution and require approval for destructive changes.

## Goals

- [ ] Provide 8 composable built-in tools covering all file and shell operations needed for coding tasks
- [ ] Isolate bash execution in Docker containers by default; fall back gracefully when Docker is unavailable
- [ ] Require interactive diff approval before any file write, preventing unreviewed changes

## Out of Scope

| Feature | Reason |
|---|---|
| MCP tool integration | Phase 3 |
| delegate_task (subagent) implementation | Phase 2 stub only |
| File watching / hot-reload | Not planned for M1 |
| Git operations as a native tool | Covered by bash + Phase 3 git MCP |

---

## User Stories

### P1: bash — Execute Shell Commands ⭐ MVP

**User Story**: As a developer, I want the agent to run shell commands on my behalf, so it can install packages, run tests, build code, and interact with the OS.

**Acceptance Criteria**:

1. WHEN the agent calls `bash` with a `command` string THEN the CLI SHALL execute it and return stdout + stderr + exit code
2. WHEN a `timeout` param is provided THEN the command SHALL be killed after that many seconds; default timeout is 60s
3. WHEN Docker is available THEN bash SHALL run inside an ephemeral container (`--rm`, `--network none`, workspace volume-mounted read-write)
4. WHEN Docker is unavailable THEN bash SHALL run locally with a visible warning: "⚠ Docker not found — running in unsandboxed mode"
5. WHEN the command contains a destructive pattern (`rm -rf`, `drop table`, `git push --force`, `format`, `mkfs`) THEN the CLI SHALL prompt "⚠ Destructive command detected. Confirm? [Y/N]" before executing
6. WHEN a command runs in Docker THEN it SHALL have no network access and be limited to the workspace directory

**Independent Test**: Ask agent to run `echo hello` — returns "hello" within 2s.

---

### P1: read_file — Read File Contents ⭐ MVP

**User Story**: As a developer, I want the agent to read any file in my project, so it can understand my codebase before making changes.

**Acceptance Criteria**:

1. WHEN `read_file` is called with a `path` THEN the CLI SHALL return the file contents
2. WHEN `offset` and `limit` params are provided THEN only lines `offset` to `offset+limit` SHALL be returned
3. WHEN the file does not exist THEN the tool SHALL return `{"error": "File not found: <path>"}`
4. WHEN the file path contains `..` components that escape the workspace THEN the tool SHALL reject it with `{"error": "Path outside workspace"}`
5. WHEN the file is binary THEN the tool SHALL return `{"error": "Binary file not readable"}`

**Independent Test**: Ask agent to read `package.json` — returns its contents.

---

### P1: write_file — Write File with Diff Approval ⭐ MVP

**User Story**: As a developer, I want to see a diff of every file change before it's applied, so I stay in control of what the agent writes.

**Acceptance Criteria**:

1. WHEN `write_file` is called THEN the CLI SHALL display a colored diff (green=added, red=removed) before writing
2. WHEN the user responds `Y` or `y` THEN the file SHALL be written and `{"ok": true}` returned
3. WHEN the user responds `N` or `n` THEN the write SHALL be skipped and `{"ok": false, "reason": "user rejected"}` returned
4. WHEN the user responds `A` or `a` THEN all subsequent writes in this session SHALL auto-approve without prompting
5. WHEN the file does not exist yet THEN the entire content SHALL be shown as additions (no old content)
6. WHEN writing outside the workspace root THEN the tool SHALL require explicit user confirmation with a warning

**Independent Test**: Ask agent to create a new file — colored diff appears, file only exists after Y.

---

### P1: edit_file — Surgical String Replacement ⭐ MVP

**User Story**: As a developer, I want the agent to make targeted edits to existing files without rewriting the entire content, so changes are minimal and reviewable.

**Acceptance Criteria**:

1. WHEN `edit_file` is called with `path`, `old_text`, `new_text` THEN the CLI SHALL replace the first occurrence of `old_text` with `new_text`
2. WHEN `old_text` is not found in the file THEN the tool SHALL return `{"error": "old_text not found in file"}`
3. WHEN `old_text` appears more than once THEN the tool SHALL return `{"error": "old_text is not unique — provide more context"}` (no partial edit)
4. WHEN a valid edit is made THEN a colored diff SHALL be shown for approval (same Y/N/A flow as write_file)

**Independent Test**: Ask agent to rename a function — only that exact string is replaced, diff shows the change.

---

### P1: glob_search — Find Files by Pattern ⭐ MVP

**User Story**: As a developer, I want the agent to find files matching a glob pattern, so it can discover the structure of my project.

**Acceptance Criteria**:

1. WHEN `glob_search` is called with a `pattern` THEN the CLI SHALL return an array of matching file paths relative to the workspace
2. WHEN no files match THEN the tool SHALL return `{"matches": []}`
3. WHEN the pattern matches more than 500 files THEN the tool SHALL return the first 500 with `{"truncated": true}`

**Independent Test**: `**/*.ts` returns all TypeScript files in the project.

---

### P1: grep_search — Search File Contents ⭐ MVP

**User Story**: As a developer, I want the agent to find all occurrences of a string or pattern in my codebase, so it can locate where a function is used or defined.

**Acceptance Criteria**:

1. WHEN `grep_search` is called with `pattern` THEN the CLI SHALL return matching lines with file path and line number
2. WHEN `path` is provided THEN search SHALL be limited to that directory or file
3. WHEN no matches are found THEN the tool SHALL return `{"matches": []}`
4. WHEN `pattern` is a regex THEN it SHALL be applied as a JavaScript RegExp

**Independent Test**: Search for `"TODO"` in the project — returns all TODO comments with file:line references.

---

### P1: list_directory — List Directory Contents ⭐ MVP

**User Story**: As a developer, I want the agent to explore directory structure, so it can understand how the project is organized.

**Acceptance Criteria**:

1. WHEN `list_directory` is called with a `path` THEN the CLI SHALL return files and subdirectories at that level
2. WHEN `recursive: true` is passed THEN the full tree SHALL be returned (max depth 10)
3. WHEN the path does not exist THEN the tool SHALL return `{"error": "Directory not found: <path>"}`
4. WHEN the listing exceeds 1000 entries THEN only the first 1000 SHALL be returned with `{"truncated": true}`

---

### P1: delegate_task — Stub for Future Subagents ⭐ MVP

**User Story**: As a developer, I want the agent to attempt to delegate tasks to subagents defined in agent.md.

**Acceptance Criteria**:

1. WHEN `delegate_task` is called in M1 THEN the CLI SHALL return `{"error": "Subagents not yet implemented. This feature is available in Phase 2."}` without crashing
2. WHEN delegate_task is called THEN it SHALL log the delegation attempt with the task description

**Independent Test**: Trigger delegate_task — returns a clear "not yet implemented" message.

---

### P2: Secrets Filter

**User Story**: As a developer, I want the agent to automatically exclude secrets from any context sent to the LLM, so my API keys, passwords, and certificates are never exposed.

**Acceptance Criteria**:

1. WHEN `read_file` reads a file named `.env`, `.git/config`, or matching `*.pem`, `*.key`, `id_rsa*` THEN it SHALL return `{"error": "Secrets file blocked — will not send to LLM"}`
2. WHEN file contents contain patterns matching `sk-[a-zA-Z0-9]{20,}` or `ghp_[a-zA-Z0-9]+` or `-----BEGIN` THEN the tool SHALL redact those lines with `[REDACTED]`

---

## Edge Cases

- WHEN bash exits with non-zero code THEN the tool SHALL return the exit code and stderr without treating it as a tool failure
- WHEN write_file is called for the same file twice in one session and A (auto-approve) was set THEN both writes SHALL apply silently
- WHEN a file path contains symlinks pointing outside the workspace THEN tools SHALL resolve and reject the path
- WHEN Docker container creation fails (permission denied, daemon not running) THEN fallback to local with clear error shown

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| BTS-01 | P1: bash — execution + timeout | Tasks | Pending |
| BTS-02 | P1: bash — Docker sandbox | Tasks | Pending |
| BTS-03 | P1: bash — fallback + destructive confirm | Tasks | Pending |
| BTS-04 | P1: read_file — content + offset/limit | Tasks | Pending |
| BTS-05 | P1: read_file — path safety | Tasks | Pending |
| BTS-06 | P1: write_file — diff approval flow | Tasks | Pending |
| BTS-07 | P1: write_file — auto-approve (A) | Tasks | Pending |
| BTS-08 | P1: edit_file — unique replacement | Tasks | Pending |
| BTS-09 | P1: glob_search | Tasks | Pending |
| BTS-10 | P1: grep_search | Tasks | Pending |
| BTS-11 | P1: list_directory | Tasks | Pending |
| BTS-12 | P1: delegate_task stub | Tasks | Pending |
| BTS-13 | P2: Secrets filter | Tasks | Pending |

---

## Success Criteria

- [ ] Agent can complete a full read → analyze → write → test cycle using only built-in tools
- [ ] Docker sandbox is used for all bash calls when Docker is available
- [ ] No secrets file is ever sent to any LLM API
