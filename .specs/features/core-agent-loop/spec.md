# Core Agent Loop Specification

## Problem Statement

Developers need a terminal agent that can autonomously reason about a coding task, select and execute tools, observe the results, and iterate until the task is complete — without manual intervention. Without a robust ReAct loop, the CLI is just a chat wrapper with no agentic value.

## Goals

- [ ] Deliver a streaming ReAct loop that completes multi-step coding tasks autonomously
- [ ] TTFT < 500ms on local models, < 1500ms on remote APIs
- [ ] Graceful Ctrl+C cancels generation without crashing; loop always terminates cleanly

## Out of Scope

| Feature | Reason |
|---|---|
| Subagent delegation | Phase 2 (delegate_task is a stub in M1) |
| Context summarization / compaction | Phase 2 |
| Git-aware context injection | Phase 2 |
| LSP integration | Phase 2 |

---

## User Stories

### P1: ReAct Iteration Loop ⭐ MVP

**User Story**: As a developer, I want the agent to autonomously reason, pick a tool, observe the result, and iterate until my task is done, so I don't have to manually chain commands.

**Why P1**: The core value proposition of the CLI — without this nothing else matters.

**Acceptance Criteria**:

1. WHEN the user submits a message THEN the agent SHALL begin a ReAct cycle (reason → tool call → observe → repeat)
2. WHEN a tool returns a result THEN the agent SHALL incorporate it into the next reasoning step without user intervention
3. WHEN the agent reaches a final answer THEN it SHALL output it and stop the loop
4. WHEN the loop reaches the configured max iterations (default 15) THEN the agent SHALL stop and report the partial result with a clear message
5. WHEN the agent detects the same tool call with the same args repeated 3+ consecutive times THEN it SHALL break the loop and report an infinite-loop warning

**Independent Test**: Submit "list all .ts files in the project" — agent uses glob_search, reads results, and responds with the file list without user prompting.

---

### P1: Streaming Output ⭐ MVP

**User Story**: As a developer, I want to see the agent's response appear token by token, so I get immediate feedback while it thinks.

**Why P1**: Streaming is essential for perceived performance; polling for a full response makes long tasks feel broken.

**Acceptance Criteria**:

1. WHEN the model generates a response THEN each token SHALL be rendered to the terminal as it arrives
2. WHEN the model emits a tool call in streaming mode THEN the agent SHALL accumulate it, execute the tool, then continue streaming the next reasoning step
3. WHEN the user presses Ctrl+C during streaming THEN the agent SHALL cancel the current generation and return to the input prompt without exiting
4. WHEN streaming begins THEN TTFT SHALL be ≤ 500ms for local models and ≤ 1500ms for remote APIs under normal conditions

**Independent Test**: Ask a long question — tokens appear progressively within 1.5s of submitting.

---

### P1: Tool Call Parser with Fallback ⭐ MVP

**User Story**: As a developer, I want the agent to reliably extract tool calls from model output, even when the model wraps them in markdown code blocks instead of using native tool-call format.

**Why P1**: Chinese models sometimes emit tool calls inside ` ```json ``` ` blocks rather than as native function calls — without fallback, these fail silently.

**Acceptance Criteria**:

1. WHEN the model returns a native OpenAI-format tool call THEN the agent SHALL parse and execute it directly
2. WHEN the model returns a ` ```json ``` ` block containing a valid tool call schema THEN the agent SHALL detect it, parse it, and execute it with a visible warning "⚠ Tool call via fallback parser"
3. WHEN a fallback-parsed tool call fails Zod schema validation THEN the agent SHALL log the raw block and skip execution without crashing
4. WHEN fallback parsing is used THEN it SHALL be logged to `~/.chinacode/logs/YYYY-MM-DD.jsonl`

**Independent Test**: Mock a model response with a JSON block tool call — it executes and shows the fallback warning.

---

### P1: Loop Safety & Timeout ⭐ MVP

**User Story**: As a developer, I want the agent loop to never hang or spin forever, so I'm not stuck waiting with no way out.

**Acceptance Criteria**:

1. WHEN a session timeout is configured (default: none; configurable) THEN the agent SHALL terminate the loop after that duration
2. WHEN the loop exceeds `max_iterations` THEN the agent SHALL emit a clear message: "Reached maximum iterations (N). Here is what I have so far:" followed by the partial result
3. WHEN a tool execution hangs THEN the bash tool's timeout (default 60s) SHALL kill the process and return a timeout error to the loop

**Independent Test**: Set max_iterations=2, give a task requiring 3+ steps — agent stops at 2 and reports partial.

---

### P2: Correlation IDs & Audit Logging

**User Story**: As a developer, I want every loop iteration and tool call to be logged with a request ID, so I can debug what the agent did in past sessions.

**Acceptance Criteria**:

1. WHEN a session starts THEN a unique `session_id` SHALL be generated (UUIDv4)
2. WHEN any tool is called THEN a log entry SHALL be written to `~/.chinacode/logs/YYYY-MM-DD.jsonl` with: timestamp, session_id, tool name, args, result (truncated to 2KB), duration_ms
3. WHEN a fallback tool call parse occurs THEN it SHALL be logged with `"event": "fallback_parse"`

---

## Edge Cases

- WHEN the model returns an empty response THEN the agent SHALL retry once, then ask the user if they want to continue
- WHEN a tool call references an unknown tool name THEN the agent SHALL log a warning and continue the loop with an error observation
- WHEN the model output contains multiple tool calls in a single turn THEN the agent SHALL execute them sequentially in order
- WHEN the network connection drops mid-stream THEN the agent SHALL catch the error, show a user-friendly message, and not crash

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CAL-01 | P1: ReAct Iteration Loop | Tasks | Pending |
| CAL-02 | P1: ReAct Iteration Loop — max iterations | Tasks | Pending |
| CAL-03 | P1: ReAct Iteration Loop — infinite loop detection | Tasks | Pending |
| CAL-04 | P1: Streaming Output — token streaming | Tasks | Pending |
| CAL-05 | P1: Streaming Output — Ctrl+C cancel | Tasks | Pending |
| CAL-06 | P1: Streaming Output — TTFT target | Tasks | Pending |
| CAL-07 | P1: Tool Call Parser — native | Tasks | Pending |
| CAL-08 | P1: Tool Call Parser — markdown fallback | Tasks | Pending |
| CAL-09 | P1: Tool Call Parser — Zod validation | Tasks | Pending |
| CAL-10 | P1: Loop Safety — timeout | Tasks | Pending |
| CAL-11 | P2: Correlation IDs & Audit Logging | Tasks | Pending |

---

## Success Criteria

- [ ] Agent completes a 5-step coding task (read → analyze → edit → run tests → report) without user intervention
- [ ] Fallback parser handles at least Qwen and DeepSeek tool-call-in-markdown patterns
- [ ] Ctrl+C always returns to prompt within 200ms, never crashes the process
