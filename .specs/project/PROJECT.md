# ChinaCode CLI

**Vision:** An open-source autonomous coding agent for the terminal, purpose-built to leverage Chinese LLMs (Qwen, DeepSeek, MiMo) with full transparency of cost, complete user sovereignty, and Docker-sandboxed execution.
**For:** Senior developers, ML researchers, and bootstrapped founders who want professional coding agents without vendor lock-in or opaque billing.
**Solves:** The absence of a first-class, open-source CLI tool that natively optimizes for Chinese language models — currently developers use generic wrappers that miss provider-specific optimizations and offer no cost transparency.

## Goals

- Ship a production-ready coding agent CLI that achieves >80% task completion rate on internal benchmarks, at <$0.03/task average cost
- Reach 1,000 GitHub stars and 10,000+ npm installs within 6 months of public launch
- Establish multi-model support (remote Chinese APIs + local Ollama/vLLM) with intelligent routing and transparent per-token cost tracking

## Tech Stack

**Core:**
- Runtime: Node.js 20+
- Language: TypeScript 5+ (ESM)
- API Client: `openai` SDK (OpenAI-compatible; covers DashScope, DeepSeek, SiliconFlow)
- Validation: Zod
- Persistence: SQLite via `better-sqlite3`

**Key dependencies:** `chalk`, `ora`, `readline` (TUI), `@modelcontextprotocol/sdk` (MCP), Docker (optional sandbox)

## Scope

**v1 (Foundation — Weeks 1-4) includes:**
- Core ReAct agent loop with streaming and tool calling
- Built-in tools: bash, read_file, write_file, edit_file, glob_search, grep_search, list_directory, delegate_task
- Docker sandbox for command execution (with local fallback)
- Multi-model support: DashScope (Qwen), DeepSeek API, Ollama (local)
- Intelligent model routing (reasoning/fast/default/local)
- TUI with ANSI colors, spinners, slash commands, keyboard shortcuts
- Real-time cost tracking (token-level, per-model pricing)
- Agent.md configuration system with skills (markdown docs)
- Robust DashScope error handling with actionable messages and retry/fallback
- Diff approval interactive preview before file writes
- Session persistence (SQLite)

**Explicitly out of scope for v1:**
- MCP Hub (Phase 3)
- Subagent delegation system (Phase 2)
- Context summarization / git-aware context (Phase 2)
- VS Code / JetBrains extensions (Phase 5)
- SaaS / hosted version (Phase 5)
- Benchmark mode `/bench` (Phase 3)
- Telemetry / analytics (Phase 5)
- Windows native support (best-effort only)

## Constraints

- Timeline: 4-week Foundation phase; 16-week total to public launch
- Technical: Must work with any OpenAI-compatible API; Docker optional (never required)
- Resources: Solo maintainer initially — keep scope tight and defer complexity
- Legal: MIT license; zero telemetry by default; no secrets ever sent to LLMs
