# Cost Tracking Specification

## Problem Statement

One of ChinaCode CLI's core promises is "transparent, predictable costs." Without real-time token tracking and cost calculation, developers have no idea what they're spending, which destroys trust and makes the CLI unsuitable for budget-conscious teams. The cost tracker must be accurate, always visible, and exportable.

## Goals

- [ ] Display per-turn token counts and cumulative session cost in real time
- [ ] Support configurable per-model pricing via `.env` so users can set their actual contracted rates
- [ ] Allow session cost data to be exported to CSV/JSON for billing analysis

## Out of Scope

| Feature | Reason |
|---|---|
| Historical cost graphs / charts | Phase 3 roadmap |
| Automatic price table updates from provider APIs | Nice-to-have, not M1 |
| Team/org cost aggregation | Enterprise feature, Phase 5 |
| Budget alerts / spending limits | Phase 2 |

---

## User Stories

### P1: Real-Time Token & Cost Display ⭐ MVP

**User Story**: As a developer, I want to see exactly how many tokens I used and what it cost after each agent turn, so I have continuous visibility into my spending.

**Acceptance Criteria**:

1. WHEN a model response completes THEN the status bar SHALL update to show: `tokens: 1,234 in / 456 out | session: $0.0031`
2. WHEN a turn involves multiple model calls (e.g. tool calls in loop) THEN token counts SHALL be summed across all calls in that turn
3. WHEN the model returns usage data in the response THEN those exact values SHALL be used; if usage is absent THEN the CLI SHALL estimate from token count heuristic (chars ÷ 4)
4. WHEN the model is switched mid-session THEN cost tracking SHALL apply each model's configured price independently

**Independent Test**: Send a message — status bar updates with token counts and a non-zero cost within 100ms of response completion.

---

### P1: Configurable Pricing per Model ⭐ MVP

**User Story**: As a developer, I want to set prices per model in my `.env` so the cost display reflects my actual contracted rates.

**Acceptance Criteria**:

1. WHEN `PRICE_<MODEL_NAME>_INPUT=<price_per_1M>` is set in `.env` THEN the CLI SHALL use that price for input tokens of that model
2. WHEN `PRICE_<MODEL_NAME>_OUTPUT=<price_per_1M>` is set THEN the CLI SHALL use it for output tokens
3. WHEN no price is configured for a model THEN the CLI SHALL use built-in defaults (from a bundled `model-prices.json`) and display a `*` indicating "estimated price"
4. WHEN `/model list` is used THEN each model SHALL show its configured input/output price per 1M tokens

**Default bundled prices (at time of M1):**

| Model | Input ($/1M) | Output ($/1M) |
|---|---|---|
| qwen-plus | 0.40 | 1.20 |
| qwen-max | 2.40 | 9.60 |
| qwen-turbo | 0.05 | 0.20 |
| deepseek-chat | 0.27 | 1.10 |
| deepseek-reasoner | 0.55 | 2.19 |
| ollama/* | 0.00 | 0.00 |

**Independent Test**: Set a custom price in `.env`, send a message — cost matches the custom rate.

---

### P1: Session Summary on Exit ⭐ MVP

**User Story**: As a developer, I want a cost summary when I exit the CLI, so I know exactly what I spent in that session.

**Acceptance Criteria**:

1. WHEN `/exit` is entered THEN the CLI SHALL display: session duration, total turns, total tokens (input / output), cost per model, total session cost in USD
2. WHEN the session cost exceeds $1.00 THEN the summary SHALL highlight the total in yellow
3. WHEN the session cost exceeds $5.00 THEN the summary SHALL highlight in red with: "💡 Tip: Use `/model qwen-turbo` for lighter tasks"

**Independent Test**: Run a 5-turn session, type `/exit` — summary table appears with accurate totals.

---

### P2: Export Session to CSV/JSON

**User Story**: As a developer, I want to export session cost data to a file so I can analyze spending across sessions.

**Acceptance Criteria**:

1. WHEN `/export` is entered without args THEN the CLI SHALL export to `./chinacode-export-<ISO-date>.json` with: session metadata, per-turn breakdown (model, tokens, cost, timestamp)
2. WHEN `/export csv` is entered THEN the export format SHALL be CSV with the same fields
3. WHEN the export file is created THEN the CLI SHALL print the full file path

---

## Edge Cases

- WHEN a streaming response is interrupted (Ctrl+C) THEN partial token counts SHALL still be recorded and displayed
- WHEN the model returns `usage: null` THEN the estimation heuristic SHALL be applied and marked with `(est.)`
- WHEN cost rounds to `$0.0000` THEN display SHALL show `< $0.0001` rather than `$0.0000`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CST-01 | P1: Real-time display — status bar | Tasks | Pending |
| CST-02 | P1: Real-time display — multi-call summing | Tasks | Pending |
| CST-03 | P1: Real-time display — estimation fallback | Tasks | Pending |
| CST-04 | P1: Configurable pricing — .env parsing | Tasks | Pending |
| CST-05 | P1: Configurable pricing — bundled defaults | Tasks | Pending |
| CST-06 | P1: Session summary on exit | Tasks | Pending |
| CST-07 | P2: Export to JSON/CSV | Tasks | Pending |

---

## Success Criteria

- [ ] After every agent turn, token counts and cost update in the status bar with < 50ms delay
- [ ] Custom prices in `.env` are reflected accurately (no hardcoded defaults overriding them)
- [ ] `/export` produces a valid JSON file that can be opened in any JSON viewer
