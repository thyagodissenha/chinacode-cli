# TUI & UX — Tasks

**Spec**: `.specs/features/tui-and-ux/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Parallel Command Layer

```
T3 complete, then:
  ├── T4 [P]   (slash command parser)
  └── T5 [P]   (keyboard shortcuts)
```

### Phase 3: Sequential Commands

```
T4 done → T6 → T7 → T8
```

### Phase 4: Integration

```
T5 + T8 done → T9 (onboarding wizard)
```

---

## Task Breakdown

### T1: Create readline REPL scaffold with fixed layout

**What**: The core REPL loop using Node.js readline — fixed header, scrollable message area, status bar, bottom input prompt
**Where**: `src/repl/index.ts`, `src/repl/layout.ts`
**Depends on**: None
**Reuses**: Node.js `readline`, `chalk`

**Done when**:
- [ ] `createREPL(config)` starts an interactive readline interface
- [ ] Header line rendered: `ChinaCode CLI v<version> | model: <name> | sandbox: on/off`
- [ ] Input prompt: `> ` fixed at bottom (readline default)
- [ ] Messages printed above the input with ANSI formatting
- [ ] Reflows correctly when `process.stdout.columns` changes (SIGWINCH handler)
- [ ] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build

---

### T2: Implement spinner states

**What**: Spinner displayed in the input area during model generation and tool execution
**Where**: `src/repl/spinner.ts`
**Depends on**: T1
**Reuses**: `ora` npm package

**Done when**:
- [ ] `showSpinner(text)` starts spinner; `stopSpinner()` clears it
- [ ] Three states: `Thinking…`, `Running <tool>…`, `Retrying in <N>s…`
- [ ] Spinner stops immediately on Ctrl+C signal
- [ ] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build

---

### T3: Implement syntax highlighting for code blocks

**What**: Post-processor that detects fenced code blocks in agent text output and applies ANSI syntax highlighting
**Where**: `src/repl/highlighter.ts`
**Depends on**: T1
**Reuses**: `highlight.js` or `shiki` (evaluate; prefer shiki for accuracy)

**Done when**:
- [ ] Detects ` ```<lang> ... ``` ` blocks in response text
- [ ] Applies ANSI-color highlighting matching the language
- [ ] Falls back to plain monospace when language unrecognized
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 3 unit tests (TypeScript block, unknown lang fallback, no block passthrough)

**Tests**: unit
**Gate**: quick

---

### T4: Implement slash command parser and dispatcher [P]

**What**: Parses typed input for slash commands (`/cmd [args]`) and routes to registered handlers
**Where**: `src/repl/commands/parser.ts`, `src/repl/commands/dispatcher.ts`
**Depends on**: T1
**Reuses**: N/A

**Done when**:
- [ ] Detects input starting with `/` and extracts command + args
- [ ] Dispatches to registered command handler or returns "Unknown command. Type /help."
- [ ] Tab autocomplete: partial `/mo` → `/model`
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 5 unit tests (known command, unknown command, args parsing, tab complete, case insensitive)

**Tests**: unit
**Gate**: quick

---

### T5: Implement keyboard shortcuts [P]

**What**: Ctrl+C (cancel/exit), Ctrl+L (clear), ↑/↓ (history), Tab (autocomplete)
**Where**: `src/repl/keyboard.ts`
**Depends on**: T1
**Reuses**: readline `keypress` events

**Done when**:
- [ ] Ctrl+C once during generation: emits AbortSignal, stops spinner, returns to prompt
- [ ] Ctrl+C once at idle: shows "Press Ctrl+C again to exit"
- [ ] Ctrl+C twice within 800ms at idle: exits with session summary
- [ ] Ctrl+L: clears visible terminal (does not delete history)
- [ ] ↑ / ↓: navigates session input history
- [ ] Gate check passes: `npm run build`

**Tests**: none
**Gate**: build

---

### T6: Implement /help, /exit, /clear, /compact commands

**What**: Four slash command handlers for the most common commands
**Where**: `src/repl/commands/basic.ts`
**Depends on**: T4
**Reuses**: dispatcher from T4

**Done when**:
- [ ] `/help`: renders formatted table of all commands with descriptions and aliases
- [ ] `/exit` `/q` `/quit`: shows session cost summary (from CostTracker), then `process.exit(0)`
- [ ] `/clear` `/cls`: clears message history array and terminal display
- [ ] `/compact`: shows "Context compaction not yet implemented (Phase 2)" stub
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (one per command output)

**Tests**: unit
**Gate**: quick

---

### T7: Implement /model, /sandbox, /local, /cost, /export commands

**What**: Five slash command handlers for model switching and cost display
**Where**: `src/repl/commands/model-cost.ts`
**Depends on**: T4, T6
**Reuses**: ModelRouter from multi-model feature, CostTracker from cost-tracking feature

**Done when**:
- [ ] `/model <name>`: updates session model, confirms `✓ Model switched to: <name>`
- [ ] `/model list`: shows table with model name, tier, price/1M in/out
- [ ] `/sandbox on|off`: toggles Docker sandbox flag; updates header
- [ ] `/local on|off`: toggles LOCAL_ENABLED; updates header
- [ ] `/cost`: shows session cost table (per model, total)
- [ ] `/export [csv]`: delegates to CostTracker export, prints file path
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (one per command)

**Tests**: unit
**Gate**: quick

---

### T8: Implement /sessions and /resume commands

**What**: Two slash command handlers for session management (list + resume)
**Where**: `src/repl/commands/sessions.ts`
**Depends on**: T4, T6
**Reuses**: SessionDB from config-and-persistence feature

**Done when**:
- [ ] `/sessions`: queries DB for last 20 sessions, renders table: id (short), date, dir, model, cost, turns
- [ ] `/resume <id>`: loads session messages into context, shows last 5 messages, warns if model differs
- [ ] `/resume <nonexistent>`: shows "Session <id> not found."
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (list with sessions, list empty, resume valid, resume not found)

**Tests**: unit
**Gate**: quick

---

### T9: Implement first-run onboarding wizard

**What**: Interactive wizard shown on first launch when no `.env` or API key is found
**Where**: `src/repl/onboarding.ts`
**Depends on**: T1, T2, T5
**Reuses**: readline prompts, ModelClient from multi-model feature

**Done when**:
- [ ] Detects first run: no `~/.chinacode/.env` and no `OPENAI_API_KEY` in env
- [ ] Prompts provider choice: DashScope / DeepSeek / Ollama
- [ ] For remote providers: prompts API key, validates with a test request (`models.list()` or simple completion)
- [ ] On valid key: writes `~/.chinacode/.env` with key, provider defaults, model names
- [ ] On invalid key: shows provider-specific error, re-prompts
- [ ] For Ollama: checks `localhost:11434` connectivity, lists available models
- [ ] On success: shows welcome message with example prompt
- [ ] Skips wizard when `OPENAI_API_KEY` already in shell env
- [ ] Gate check passes: `npm run test` (integration)
- [ ] Test count: ≥ 5 integration tests (DashScope happy path, invalid key retry, Ollama success, Ollama unreachable, env var skip)

**Tests**: integration
**Gate**: full

**Commit**: `feat(tui): implement readline REPL, slash commands, keyboard shortcuts, onboarding wizard`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T3

Phase 2 (Parallel — mixed: T4 unit, T5 none):
  T3 done, then:
    ├── T4 [P]  (unit, parallel-safe)
    └── T5 [P]  (build-only, parallel-safe)

Phase 3 (Sequential — commands depend on dispatcher T4):
  T4 done → T6 → T7 → T8

Phase 4 (Integration — not parallel per TESTING.md):
  T5 + T8 done → T9
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: REPL scaffold + layout | 2 files, 1 concern | ✅ Granular |
| T2: spinner | 1 file | ✅ Granular |
| T3: syntax highlight | 1 file | ✅ Granular |
| T4: command parser + dispatcher | 2 files, 1 concern | ✅ Granular |
| T5: keyboard shortcuts | 1 file | ✅ Granular |
| T6: basic commands | 1 file, 4 commands | ✅ Granular |
| T7: model/cost commands | 1 file, 6 commands | ✅ Granular |
| T8: session commands | 1 file, 2 commands | ✅ Granular |
| T9: onboarding wizard | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 | ✅ Match |
| T4 | T1 | T3 → T4 [P] | ✅ Match |
| T5 | T1 | T3 → T5 [P] | ✅ Match |
| T6 | T4 | T4 → T6 | ✅ Match |
| T7 | T4, T6 | T6 → T7 | ✅ Match |
| T8 | T4, T6 | T7 → T8 | ✅ Match |
| T9 | T1, T2, T5 | T5+T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | REPL (not unit-testable) | none | none | ✅ OK |
| T2 | Spinner (not unit-testable) | none | none | ✅ OK |
| T3 | Highlighter | unit | unit | ✅ OK |
| T4 | Command parser/dispatcher | unit | unit | ✅ OK |
| T5 | Keyboard (not unit-testable) | none | none | ✅ OK |
| T6 | Basic commands | unit | unit | ✅ OK |
| T7 | Model/cost commands | unit | unit | ✅ OK |
| T8 | Session commands | unit | unit | ✅ OK |
| T9 | Onboarding wizard | integration | integration | ✅ OK |
