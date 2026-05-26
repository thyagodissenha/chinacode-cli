# Built-in Tools & Sandbox — Tasks

**Spec**: `.specs/features/built-in-tools-and-sandbox/spec.md`
**Status**: Approved

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Parallel Tool Implementation

```
T2 complete, then:
  ├── T3 [P]   (Docker sandbox)
  ├── T4 [P]   (read_file)
  ├── T6 [P]   (glob_search)
  ├── T7 [P]   (grep_search)
  ├── T8 [P]   (list_directory)
  └── T9 [P]   (delegate_task stub)
```

### Phase 3: Sequential (Diff Approval)

```
T2 complete (independently): T5 → T10
```

### Phase 4: Integration

```
All phase 2+3 done → T11
```

---

## Task Breakdown

### T1: Define tool interface and registry

**What**: TypeScript interface for tools and a registry that maps tool names to implementations
**Where**: `src/tools/types.ts`, `src/tools/registry.ts`
**Depends on**: None
**Reuses**: N/A

**Done when**:
- [ ] `Tool` interface: `{name, description, parameters: ZodSchema, execute(args): Promise<ToolResult>}`
- [ ] `ToolRegistry` class: `register(tool)`, `get(name)`, `getAll()`, `toOpenAIFormat()` (converts to OpenAI tool definitions)
- [ ] Gate check passes: `npm run build`

**Tests**: unit
**Gate**: build

---

### T2: Implement bash tool (local execution)

**What**: bash tool that executes shell commands locally with configurable timeout
**Where**: `src/tools/bash.ts`
**Depends on**: T1
**Reuses**: Node.js `child_process.spawn`

**Done when**:
- [ ] Accepts `{command: string, timeout?: number}` (default timeout 60s)
- [ ] Returns `{stdout, stderr, exit_code}`
- [ ] Kills process after timeout; returns `{error: "timeout after Xs"}`
- [ ] Detects destructive patterns (`rm -rf`, `drop table`, `git push --force`, `format `, `mkfs`) and returns `{requires_confirmation: true, command}`
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 6 unit tests (success, stderr, timeout, exit code, destructive detection, no-op)

**Tests**: unit
**Gate**: quick

---

### T3: Implement Docker sandbox wrapper [P]

**What**: Wraps bash tool execution in an ephemeral Docker container
**Where**: `src/tools/sandbox.ts`
**Depends on**: T2
**Reuses**: bash tool, Node.js `child_process`

**Done when**:
- [ ] Detects Docker availability (`docker info` succeeds)
- [ ] When available: runs command in `docker run --rm --network none -v <workspace>:/workspace -w /workspace <image> sh -c "<command>"`
- [ ] When unavailable: falls back to local bash with warning: `⚠ Docker not found — running in unsandboxed mode`
- [ ] Default image: `node:20-alpine` (configurable via `SANDBOX_IMAGE`)
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (docker available mock, docker unavailable fallback, command forwarding, timeout propagation)

**Tests**: unit
**Gate**: quick

---

### T4: Implement read_file tool [P]

**What**: Tool that reads file contents with optional line offset and limit, with path safety and secrets filtering
**Where**: `src/tools/read-file.ts`
**Depends on**: T1
**Reuses**: Node.js `fs/promises`

**Done when**:
- [ ] Accepts `{path: string, offset?: number, limit?: number}`
- [ ] Validates path doesn't escape workspace root (no `..` traversal, no symlinks outside)
- [ ] Rejects secrets files: `.env`, `.git/config`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `*.pfx`
- [ ] Rejects binary files (detect by null bytes in first 512 bytes)
- [ ] Returns lines `offset` to `offset+limit` when params provided; full file otherwise
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 7 unit tests (success, offset+limit, path traversal rejection, secrets rejection, binary rejection, not found, large file)

**Tests**: unit
**Gate**: quick

---

### T5: Implement diff renderer

**What**: Utility that generates a colored unified diff between old and new content for terminal display
**Where**: `src/tools/diff-renderer.ts`
**Depends on**: T1
**Reuses**: `diff` npm package

**Done when**:
- [ ] `renderDiff(oldContent: string, newContent: string, filePath: string): string` returns ANSI-colored output
- [ ] Added lines: green with `+` prefix
- [ ] Removed lines: red with `-` prefix
- [ ] Context lines: grey (3 lines context around each change)
- [ ] When `oldContent` is empty: all lines shown as additions
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (addition, deletion, modification, new file)

**Tests**: unit
**Gate**: quick

---

### T6: Implement glob_search tool [P]

**What**: Tool that finds files matching a glob pattern within the workspace
**Where**: `src/tools/glob-search.ts`
**Depends on**: T1
**Reuses**: `fast-glob` npm package

**Done when**:
- [ ] Accepts `{pattern: string}` and returns `{matches: string[]}`
- [ ] Paths returned relative to workspace root
- [ ] Truncates at 500 results with `{matches: [...], truncated: true}`
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 3 unit tests (matches found, no matches, truncation)

**Tests**: unit
**Gate**: quick

---

### T7: Implement grep_search tool [P]

**What**: Tool that searches file contents for a string or regex pattern
**Where**: `src/tools/grep-search.ts`
**Depends on**: T1
**Reuses**: Node.js `fs/promises`, `readline`

**Done when**:
- [ ] Accepts `{pattern: string, path?: string}` and returns `{matches: Array<{file, line, content}>}`
- [ ] Supports regex patterns (JS RegExp)
- [ ] Limits to `path` directory/file when provided
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (string match, regex match, no match, scoped path)

