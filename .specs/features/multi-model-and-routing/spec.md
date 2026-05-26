# Multi-Model & Routing Specification

## Problem Statement

The CLI's core differentiator is first-class support for Chinese LLMs across multiple providers. Without a unified model layer, developers must manually configure each provider, handle their quirks, and lose hours when an API is down. Transparent routing and resilient error handling turn a fragile single-model client into a reliable multi-provider system.

## Goals

- [ ] Support DashScope (Qwen), DeepSeek, and Ollama out of the box with zero extra config beyond API key
- [ ] Route requests intelligently to the right model tier (reasoning / fast / default / local) based on task intent
- [ ] Recover automatically from transient API failures via retry + fallback, with actionable error messages for permanent failures

## Out of Scope

| Feature | Reason |
|---|---|
| SiliconFlow / Together AI / LM Studio | P1 providers in Phase 3 |
| vLLM / SGLang | P1 providers in Phase 3 |
| Model benchmarking (`/bench`) | Phase 3 |
| Partner API key management | Not planned for M1 |

---

## User Stories

### P1: Multi-Provider OpenAI-Compat Client ⭐ MVP

**User Story**: As a developer, I want to configure any supported provider with just a base URL and API key, and have the CLI handle all provider-specific quirks transparently.

**Why P1**: Without a working API client, nothing functions.

**Acceptance Criteria**:

1. WHEN `OPENAI_API_KEY` and `OPENAI_BASE_URL` are set THEN the CLI SHALL connect to that provider using the `openai` SDK
2. WHEN `DASHSCOPE_API_KEY` is set (without base URL) THEN the CLI SHALL default `base_url` to `https://dashscope.aliyuncs.com/compatible-mode/v1`
3. WHEN `DEEPSEEK_API_KEY` is set THEN the CLI SHALL default `base_url` to `https://api.deepseek.com`
4. WHEN `OLLAMA_BASE_URL` is set (or defaults to `http://localhost:11434/v1`) THEN the CLI SHALL connect without an API key
5. WHEN a model is called THEN the CLI SHALL use streaming by default (never blocking fetch)

**Independent Test**: Set `DASHSCOPE_API_KEY`, send "hello" — response arrives from qwen-plus.

---

### P1: Intelligent Model Routing ⭐ MVP

**User Story**: As a developer, I want the CLI to automatically select the cheapest appropriate model for each task (e.g. fast model for simple lookups, reasoning model for debugging), so I'm not burning expensive tokens on trivial requests.

**Acceptance Criteria**:

1. WHEN the user's message contains reasoning keywords (`debug`, `analyze`, `refactor`, `explain`, `why`, `reason`) THEN the CLI SHALL route to the configured `REASONING_MODEL` (default: `deepseek-reasoner`)
2. WHEN the message contains simple-task keywords (`read`, `list`, `search`, `find`, `show`) THEN the CLI SHALL route to `FAST_MODEL` (default: `qwen-turbo`)
3. WHEN `LOCAL_ENABLED=true` and the message matches trivial patterns THEN the CLI SHALL route to `LOCAL_MODEL` via Ollama
4. WHEN none of the above rules match THEN the CLI SHALL use `DEFAULT_MODEL` (default: `qwen-plus`)
5. WHEN routing occurs THEN the CLI SHALL display which model is being used: `[model: qwen-turbo]`
6. WHEN `/model <name>` is used THEN that model SHALL override routing for the rest of the session

**Independent Test**: Type "debug this function" — routing log shows `deepseek-reasoner`.

---

### P1: Retry with Exponential Backoff ⭐ MVP

**User Story**: As a developer, I want transient API errors (rate limits, server errors) to be retried automatically, so I don't have to re-submit my request after a 429.

**Acceptance Criteria**:

1. WHEN a request returns 429 THEN the CLI SHALL wait 1s and retry, then 4s, then 16s (with ±500ms jitter each time)
2. WHEN a request returns 500, 502, 503, 504, or a network error THEN the same retry schedule SHALL apply
3. WHEN all 3 retries fail THEN the CLI SHALL attempt the fallback model (if configured)
4. WHEN retrying THEN the CLI SHALL show: `⟳ Rate limited — retrying in 4s (attempt 2/3)…`
5. WHEN a request returns 400, 401, 403, or 404 THEN the CLI SHALL NOT retry (these are permanent failures)

**Independent Test**: Mock a 429 response — CLI shows retry countdown and eventually succeeds or falls back.

