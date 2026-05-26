# Config & Persistence — Tasks

**Spec**: `.specs/features/config-and-persistence/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Parallel (after foundation)

```
T2 complete, then:
  ├── T3 [P]   (skills loader)
  ├── T5 [P]   (SQLite schema)
  └── T8 [P]   (audit logger)
```

### Phase 3: Sequential

```
T3 → T4 (bundled skills)
T5 → T6 → T7
```

---

## Task Breakdown

### T1: Implement agent.md section parser

**What**: Parser that reads `./agent.md` and extracts named `## Section` blocks into a structured object
**Where**: `src/config/agent-md-parser.ts`
**Depends on**: None
**Reuses**: Node.js `fs/promises`

**Done when**:
- [ ] `parseAgentMd(filePath): Promise<AgentMdConfig>` returns `{identity?, rules?, skills: string[], subagents: SubagentConfig[]}`
- [ ] Handles missing file gracefully (returns empty config, no throw)
- [ ] Handles malformed file (missing `##` sections): logs warning, returns empty config
- [ ] Rejects files larger than 50KB with warning: "agent.md is very large — consider splitting into skill files" (loads only first 50KB)
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (full parse, missing file, missing sections, skill list extraction, subagent extraction, 50KB truncation)

**Tests**: unit
**Gate**: quick

---

### T2: Implement system prompt builder

**What**: Function that constructs the final system prompt by combining built-in defaults with agent.md Identity and Rules sections
**Where**: `src/config/system-prompt.ts`
**Depends on**: T1
**Reuses**: AgentMdConfig from T1

**Done when**:
- [ ] `buildSystemPrompt(config: AgentMdConfig, builtinPrompt: string): string` returns composed prompt
- [ ] Identity (if present): prepended before builtin prompt
- [ ] Rules (if present): appended after builtin prompt
- [ ] When no agent.md: returns builtin prompt unchanged
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (no agent.md, identity only, rules only, both)

**Tests**: unit
**Gate**: quick

---

### T3: Implement skills loader [P]

**What**: Module that loads skill markdown files from `./skills/` directory and makes them available for agent context injection
**Where**: `src/config/skills-loader.ts`
**Depends on**: T1
**Reuses**: Node.js `fs/promises`

**Done when**:
- [ ] `loadSkills(skillNames: string[], skillsDir: string): Promise<Skill[]>` reads each `<skillsDir>/<name>.md`
- [ ] Missing skill file: warns `⚠ Skill file not found: skills/<name>.md` and continues
- [ ] Invalid UTF-8: skips file with warning
- [ ] `injectSkill(skill: Skill, messages: Message[]): Message[]` adds skill as a system message
- [ ] Gate check passes: `npm run test` (integration — reads real files)
- [ ] Test count: ≥ 5 integration tests (loads skill, missing skill warning, no skills dir, inject skill, invalid UTF-8)

**Tests**: integration
**Gate**: full

---

### T4: Write 5 bundled starter skill files

**What**: Create the 5 starter skill markdown files included with the CLI
**Where**: `src/skills/code-review.md`, `security-audit.md`, `test-generation.md`, `db-migration.md`, `performance-optimization.md`
**Depends on**: T3
**Reuses**: N/A (content creation)

