# TUI & UX Specification

## Problem Statement

A powerful agent is worthless if the interface is confusing, slow, or unresponsive. The terminal UI must feel professional and trustworthy from the first keystroke — delivering immediate feedback, clear status information, and frictionless first-run setup so developers adopt the tool and keep using it.

## Goals

- [ ] Deliver a readline-based REPL with a fixed layout (header + messages + status bar + input) that never flickers or breaks on resize
- [ ] Implement all 12 slash commands and 5 keyboard shortcuts from the PRD
- [ ] Guide first-time users through API key setup with an interactive wizard (zero docs needed to get started)

## Out of Scope

| Feature | Reason |
|---|---|
| Ink/React TUI | ADR-001: readline+chalk chosen for stability |
| Tab autocomplete for file paths | Nice-to-have, post-MVP |
| Screen reader / high-contrast mode | P3 accessibility — Phase 4 |
| Mouse support | Not needed for CLI |

---

## User Stories

### P1: REPL Layout ⭐ MVP

**User Story**: As a developer, I want a clean, fixed terminal layout so I always know where to look for the agent's response, status info, and my input.

**Acceptance Criteria**:

1. WHEN the CLI starts THEN it SHALL render: header line (model, sandbox status, version) + scrollable message area + status bar (tokens, cost) + fixed input prompt at the bottom
2. WHEN the terminal is resized THEN the layout SHALL reflow without artifacts or blank screens
3. WHEN the agent is thinking THEN an animated spinner SHALL appear in the input area: `⠸ Thinking…`
4. WHEN a tool is executing THEN the spinner SHALL show: `⠸ Running bash…`
5. WHEN a response is complete THEN the message area SHALL scroll to show the latest exchange
6. WHEN code blocks are in the response THEN they SHALL be syntax-highlighted with language detection

**Independent Test**: Start CLI, ask a question — spinner shows during generation, response appears with highlights, layout stays stable.

---

### P1: Slash Commands ⭐ MVP

**User Story**: As a developer, I want keyboard shortcuts for common operations (/model, /cost, /clear) so I can control the agent without leaving the chat flow.

**Acceptance Criteria**:

1. WHEN `/help` or `/h` or `/?` is entered THEN the CLI SHALL display a formatted list of all commands with descriptions
2. WHEN `/model <name>` is entered THEN the CLI SHALL switch the active model and confirm: `✓ Model switched to: <name>`
3. WHEN `/model list` is entered THEN all configured models SHALL be listed with their tier (fast/default/reasoning/local)
4. WHEN `/sandbox on|off` is entered THEN Docker sandbox SHALL be toggled and confirmed in the header
5. WHEN `/local on|off` is entered THEN local model routing SHALL be toggled and confirmed
6. WHEN `/cost` is entered THEN the CLI SHALL show a table: per-model token counts and USD cost for this session
7. WHEN `/clear` or `/cls` is entered THEN the message history SHALL be cleared (session resets)
8. WHEN `/compact` is entered THEN the CLI SHALL summarize the current context (stub in M1: show "compact not yet implemented")
9. WHEN `/sessions` is entered THEN the last 20 sessions SHALL be listed with: date, working directory, model used, total cost
10. WHEN `/resume <id>` is entered THEN that session's message history SHALL be loaded and the session continued
11. WHEN `/export` is entered THEN the current session SHALL be exported to `./chinacode-export-<timestamp>.json`
12. WHEN `/exit` or `/q` or `/quit` is entered THEN the CLI SHALL show a session cost summary and exit cleanly

**Independent Test**: Type `/help` — all commands appear. Type `/cost` — session cost table appears.

---

### P1: Keyboard Shortcuts ⭐ MVP

**User Story**: As a developer, I want keyboard shortcuts that feel familiar and safe — especially Ctrl+C for cancel without exit.

**Acceptance Criteria**:

