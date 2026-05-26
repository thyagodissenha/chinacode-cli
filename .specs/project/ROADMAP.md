# Roadmap

**Current Milestone:** Foundation (MVP)
**Status:** In Progress

---

## Milestone 1 — Foundation (Weeks 1–4)

**Goal:** Stable, usable MVP with core agent loop, tools, streaming, cost tracking, and Docker sandbox
**Target:** End of Week 4 (internal daily-use by 10 users)

### Features

**Core Agent Loop**
- ReAct cycle (Reason + Act) with up to 15 configurable iterations
- Streaming output with TTFT < 500ms (local) / < 1500ms (remote)
- Graceful Ctrl+C (cancels generation, keeps session)
- Infinite-loop detection and graceful exit
- Parser fallback for tool calls embedded in markdown text

**Built-in Tools**
- bash (with Docker sandbox, configurable timeout)
- read_file, write_file, edit_file (with diff approval)
- glob_search, grep_search, list_directory
- delegate_task (stub for Phase 2 subagents)

**Docker Sandbox**
- Ephemeral container (`--rm`), no network, restricted volume mount
- Configurable timeout (default 60s)
- Graceful fallback to local execution with warning

**Multi-Model Support**
- DashScope: qwen-plus, qwen-max, qwen-turbo, qwen3-max, qwen2.5-coder
- DeepSeek API: deepseek-chat, deepseek-reasoner
- Ollama (local): any model at localhost:11434/v1
- Intelligent routing: reasoning / fast / default / local

**TUI & UX**
- readline REPL with fixed header, message area, status bar, bottom input
- ANSI colors (chalk), spinners (ora), syntax-highlighted code blocks
- Slash commands: /help, /model, /sandbox, /local, /cost, /clear, /compact, /resume, /sessions, /export, /exit
- Keyboard: Ctrl+C (once=cancel, twice=exit), Ctrl+L, Tab autocomplete, ↑/↓ history
- Onboarding wizard on first run (detects missing .env, guides API key setup)

**Cost Tracking**
- Per-token, per-turn, per-session cost in USD
- Configurable price tables per model in .env
- Session summary on /exit; CSV/JSON export via /export

**Agent.md Config System**
- Parse ./agent.md (Identity, Rules, Skills, Subagents sections)
- Load ./skills/*.md as knowledge documents injected into context
- Bundled starter skills: code-review, test-generation, db-migration, security-audit, performance-optimization

**Error Handling & Resilience**
- Actionable error messages for all DashScope/DeepSeek error codes
- Retry with exponential backoff (1s → 4s → 16s) for 429/5xx
- Circuit breaker: after 5 consecutive failures, mark provider degraded for 60s
- Automatic fallback to secondary model on primary failure

**Session Persistence**
- SQLite at ~/.chinacode/sessions.db
- Auto-save every 10 interactions
- /sessions (last 20), /resume <id>

---

## Milestone 2 — Intelligence (Weeks 5–8)

**Goal:** Smarter agent that handles long sessions, delegates to subagents, and understands git context
**Target:** >75% task completion rate on internal benchmarks

### Features
- Subagent System
- Context Summarization
- Git-Aware Context
- LSP Basic Integration

---

## Milestone 3 — Ecosystem (Weeks 9–12)

**Goal:** Rich extensibility via MCP and a plugin system

### Features
- MCP Hub (stdio + SSE)
- Official MCP Servers (filesystem, git, postgres, brave-search)
- Benchmark Mode `/bench`
- RAG Local with Embeddings

---

## Milestone 4 — Polish & Launch (Weeks 13–16)

**Goal:** Ready for public launch; documentation, CI/CD, multilingual

### Features
- Documentation Site (trilingual: PT/EN/ZH)
- Interactive Tutorial
- CI/CD & E2E Tests
- npm Public Publish

---

## Milestone 5 — Growth (Months 5–12)

**Goal:** Community, monetization, enterprise readiness

### Features
- VS Code Extension
- JetBrains Extension
- SaaS Hosted Version
- Enterprise Plans
- Opt-in Telemetry

---

## Future Considerations

- Mobile support (Termux/iSH)
- Voice-driven coding mode
- Multi-user real-time collaboration
- Premium skills marketplace
- SOC2 / ISO27001 certification
- Dedicated open-source foundation
