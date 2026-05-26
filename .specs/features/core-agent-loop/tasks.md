# Core Agent Loop — Tasks

**Spec**: `.specs/features/core-agent-loop/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3 → T4
```

### Phase 2: Parallel Core

```
T4 complete, then:
  ├── T5 [P]   (loop orchestrator)
  └── T6 [P]   (audit logger)
```

### Phase 3: Integration

```
T5 + T6 complete → T7
```

---

## Task Breakdown

### T1: Create tool call types and Zod schemas

**What**: Define TypeScript types and Zod schemas for tool calls, tool results, and agent messages
**Where**: `src/types/agent.ts`
**Depends on**: None
**Reuses**: N/A (greenfield)
**Requirement**: CAL-07, CAL-08, CAL-09

**Done when**:
- [ ] `ToolCall`, `ToolResult`, `AgentMessage` types exported
- [ ] Zod schemas: `toolCallSchema`, `nativeToolCallSchema`
- [ ] No TypeScript errors (`npm run build`)

**Tests**: unit
**Gate**: build

---

### T2: Implement streaming handler

**What**: Function that reads an OpenAI streaming response, accumulates tokens, detects tool call chunks, and emits events (token, tool_call, done)
**Where**: `src/agent/streaming.ts`
**Depends on**: T1
**Reuses**: `openai` SDK streaming API

**Done when**:
- [ ] Handles delta chunks: `content` tokens emitted as they arrive
- [ ] Detects and accumulates `tool_calls` from stream deltas
- [ ] Emits `tool_call` event with complete call when stream ends
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 5 unit tests pass (token streaming, tool call accumulation, empty response, multi-tool, error)

**Tests**: unit
**Gate**: quick

---

### T3: Implement native tool call parser

**What**: Parser that extracts structured tool calls from the accumulated streaming result in native OpenAI format
**Where**: `src/agent/parsers/native.ts`
**Depends on**: T1
**Reuses**: Zod schemas from T1

**Done when**:
- [ ] Validates tool call against `toolCallSchema`; returns typed `ToolCall[]`
- [ ] Returns empty array when no tool calls present
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 3 unit tests (valid call, missing fields, multiple calls)

**Tests**: unit
**Gate**: quick

---

### T4: Implement markdown fallback tool call parser

**What**: Parser that extracts tool calls from ` ```json ``` ` blocks in model text output when native parsing finds no tool calls
**Where**: `src/agent/parsers/fallback.ts`
**Depends on**: T1
**Reuses**: Zod schemas from T1

**Done when**:
- [ ] Detects ` ```json ``` ` blocks in text content
- [ ] Parses JSON and validates against `toolCallSchema`
- [ ] Returns `{calls: ToolCall[], usedFallback: boolean}`
- [ ] Logs warning when fallback is used: `⚠ Tool call via fallback parser`
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 5 unit tests (valid block, invalid JSON, schema mismatch, no block, multiple blocks)

**Tests**: unit
**Gate**: quick

---

### T5: Implement AgentLoop orchestrator [P]

**What**: Class that drives the ReAct iteration cycle: call model → parse tool calls → execute tools → add observations → repeat until final answer or limit
**Where**: `src/agent/loop.ts`
**Depends on**: T2, T3, T4
**Reuses**: streaming handler, parsers

**Done when**:
- [ ] Runs up to `maxIterations` (default 15) iterations
- [ ] Detects infinite loop: same tool + args repeated 3× consecutively → stops with warning
- [ ] On final text response (no tool calls): stops and returns answer
- [ ] Respects Ctrl+C cancellation via AbortSignal
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 8 unit tests (single turn, multi-turn, max iterations, infinite loop detection, Ctrl+C abort, empty response, tool error recovery, final answer)

**Tests**: unit
**Gate**: quick

---

### T6: Implement audit logger [P]

**What**: Module that writes structured JSONL entries to `~/.chinacode/logs/YYYY-MM-DD.jsonl`
**Where**: `src/logging/audit.ts`
**Depends on**: T1
**Reuses**: Node.js `fs/promises`, `os.homedir()`

**Done when**:
- [ ] Creates `~/.chinacode/logs/` directory if missing
- [ ] Writes valid JSONL: one JSON object per line with `{timestamp, session_id, event, tool?, args_summary?, result_summary?, duration_ms}`
- [ ] Result summary truncated to 2KB max
- [ ] Marks fallback parse events with `"event": "fallback_parse"`
- [ ] Gate check passes: `npm run test` (integration)
- [ ] Test count: ≥ 4 integration tests (creates dir, writes entry, truncates result, fallback event)

**Tests**: integration
**Gate**: full

---

### T7: Wire loop + parsers + logger into main agent entry point

**What**: Create the exported `runAgent(messages, config)` function that combines streaming handler, parsers, loop orchestrator, and audit logger into the single callable used by the REPL
**Where**: `src/agent/index.ts`
**Depends on**: T5, T6
**Reuses**: All above modules

**Done when**:
- [ ] `runAgent` accepts messages array, model client, tool registry, config
- [ ] Returns async generator yielding: `{type: 'token', content}` | `{type: 'tool_start', name}` | `{type: 'tool_end', result}` | `{type: 'done', finalText}`
- [ ] Audit logger is called for every tool invocation
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 3 unit tests (full turn, tool call turn, abort mid-turn)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(agent): implement ReAct loop with streaming and fallback tool call parser`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T3 → T4

Phase 2 (Parallel — unit test safe):
  T4 complete, then:
    ├── T5 [P]  (loop orchestrator)
    └── T6 [P]  (audit logger — integration, NOT parallel with other integration tests)

Phase 3 (Sequential):
  T5 + T6 done → T7
```

Note: T6 is integration (Parallel-Safe: No per TESTING.md) so it should run sequentially with other integration tests, but T5 is unit and can truly parallelize.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Create types and schemas | 1 file, 1 concept | ✅ Granular |
| T2: Streaming handler | 1 file, 1 function | ✅ Granular |
| T3: Native parser | 1 file, 1 function | ✅ Granular |
| T4: Fallback parser | 1 file, 1 function | ✅ Granular |
| T5: AgentLoop class | 1 file, 1 class | ✅ Granular |
| T6: Audit logger | 1 file, 1 module | ✅ Granular |
| T7: Entry point wiring | 1 file, integration of above | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 | ✅ Match |
| T4 | T1 | T3 → T4 | ✅ Match |
| T5 | T2, T3, T4 | T4 → T5 [P] | ✅ Match |
| T6 | T1 | T4 → T6 [P] | ✅ Match |
| T7 | T5, T6 | T5+T6 → T7 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer Created | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Types/schemas only | build | build | ✅ OK |
| T2 | Streaming handler | unit | unit | ✅ OK |
| T3 | Native parser | unit | unit | ✅ OK |
| T4 | Fallback parser | unit | unit | ✅ OK |
| T5 | AgentLoop | unit | unit | ✅ OK |
| T6 | Audit logger (file I/O) | integration | integration | ✅ OK |
| T7 | Entry point wiring | unit | unit | ✅ OK |