1. WHEN Ctrl+C is pressed once during generation THEN the current API call SHALL be cancelled and the prompt SHALL reappear
2. WHEN Ctrl+C is pressed twice within 800ms THEN the CLI SHALL show "Press Ctrl+C again to exit" on first press, then exit on second press
3. WHEN Ctrl+L is pressed THEN the visible terminal SHALL be cleared (same as `/clear` for display; history is NOT deleted)
4. WHEN ↑ arrow is pressed at the input THEN the previous command in this session SHALL be shown
5. WHEN ↓ arrow is pressed THEN the next command SHALL be shown (or blank if at end)
6. WHEN Tab is pressed THEN slash commands SHALL be autocompleted (e.g. `/mo` → `/model`)

**Independent Test**: Press Ctrl+C during a long generation — generation stops, prompt returns, session continues.

---

### P1: First-Run Onboarding Wizard ⭐ MVP

**User Story**: As a new user, I want to be guided through configuration on first launch, so I can start using the agent without reading any documentation.

**Acceptance Criteria**:

1. WHEN no `.env` file is found in the working directory or `~/.chinacode/` THEN the wizard SHALL start automatically
2. WHEN the wizard starts THEN it SHALL ask the user to choose a provider: DashScope / DeepSeek / Ollama (local)
3. WHEN a remote provider is selected THEN the wizard SHALL prompt for the API key and validate it with a test call
4. WHEN the API key is invalid THEN the wizard SHALL show a provider-specific error and retry prompt
5. WHEN the API key is valid THEN the wizard SHALL create `~/.chinacode/.env` with the key and defaults
6. WHEN Ollama is selected THEN the wizard SHALL test `http://localhost:11434` connectivity and list available models
7. WHEN setup completes THEN the wizard SHALL show a welcome message with a sample prompt to try
8. WHEN `/env` or equivalent does not exist but `OPENAI_API_KEY` is in the shell env THEN skip the wizard and use that key

**Independent Test**: Delete `.env`, run CLI — wizard appears, guides through key input, creates `.env`, starts session.

---

### P2: Input History Persistence

**User Story**: As a developer, I want my command history to persist across sessions so I can recall previous prompts with ↑.

**Acceptance Criteria**:

1. WHEN the CLI exits THEN the last 500 inputs SHALL be saved to `~/.chinacode/history`
2. WHEN the CLI starts THEN history SHALL be loaded from that file
3. WHEN the same input appears consecutively THEN it SHALL be deduplicated in history

---

## Edge Cases

- WHEN the terminal width is < 60 columns THEN the layout SHALL degrade gracefully (no header wrapping, single-column display)
- WHEN the message area contains very long lines THEN they SHALL soft-wrap at terminal width
- WHEN `/resume <id>` is given a non-existent session id THEN the CLI SHALL show: "Session <id> not found."
- WHEN `/export` is called in an empty session THEN the CLI SHALL show: "Nothing to export."
- WHEN Ctrl+C is pressed outside of generation (at idle prompt) THEN first press shows exit hint; second exits

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| TUI-01 | P1: REPL layout — structure | Tasks | Pending |
| TUI-02 | P1: REPL layout — spinner states | Tasks | Pending |
| TUI-03 | P1: REPL layout — syntax highlighting | Tasks | Pending |
| TUI-04 | P1: Slash commands — /help, /exit, /clear | Tasks | Pending |
| TUI-05 | P1: Slash commands — /model | Tasks | Pending |
| TUI-06 | P1: Slash commands — /cost, /export | Tasks | Pending |
| TUI-07 | P1: Slash commands — /sessions, /resume | Tasks | Pending |
| TUI-08 | P1: Slash commands — /sandbox, /local | Tasks | Pending |
| TUI-09 | P1: Keyboard shortcuts — Ctrl+C behavior | Tasks | Pending |
| TUI-10 | P1: Keyboard shortcuts — history + Tab | Tasks | Pending |
| TUI-11 | P1: First-run wizard — provider selection | Tasks | Pending |
| TUI-12 | P1: First-run wizard — key validation + .env | Tasks | Pending |
| TUI-13 | P2: Input history persistence | Tasks | Pending |

---

## Success Criteria

- [ ] A developer who has never used ChinaCode CLI reaches a working session in under 2 minutes without reading docs
- [ ] Ctrl+C always works as expected; the process never hangs
- [ ] All 12 slash commands are discoverable via /help and functional
