# Config & Persistence Specification

## Problem Statement

The ChinaCode CLI differentiates itself from generic wrappers through deep customization via a Markdown-based configuration file (`agent.md`) and specialized skill documents. Without this system, every user gets the same generic agent behavior regardless of their project's needs. Additionally, without session persistence, every restart loses all context — making multi-hour tasks impossible.

## Goals

- [ ] Parse `agent.md` from the project root and inject Identity, Rules, Skills, and Subagent definitions into the agent's system prompt
- [ ] Load `./skills/*.md` files as injectable knowledge documents selectable by the agent
- [ ] Persist all session message history, metadata, and cost to SQLite at `~/.chinacode/sessions.db`

## Out of Scope

| Feature | Reason |
|---|---|
| Subagent execution engine | Phase 2 (agent.md `[Subagents]` section is parsed but not executed in M1) |
| Skills marketplace / remote skills | Phase 3 |
| Cloud session sync | Phase 5 (SaaS) |
| Context summarization with compaction | Phase 2 |
| Git-aware system prompt injection | Phase 2 |

---

## User Stories

### P1: agent.md Parser ⭐ MVP

**User Story**: As a developer, I want to drop an `agent.md` file in my project root and have the CLI automatically adopt that agent's identity, rules, and available skills — so each project gets a tailored agent without code changes.

**Acceptance Criteria**:

1. WHEN the CLI starts and `./agent.md` exists THEN it SHALL be read and parsed into sections: `## Identity`, `## Rules`, `## Skills`, `## Subagents`
2. WHEN the `Identity` section is present THEN its content SHALL be prepended to the system prompt as the agent's persona
3. WHEN the `Rules` section is present THEN its content SHALL be appended to the system prompt as behavioral constraints
4. WHEN the `Skills` section lists skill names THEN the CLI SHALL look up matching files in `./skills/<name>.md` and make them available for injection
5. WHEN no `agent.md` is found THEN the CLI SHALL use the default system prompt (built-in agent identity)
6. WHEN `agent.md` is malformed (missing `##` headings) THEN the CLI SHALL warn and fall back to defaults without crashing

**Independent Test**: Create `agent.md` with `## Identity\nYou are a security-focused agent.` — agent's first response reflects the persona.

---

### P1: Skills Loader ⭐ MVP

**User Story**: As a developer, I want to create skill documents in `./skills/` that the agent can reference when performing specialized tasks (like security audits or DB migrations).

**Acceptance Criteria**:

1. WHEN a skill is listed in `agent.md`'s `## Skills` section THEN the CLI SHALL load `./skills/<skill-name>.md` at startup
2. WHEN the agent decides to apply a skill THEN the skill's markdown content SHALL be injected into the context for that turn
3. WHEN a skill file is not found THEN the CLI SHALL warn: "⚠ Skill file not found: skills/<name>.md" and continue without it
4. WHEN the user asks for a skill explicitly ("do a security audit") THEN the agent SHALL automatically inject the matching skill document
5. WHEN no `./skills/` directory exists THEN the CLI SHALL continue normally with no skills loaded

**Bundled starter skills (written in M1):**
- `code-review.md` — checklist for code quality review
- `test-generation.md` — strategy for writing tests
- `db-migration.md` — safe migration procedures
- `security-audit.md` — OWASP-based security checklist
- `performance-optimization.md` — profiling and optimization steps

**Independent Test**: Create `./skills/code-review.md`, ask agent to "review auth.ts" — skill content appears in the agent's analysis approach.

---

### P1: Session Persistence — Save ⭐ MVP

**User Story**: As a developer, I want the CLI to automatically save my session so I can resume a long task after a crash or coffee break.

**Acceptance Criteria**:

1. WHEN the CLI starts THEN it SHALL create/open `~/.chinacode/sessions.db` (SQLite)
2. WHEN a session starts THEN a session record SHALL be created with: id (UUID), started_at, working_dir, initial_model, git_branch (if in git repo)
3. WHEN each exchange completes THEN the message SHALL be appended to `session_messages` table with: session_id, role (user/assistant/tool), content, tool_name (if applicable), timestamp
4. WHEN every 10th exchange completes THEN an auto-save checkpoint SHALL be written (in addition to incremental saves)
5. WHEN the session ends (exit or crash) THEN the session record SHALL be updated with: ended_at, total_cost, total_input_tokens, total_output_tokens

**Independent Test**: Run 5 exchanges, kill the process, check `sessions.db` — all 5 messages are present.

---

### P1: Session Persistence — Resume ⭐ MVP

**User Story**: As a developer, I want to list past sessions and resume any of them, so I can continue a task exactly where I left off.

**Acceptance Criteria**:

1. WHEN `/sessions` is entered THEN the CLI SHALL list the last 20 sessions: id (short), date, working_dir, model, total cost, message count
2. WHEN `/resume <id>` is entered THEN the CLI SHALL load that session's message history into the active context and show the last 5 messages
3. WHEN `/resume <id>` is entered and the session doesn't exist THEN the CLI SHALL show: "Session <id> not found."
4. WHEN a resumed session's model is different from the current configured model THEN the CLI SHALL warn: "Resuming with <original model> — use /model to change"

**Independent Test**: Exit session, start new session, `/sessions` shows the first one, `/resume <id>` restores context.

---

### P2: Audit Log

**User Story**: As a developer, I want all agent actions logged to a structured JSONL file, so I can audit what the agent did in any past session.

**Acceptance Criteria**:

1. WHEN any tool is called THEN a log entry SHALL be written to `~/.chinacode/logs/YYYY-MM-DD.jsonl` with: timestamp, session_id, event type, tool name, args summary (no secrets), result summary (truncated 2KB), duration_ms
2. WHEN logs exceed 30 days old THEN the CLI SHALL delete them on startup (configurable via `LOG_RETENTION_DAYS`)
3. WHEN the log directory doesn't exist THEN it SHALL be created automatically

---

## Edge Cases

- WHEN `agent.md` is larger than 50KB THEN the CLI SHALL warn: "agent.md is very large — consider splitting into skill files" and load only the first 50KB
- WHEN `~/.chinacode/sessions.db` is locked by another process THEN the CLI SHALL retry 3 times then continue without persistence (warn the user)
- WHEN `./skills/` contains a skill file with invalid UTF-8 THEN skip that file with a warning
- WHEN `/resume` is called mid-session (session already active) THEN CLI SHALL ask: "Replace current session? [Y/N]"

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CAP-01 | P1: agent.md — section parsing | Tasks | Pending |
| CAP-02 | P1: agent.md — system prompt injection | Tasks | Pending |
| CAP-03 | P1: agent.md — fallback on missing/malformed | Tasks | Pending |
| CAP-04 | P1: Skills loader — file loading | Tasks | Pending |
| CAP-05 | P1: Skills loader — context injection | Tasks | Pending |
| CAP-06 | P1: Skills loader — bundled starter skills | Tasks | Pending |
| CAP-07 | P1: Session save — DB schema + creation | Tasks | Pending |
| CAP-08 | P1: Session save — incremental writes | Tasks | Pending |
| CAP-09 | P1: Session resume — /sessions list | Tasks | Pending |
| CAP-10 | P1: Session resume — /resume <id> | Tasks | Pending |
| CAP-11 | P2: Audit log — JSONL writes | Tasks | Pending |

---

## Success Criteria

- [ ] An agent.md file with Identity + Rules changes the agent's behavior measurably in the first response
- [ ] A session survives a process kill (SIGKILL) with all messages recoverable from SQLite
- [ ] `/sessions` lists correctly after 3 separate sessions, and each is resumable
