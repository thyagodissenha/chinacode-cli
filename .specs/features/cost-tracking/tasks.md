# Cost Tracking — Tasks

**Spec**: `.specs/features/cost-tracking/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Integration Layer

```
T2 done → T3 → T4 → T5
```

---

## Task Breakdown

### T1: Create CostTracker class

**What**: Stateful class that accumulates token counts per model and computes USD cost for a session
**Where**: `src/cost/tracker.ts`
**Depends on**: None
**Reuses**: N/A

**Done when**:
- [ ] `addUsage(model, inputTokens, outputTokens)` accumulates counts
- [ ] `getSessionCost(): SessionCost` returns per-model and total cost
- [ ] `getCostForTurn(model, inputTokens, outputTokens): number` returns turn cost in USD
- [ ] When `usage` is null/absent: estimates from char count (`Math.ceil(chars / 4)`) and marks `estimated: true`
- [ ] Handles multiple models in same session correctly (separate per-model buckets)
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (single model, multi-model, estimation fallback, zero cost, cumulative, turn cost)

**Tests**: unit
**Gate**: quick

---

### T2: Implement bundled price table and .env price override

**What**: Loads bundled default prices from `model-prices.json` and allows overrides via `PRICE_<MODEL>_INPUT` and `PRICE_<MODEL>_OUTPUT` env vars
**Where**: `src/cost/prices.ts`, `src/cost/model-prices.json`
**Depends on**: T1
**Reuses**: N/A

**Done when**:
- [ ] `model-prices.json` contains default prices for: qwen-plus, qwen-max, qwen-turbo, qwen3-max, qwen2.5-coder, deepseek-chat, deepseek-reasoner, ollama/* (0.00)
- [ ] `getPrice(model: string): {input: number, output: number, estimated: boolean}` checks env overrides first, then bundled, then marks `estimated: true` if neither found
- [ ] Env override format: `PRICE_QWEN_PLUS_INPUT=0.40` (model name uppercased, hyphens to underscores)
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 5 unit tests (bundled price, env override, unknown model estimated, ollama zero, case normalization)

**Tests**: unit
**Gate**: quick

---

### T3: Wire CostTracker into REPL status bar

**What**: Integrates CostTracker with the REPL layout to update the status bar after each turn
**Where**: `src/repl/status-bar.ts`
**Depends on**: T1, T2
**Reuses**: layout from TUI feature, CostTracker

**Done when**:
- [ ] `updateStatusBar(tracker: CostTracker)` renders: `tokens: X in / Y out | session: $0.0031`
- [ ] When cost rounds to `$0.0000` shows `< $0.0001`
- [ ] Status bar updates within 50ms of each turn completing
- [ ] `(est.)` suffix appended when any usage was estimated
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (normal display, sub-cent display, estimated marker, multi-model)

**Tests**: unit
**Gate**: quick

---

### T4: Implement session summary on exit

**What**: Renders a formatted cost summary when the user types `/exit`
**Where**: `src/cost/summary.ts`
**Depends on**: T1, T2, T3
**Reuses**: CostTracker, chalk

**Done when**:
- [ ] `renderSessionSummary(tracker): string` returns formatted table: duration, total turns, input/output tokens, per-model cost, total USD
- [ ] Total cost > $1.00: highlighted yellow
- [ ] Total cost > $5.00: highlighted red + tip to use qwen-turbo
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (cheap session, >$1 yellow, >$5 red+tip, multi-model breakdown)

**Tests**: unit
**Gate**: quick

---

### T5: Implement /export to JSON and CSV

**What**: Export function that writes session cost and message data to a file
**Where**: `src/cost/export.ts`
**Depends on**: T1, T2
**Reuses**: Node.js `fs/promises`

**Done when**:
- [ ] `exportSession(tracker, messages, format: 'json'|'csv'): Promise<string>` writes file and returns path
- [ ] JSON output: `{session: {id, started_at, duration_s}, turns: [{model, input_tokens, output_tokens, cost_usd, timestamp}], totals: {input_tokens, output_tokens, total_cost_usd}}`
- [ ] CSV output: flat rows with same fields
- [ ] File named: `chinacode-export-<ISO-date>.<ext>` in current working directory
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (JSON output, CSV output, empty session, file path format)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(cost): implement token tracking, configurable pricing, session summary, export`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2

Phase 2 (Sequential — each depends on prior):
  T2 → T3 → T4 → T5
```

Note: All tasks are unit-test-safe, but the dependency chain is strictly sequential.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: CostTracker class | 1 file | ✅ Granular |
| T2: price table + .env override | 2 files (code + data) | ✅ Granular |
| T3: status bar integration | 1 file | ✅ Granular |
| T4: session summary | 1 file | ✅ Granular |
| T5: export JSON/CSV | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T2 → T3 | ✅ Match |
| T4 | T1, T2, T3 | T3 → T4 | ✅ Match |
| T5 | T1, T2 | T4 → T5 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | CostTracker (pure logic) | unit | unit | ✅ OK |
| T2 | Price table + env | unit | unit | ✅ OK |
| T3 | Status bar render | unit | unit | ✅ OK |
| T4 | Summary render | unit | unit | ✅ OK |
| T5 | File export | unit | unit | ✅ OK |