**Tests**: unit
**Gate**: quick

---

### T8: Implement list_directory tool [P]

**What**: Tool that lists directory contents with optional recursion
**Where**: `src/tools/list-directory.ts`
**Depends on**: T1
**Reuses**: Node.js `fs/promises`

**Done when**:
- [ ] Accepts `{path: string, recursive?: boolean}` and returns `{entries: Array<{name, type: 'file'|'dir', path}>}`
- [ ] When `recursive: true`: traverses up to depth 10
- [ ] Truncates at 1000 entries with `{entries: [...], truncated: true}`
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 4 unit tests (flat list, recursive, truncation, not found)

**Tests**: unit
**Gate**: quick

---

### T9: Implement delegate_task stub [P]

**What**: Tool that returns a "not yet implemented" message for Phase 2 subagent delegation
**Where**: `src/tools/delegate-task.ts`
**Depends on**: T1

**Done when**:
- [ ] Returns `{error: "Subagents not yet implemented. This feature is available in Phase 2."}`
- [ ] Logs the delegation attempt with task description to audit log
- [ ] Gate check passes: `npm run build`

**Tests**: unit
**Gate**: build

---

### T10: Implement write_file + edit_file tools with diff approval

**What**: write_file (full file write) and edit_file (surgical string replacement), both showing a diff and awaiting Y/N/A confirmation before writing
**Where**: `src/tools/write-file.ts`, `src/tools/edit-file.ts`
**Depends on**: T1, T5
**Reuses**: diff renderer from T5

**Done when**:
- [ ] `write_file` accepts `{path, content}`, renders diff, prompts Y/N/A, writes on Y/A
- [ ] `edit_file` accepts `{path, old_text, new_text}`, finds unique occurrence, renders diff, prompts, applies on Y/A
- [ ] When `old_text` not found: returns `{error: "old_text not found in file"}`
- [ ] When `old_text` not unique: returns `{error: "old_text is not unique — provide more context"}`
- [ ] Session-level auto-approve flag (`A`) stored; subsequent writes skip prompt
- [ ] Write outside workspace root: requires extra confirmation warning
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 8 unit tests (write approved, write rejected, auto-approve, new file, edit found, edit not found, edit not unique, outside workspace)

**Tests**: unit
**Gate**: quick

---

### T11: Register all tools in registry and wire sandbox

**What**: Register all 8 tools in the ToolRegistry and configure bash/write/edit to use Docker sandbox
**Where**: `src/tools/index.ts`
**Depends on**: T2, T3, T4, T5, T6, T7, T8, T9, T10
**Reuses**: All tool modules above

**Done when**:
- [ ] All 8 tools registered with correct OpenAI tool schemas
- [ ] bash tool uses sandbox wrapper (Docker when available)
- [ ] `createToolRegistry(config)` exported for use by agent loop
- [ ] Gate check passes: `npm run test:quick`
- [ ] Test count: ≥ 3 unit tests (registry get, getAll, toOpenAIFormat)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(tools): implement 8 built-in tools with Docker sandbox and diff approval`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2

Phase 2 (Parallel — all unit tests, safe):
  T2 done, then simultaneously:
    T3 [P], T4 [P], T6 [P], T7 [P], T8 [P], T9 [P]

Phase 3 (Sequential after T2):
  T5 → T10

Phase 4 (Sequential):
  All phases done → T11
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: types + registry | 2 files, 1 concept | ✅ Granular |
| T2: bash (local) | 1 file | ✅ Granular |
| T3: Docker sandbox | 1 file | ✅ Granular |
| T4: read_file | 1 file | ✅ Granular |
| T5: diff renderer | 1 file | ✅ Granular |
| T6: glob_search | 1 file | ✅ Granular |
| T7: grep_search | 1 file | ✅ Granular |
| T8: list_directory | 1 file | ✅ Granular |
| T9: delegate_task stub | 1 file | ✅ Granular |
| T10: write_file + edit_file | 2 files, same approval flow | ✅ Granular (cohesive) |
| T11: registry wiring | 1 file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 [P] | ✅ Match |
| T4 | T1 | T2 → T4 [P] | ✅ Match |
| T5 | T1 | T2 → T5 (Phase 3) | ✅ Match |
| T6 | T1 | T2 → T6 [P] | ✅ Match |
| T7 | T1 | T2 → T7 [P] | ✅ Match |
| T8 | T1 | T2 → T8 [P] | ✅ Match |
| T9 | T1 | T2 → T9 [P] | ✅ Match |
| T10 | T1, T5 | T5 → T10 | ✅ Match |
| T11 | T2–T10 | All → T11 | ✅ Match |

---

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Types only | build | build | ✅ OK |
| T2 | bash tool | unit | unit | ✅ OK |
| T3 | sandbox wrapper | unit | unit | ✅ OK |
| T4 | read_file tool | unit | unit | ✅ OK |
| T5 | diff renderer | unit | unit | ✅ OK |
| T6 | glob_search | unit | unit | ✅ OK |
| T7 | grep_search | unit | unit | ✅ OK |
| T8 | list_directory | unit | unit | ✅ OK |
| T9 | delegate stub | unit (trivial) | build | ✅ OK |
| T10 | write+edit tools | unit | unit | ✅ OK |
| T11 | registry wiring | unit | unit | ✅ OK |