**Done when**:
- [ ] `code-review.md`: checklist covering readability, DRY, error handling, security, test coverage
- [ ] `security-audit.md`: OWASP top 10 checklist, secrets exposure check, input validation
- [ ] `test-generation.md`: strategy for unit/integration/e2e, test naming, edge case coverage
- [ ] `db-migration.md`: rollback strategy, data integrity checks, zero-downtime patterns
- [ ] `performance-optimization.md`: profiling approach, common bottleneck patterns, measurement criteria
- [ ] All files load successfully via skills loader (verified by running T3's integration test against them)
- [ ] Gate check passes: `npm run build` (no build breakage)

**Tests**: none
**Gate**: build

---

### T5: Create SQLite schema and DB initialization [P]

**What**: SQLite database schema for sessions and messages, with initialization logic
**Where**: `src/persistence/db.ts`, `src/persistence/schema.sql`
**Depends on**: None (independent of T1-T4)
**Reuses**: `better-sqlite3` npm package

**Done when**:
- [ ] Schema: `sessions` table (id TEXT PK, started_at, ended_at, working_dir, initial_model, git_branch, total_cost, input_tokens, output_tokens)
- [ ] Schema: `session_messages` table (id, session_id FK, role, content, tool_name, timestamp)
- [ ] `initDB(dbPath: string): Database` creates `~/.chinacode/` dir if needed, opens/creates DB, runs schema migration (idempotent)
- [ ] Gate check passes: `npm run test` (integration — real SQLite in memory)
- [ ] Test count: ≥ 4 integration tests (creates DB, schema exists after init, idempotent re-init, path creation)

**Tests**: integration
**Gate**: full

---

### T6: Implement session write (create + incremental save)

**What**: Functions to create a new session record and append messages incrementally
**Where**: `src/persistence/session-writer.ts`
**Depends on**: T5
**Reuses**: DB from T5

**Done when**:
- [ ] `createSession(db, config): string` inserts session row, returns UUID
- [ ] `appendMessage(db, sessionId, message)` inserts a message row
- [ ] `finalizeSession(db, sessionId, summary)` updates ended_at, cost, token totals
- [ ] Auto-save: caller responsible for calling `appendMessage` after each exchange (no internal timer needed in this module)
- [ ] Handles DB locked error: retries 3 times with 100ms pause, then warns and continues without persistence
- [ ] Gate check passes: `npm run test` (integration)
- [ ] Test count: ≥ 5 integration tests (create session, append message, finalize, DB locked retry, multiple sessions)

**Tests**: integration
**Gate**: full

---

### T7: Implement session list and resume

**What**: Query functions for listing sessions and loading a session's messages for resume
**Where**: `src/persistence/session-reader.ts`
**Depends on**: T5, T6
**Reuses**: DB from T5

**Done when**:
- [ ] `listSessions(db, limit = 20): SessionSummary[]` returns last N sessions ordered by started_at DESC
- [ ] `loadSession(db, sessionId): Session | null` returns session + all messages, or null if not found
- [ ] `getLastNMessages(session: Session, n: number): Message[]` returns last N messages for display
- [ ] Gate check passes: `npm run test` (integration)
- [ ] Test count: ≥ 5 integration tests (list with data, list empty, load valid, load not found, last N messages)

**Tests**: integration
**Gate**: full

---

### T8: Implement audit logger (JSONL writes) [P]

**What**: Module that appends structured JSONL log entries to `~/.chinacode/logs/YYYY-MM-DD.jsonl` for all tool calls and fallback events
**Where**: `src/logging/audit.ts`
**Depends on**: None (independent)
**Reuses**: Node.js `fs/promises`, `os.homedir()`

**Done when**:
- [ ] `writeAuditEntry(entry: AuditEntry): Promise<void>` appends to today's log file
- [ ] Creates `~/.chinacode/logs/` directory if missing
- [ ] Entry schema: `{timestamp, session_id, event, tool_name?, args_summary?, result_summary?, duration_ms?}`
- [ ] `result_summary` truncated to 2KB
- [ ] Log files older than `LOG_RETENTION_DAYS` (default 30) are deleted on module init
- [ ] Gate check passes: `npm run test` (integration)
- [ ] Test count: ≥ 5 integration tests (creates log dir, writes entry, truncates result, retention cleanup, JSONL format valid)

**Tests**: integration
**Gate**: full

**Commit**: `feat(config): implement agent.md config, skills loader, session persistence, audit log`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2

Phase 2 (Parallel — T3 and T8 are integration/not-parallel-safe; T5 is integration/not-parallel-safe):
  T2 done, then sequentially:
    T3 → T4
    T5 → T6 → T7
    T8 (independent, can run alongside T5 chain)

Note: All integration tests must run sequentially per TESTING.md.
In practice: T3 → T4 (sequential), T5 → T6 → T7 (sequential), T8 (sequential with others in CI)
T1 and T2 can parallelize with T5 chain since they are unit tests.
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: agent.md parser | 1 file | ✅ Granular |
| T2: system prompt builder | 1 file | ✅ Granular |
| T3: skills loader | 1 file | ✅ Granular |
| T4: 5 skill files | 5 markdown files | ✅ Granular (content only) |
| T5: SQLite schema + init | 2 files, 1 concept | ✅ Granular |
| T6: session writer | 1 file | ✅ Granular |
| T7: session reader | 1 file | ✅ Granular |
| T8: audit logger | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 [P] | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | T2 → T5 [P] | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5, T6 | T6 → T7 | ✅ Match |
| T8 | None | T2 → T8 [P] | ✅ Match |

---

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | agent.md parser | unit | unit | ✅ OK |
| T2 | System prompt builder | unit | unit | ✅ OK |
| T3 | Skills loader (file reads) | integration | integration | ✅ OK |
| T4 | Markdown content files | none | none | ✅ OK |
| T5 | SQLite schema + init | integration | integration | ✅ OK |
| T6 | Session writer | integration | integration | ✅ OK |
| T7 | Session reader | integration | integration | ✅ OK |
| T8 | Audit logger (file writes) | integration | integration | ✅ OK |