---

### P1: Actionable Error Messages ⭐ MVP

**User Story**: As a developer, I want clear, actionable guidance when an API call fails permanently, so I know exactly what to fix without reading API docs.

**Acceptance Criteria**:

1. WHEN `InvalidApiKey` / `invalid_api_key` (401) is received THEN the CLI SHALL display: provider name, "API key is invalid or expired", link to obtain a new key, example `.env` line
2. WHEN `limit_requests` / `Throttling.RateQuota` (429) is received after all retries THEN the CLI SHALL display: "Rate limit exceeded for <model>. Try switching to a cheaper model with `/model <name>`."
3. WHEN `context_length_exceeded` (400) is received THEN the CLI SHALL trigger context compaction automatically and retry once
4. WHEN `DataInspectionFailed` (400) is received THEN the CLI SHALL display: "Content was blocked by provider safety filter. Rephrase your request."
5. WHEN `ModelNotFound` (404) is received THEN the CLI SHALL list available models for that provider and suggest alternatives
6. WHEN `Arrearage` (401) is received THEN the CLI SHALL display: "Account has outstanding balance. Check billing at <provider dashboard URL>."

**Independent Test**: Provide an invalid DashScope key — error shows the link and example `.env` line.

---

### P1: Circuit Breaker ⭐ MVP

**User Story**: As a developer, I want the CLI to stop hammering a failing provider and switch to an alternative, so my work isn't blocked by a provider outage.

**Acceptance Criteria**:

1. WHEN a provider returns 5 consecutive non-retriable errors within 60 seconds THEN that provider SHALL be marked "degraded" for 60 seconds
2. WHEN a provider is degraded THEN all requests SHALL route to the fallback model automatically with a warning: "⚠ <provider> is degraded — routing to fallback"
3. WHEN 60 seconds have passed THEN the CLI SHALL send a single probe request to the provider
4. WHEN the probe succeeds THEN the provider SHALL be marked healthy again
5. WHEN the probe fails THEN the degraded timer SHALL reset for another 60 seconds

**Independent Test**: Mock 5 consecutive 503s — circuit opens, fallback is used, probe restores after timeout.

---

### P2: Transparent Model Switching

**User Story**: As a developer, I want to see which model handled each turn and switch it mid-session with a slash command, so I stay in control of cost vs. quality.

**Acceptance Criteria**:

1. WHEN a response is generated THEN the CLI SHALL show `[model: <name> | tokens: X in / Y out | $0.0012]` in the status bar
2. WHEN `/model list` is typed THEN the CLI SHALL list all configured models with their configured price per 1M tokens
3. WHEN `/model <name>` is typed with an unknown model THEN the CLI SHALL show an error and list valid options

---

## Edge Cases

- WHEN two providers fail simultaneously THEN the CLI SHALL error clearly: "All models failed. Check your API keys and connectivity."
- WHEN the same model is configured as both default and fallback THEN the circuit breaker SHALL not trigger infinite fallback loops
- WHEN `enable_thinking` is set for a model that doesn't support it THEN the CLI SHALL silently drop the flag and retry
- WHEN Ollama is unreachable THEN local routing SHALL fall back to default remote model with a warning

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MMR-01 | P1: Multi-provider client — DashScope | Tasks | Pending |
| MMR-02 | P1: Multi-provider client — DeepSeek | Tasks | Pending |
| MMR-03 | P1: Multi-provider client — Ollama | Tasks | Pending |
| MMR-04 | P1: Intelligent routing — keyword rules | Tasks | Pending |
| MMR-05 | P1: Intelligent routing — display + override | Tasks | Pending |
| MMR-06 | P1: Retry — backoff schedule | Tasks | Pending |
| MMR-07 | P1: Retry — permanent vs transient errors | Tasks | Pending |
| MMR-08 | P1: Actionable errors — per error code | Tasks | Pending |
| MMR-09 | P1: Circuit breaker — degraded state | Tasks | Pending |
| MMR-10 | P1: Circuit breaker — probe + recovery | Tasks | Pending |
| MMR-11 | P2: Transparent model switching | Tasks | Pending |

---

## Success Criteria

- [ ] All three providers (DashScope, DeepSeek, Ollama) work with only `.env` configuration
- [ ] A 429 from DashScope is automatically retried and falls back to DeepSeek without user action
- [ ] Invalid API key shows provider-specific fix instructions within 1 second of the error
