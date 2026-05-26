# Testing Strategy

**Runtime:** Node.js 20+ / TypeScript 5+ ESM
**Framework:** Vitest (native ESM, TypeScript, fast)
**Coverage:** c8 (built into Vitest)

---

## Gate Check Commands

| Gate | Command | When to Use |
|---|---|---|
| quick | `npm run test:quick` | Unit tests only — after each atomic task |
| full | `npm run test` | All tests — before marking task Done |
| build | `npm run build` | Type-check only — for config/schema tasks |

```json
// package.json scripts (to be added during scaffold task)
{
  "test:quick": "vitest run --reporter=verbose",
  "test": "vitest run --coverage",
  "build": "tsc --noEmit"
}
```

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Parallel-Safe | Notes |
|---|---|---|---|
| Tool implementations (bash, read_file, etc.) | unit | Yes | Mock fs, child_process |
| AgentLoop | unit | Yes | Mock model client + tool executor |
| ModelClient / router | unit | Yes | Mock OpenAI SDK responses |
| RetryHandler / CircuitBreaker | unit | Yes | Use fake timers |
| CostTracker | unit | Yes | Pure functions, no I/O |
| agent.md parser | unit | Yes | Parse markdown strings |
| Skills loader | integration | No | Reads real files on disk |
| SessionDB (SQLite) | integration | No | Real SQLite in-memory or temp file |
| readline REPL / TUI | none | — | Not unit-testable; verify manually |
| Onboarding wizard | integration | No | Requires stdin mock + temp .env |
| Docker sandbox | integration | No | Requires Docker; skip in CI without Docker |
| Slash command dispatcher | unit | Yes | Mock REPL output |
| Diff renderer | unit | Yes | String comparison |
| Audit logger | integration | No | Real file writes to temp dir |

---

## Parallelism Assessment

| Test Type | Parallel-Safe | Reason |
|---|---|---|
| unit | Yes | No shared state, no I/O |
| integration | No | May share temp dirs, SQLite files, ports |
| none | — | Not applicable |

---

## File Conventions

- Test files co-located with source: `src/tools/bash.test.ts` next to `src/tools/bash.ts`
- Test helpers in `src/__tests__/helpers/`
- Fixtures in `src/__tests__/fixtures/`
- Integration tests in `src/__tests__/integration/`

---

## What NOT to Test

- readline REPL rendering (test manually)
- Docker container internals (test the integration boundary only)
- External API responses (always mock the OpenAI SDK)
- `.env` file parsing from the real filesystem (use env vars in tests)
