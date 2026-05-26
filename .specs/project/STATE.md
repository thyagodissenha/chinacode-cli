# Project State

_Persistent memory across sessions. Updated as decisions are made, blockers surface, and lessons are learned._

---

## Decisions

- **ADR-001: readline+chalk over Ink/React** — Chosen for stability, fewer rendering bugs, smaller bundle. Trade-off: fewer advanced visual features, acceptable for terminal use case.
- **ADR-002: Docker as default sandbox** — Real kernel-level isolation vs. logical-only. Requires Docker installed; mitigated by local fallback with explicit warning.
- **ADR-003: SQLite for persistence** — Zero-config, embedded, native SQL. Doesn't scale for multi-user (irrelevant: single-user CLI).
- **ADR-004: MCP as extension standard** — Open standard with growing adoption, vendor-neutral. Trade-off: learning curve for plugin developers.
- **ADR-005: openai SDK as API client** — Covers all target APIs (DashScope, DeepSeek, SiliconFlow) via OpenAI-compat. Avoids maintaining multiple SDK adapters.

---

## Blockers

_None currently._

---

## Todos

- [ ] Scaffold project structure (src/, tests/, package.json, tsconfig.json)
- [ ] Implement features per Linear issues IA-86 to IA-137 (46 atomic tasks across 6 features)

**Specs created (2026-05-25):**
- `.specs/features/core-agent-loop/` — spec.md + tasks.md (7 tasks → IA-92 to IA-98)
- `.specs/features/built-in-tools-and-sandbox/` — spec.md + tasks.md (11 tasks → IA-105 to IA-115)
- `.specs/features/multi-model-and-routing/` — spec.md + tasks.md (6 tasks → IA-99 to IA-104)
- `.specs/features/tui-and-ux/` — spec.md + tasks.md (9 tasks → IA-116 to IA-124)
- `.specs/features/cost-tracking/` — spec.md + tasks.md (5 tasks → IA-125 to IA-129)
- `.specs/features/config-and-persistence/` — spec.md + tasks.md (8 tasks → IA-130 to IA-137)
- `.specs/codebase/TESTING.md` — Vitest conventions, test coverage matrix, gate commands

**Linear project:** "ChinaCode CLI — M1: Foundation" (IA-86 to IA-137)
- 6 epic issues (IA-86 to IA-91), 46 sub-issues
- All in Backlog status, ready to implement

---

## Lessons Learned

_None yet — project just initialized._

---

## Deferred Ideas

- Benchmark mode `/bench` (compare models on same task) → Phase 3
- RAG local with embeddings → Phase 3
- LSP integration → Phase 2
- Prometheus metrics endpoint → Phase 3
- Local dashboard `/stats` → Phase 3

---

## Preferences

_Model guidance tip already shared: validation/state tasks work well with faster/cheaper models._
