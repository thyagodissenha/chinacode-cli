# Multi-Model & Routing — Tasks

**Spec**: `.specs/features/multi-model-and-routing/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Parallel Resilience

```
T2 complete, then:
  ├── T3 [P]   (retry handler)
  └── T4 [P]   (error message mapper)
```

### Phase 3: Sequential

```
T3 + T4 done → T5 → T6
```

---

## Task Breakdown

### T1: Create ModelClient factory and provider configs

**What**: Factory function that creates a configured OpenAI SDK client for each provider (DashScope, DeepSeek, Ollama) from environment variables
**Where**: `src/models/client.ts`, `src/models/providers.ts`
**Depends on**: None
**Reuses**: `openai` npm package

**Done when**:
- [ ] `createModelClient(provider: ProviderConfig): OpenAI` creates a client with correct `baseURL` and `apiKey`
- [ ] Provider defaults: DashScope (`https://dashscope.aliyuncs.com/compatible-mode/v1`), DeepSeek (`https://api.deepseek.com`), Ollama (`http://localhost:11434/v1`, no key)
- [ ] Config loaded from env: `DASHSCOPE_API_KEY`, `DEEPSEEK_API_KEY`, `OLLAMA_BASE_URL`, `OPENAI_API_KEY`+`OPENAI_BASE_URL` (generic override)
- [ ] All calls use streaming by default
- [ ] Gate check passes: `npm run build`

**Tests**: unit
**Gate**: build

---

### T2: Implement keyword-based model router

**What**: Function that selects the right model tier based on message content analysis
**Where**: `src/models/router.ts`
**Depends on**: T1
**Reuses**: provider configs from T1

**Done when**:
- [ ] `routeModel(message: string, config: RouterConfig): ModelSelection` returns `{model, provider, tier}`
- [ ] Reasoning keywords (`debug`, `analyze`, `refactor`, `explain`, `why`, `reason`, `trace`) → `REASONING_MODEL` (default: `deepseek-reasoner`)
- [ ] Simple keywords (`read`, `list`, `search`, `find`, `show`, `get`) → `FAST_MODEL` (default: `qwen-turbo`)
- [ ] `LOCAL_ENABLED=true` + trivial patterns → `LOCAL_MODEL` via Ollama
- [ ] Default: `DEFAULT_MODEL` (default: `qwen-plus`)
- [ ] `/model <name>` override stored in session state; bypasses routing
- [ ] Emits log line: `[model: <name>]` to status output
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 7 unit tests (each tier, override, local disabled, case-insensitive keywords, default fallback)

**Tests**: unit
**Gate**: quick

---

### T3: Implement retry handler with exponential backoff [P]

**What**: Higher-order function that wraps any async call with retry logic (1s → 4s → 16s with jitter) for transient errors
**Where**: `src/models/retry.ts`
**Depends on**: T1
**Reuses**: N/A

**Done when**:
- [ ] Retries on: 429, 500, 502, 503, 504, `ECONNRESET`, `ETIMEDOUT`
- [ ] Does NOT retry on: 400, 401, 403, 404
- [ ] Backoff: attempt 1 immediately, attempt 2 after 1s±500ms jitter, attempt 3 after 4s±500ms, attempt 4 after 16s±500ms
- [ ] Shows progress: `⟳ Rate limited — retrying in 4s (attempt 2/3)…`
- [ ] After 3 retries: throws error with all attempt details for fallback chain
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (success first try, success after retry, all fail, permanent error no retry, jitter in range, progress message)

**Tests**: unit
**Gate**: quick

---

### T4: Implement actionable error message mapper [P]

**What**: Function that maps raw API error codes/HTTP statuses to user-friendly actionable messages with fix instructions
**Where**: `src/models/error-messages.ts`
**Depends on**: T1

**Done when**:
- [ ] Maps `InvalidApiKey`/`invalid_api_key` → provider-specific fix with link + example `.env` line
- [ ] Maps `Arrearage` → billing link + "Account has outstanding balance"
- [ ] Maps `DataInspectionFailed` → "Content was blocked by provider safety filter. Rephrase your request."
- [ ] Maps `context_length_exceeded` → triggers compaction (returns special flag for loop to handle)
- [ ] Maps `ModelNotFound` → lists available models for the provider
- [ ] Maps `Throttling.RateQuota`/`limit_requests` → "Rate limit exceeded. Try /model qwen-turbo"
- [ ] Maps `FreeTierOnly` → "Free tier quota exhausted. Upgrade or switch provider."
- [ ] Unknown errors → generic message with raw code included
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 8 unit tests (one per error category + unknown)

**Tests**: unit
**Gate**: quick

---

### T5: Implement circuit breaker

**What**: Stateful circuit breaker per provider: tracks consecutive failures, opens circuit after threshold, probes after cooldown
**Where**: `src/models/circuit-breaker.ts`
**Depends on**: T3, T4
**Reuses**: N/A

**Done when**:
- [ ] `CircuitBreaker` class: `call(fn)`, `getState(): 'closed'|'open'|'half-open'`
- [ ] Opens after 5 consecutive failures within 60s
- [ ] While open: immediately throws with `{degraded: true}` for fallback chain to catch
- [ ] Shows warning: `⚠ <provider> is degraded — routing to fallback`
- [ ] After 60s: sends probe (half-open state)
- [ ] Probe success → closed; probe fail → resets 60s timer
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (stays closed, opens at threshold, probe success, probe fail, resets on success, degraded warning)

**Tests**: unit
**Gate**: quick

---

### T6: Implement fallback chain orchestrator

**What**: Function that combines router + retry + circuit breaker + error mapper into a single `callModel()` function used by the agent loop
**Where**: `src/models/index.ts`
**Depends on**: T2, T3, T4, T5
**Reuses**: All above modules

**Done when**:
- [ ] `callModel(messages, session): AsyncGenerator<StreamEvent>` is the single entry point for the loop
- [ ] Applies router to pick primary model
- [ ] Applies retry handler around the API call
- [ ] Catches `{degraded: true}` → switches to fallback model (configured via `FALLBACK_MODEL`)
- [ ] When both primary and fallback fail → throws final error with `formatError()` from T4
- [ ] Passes AbortSignal through for Ctrl+C cancellation
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 5 unit tests (primary success, fallback triggered, both fail, abort signal, model display)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(models): implement multi-provider client, intelligent routing, retry, circuit breaker`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2

Phase 2 (Parallel — unit tests, safe):
  T2 done, then:
    ├── T3 [P]
    └── T4 [P]

Phase 3 (Sequential):
  T3 + T4 → T5 → T6
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: client factory + configs | 2 files, 1 concept | ✅ Granular |
| T2: model router | 1 file | ✅ Granular |
| T3: retry handler | 1 file | ✅ Granular |
| T4: error message mapper | 1 file | ✅ Granular |
| T5: circuit breaker | 1 file | ✅ Granular |
| T6: orchestrator entry point | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 [P] | ✅ Match |
| T4 | T1 | T2 → T4 [P] | ✅ Match |
| T5 | T3, T4 | T3+T4 → T5 | ✅ Match |
| T6 | T2, T3, T4, T5 | T5 → T6 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Client factory | unit | build | ✅ OK (no behavior to mock yet) |
| T2 | Model router | unit | unit | ✅ OK |
| T3 | Retry handler | unit | unit | ✅ OK |
| T4 | Error mapper | unit | unit | ✅ OK |
| T5 | Circuit breaker | unit | unit | ✅ OK |
| T6 | Orchestrator | unit | unit | ✅ OK |
