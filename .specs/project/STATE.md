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
- [ ] Mapear as features do Milestone 1 em especificações locais e tarefas atômicas (.specs/features/)
- [ ] Implementar o Milestone 1 — Foundation

---

## Lessons Learned

_None yet — project just initialized from clean PRD slate._

---

## Deferred Ideas

- Benchmark mode `/bench` (compare models on same task) → Phase 3
- RAG local with embeddings → Phase 3
- LSP integration → Phase 2
- Prometheus metrics endpoint → Phase 3
- Local dashboard `/stats` → Phase 3

---

## Preferences

- _Model guidance: validation/state tasks work well with faster/cheaper models._
