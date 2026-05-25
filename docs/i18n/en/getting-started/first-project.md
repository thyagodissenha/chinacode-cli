# First project

This guide creates a minimal TypeScript project and uses ChinaCode CLI to read,
edit, and validate code with interactive diff approval.

## 1. Create the project

```bash
mkdir chinacode-demo
cd chinacode-demo
npm init -y
npm install -D typescript vitest @types/node
mkdir -p src skills
```

Create a simple TypeScript configuration:

```bash
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node", "vitest"]
  },
  "include": ["src/**/*.ts"]
}
EOF
```

Add scripts:

```bash
npm pkg set scripts.test="vitest run"
npm pkg set scripts.typecheck="tsc --noEmit"
```

## 2. Configure ChinaCode

Create `.env`:

```bash
cat > .env <<'EOF'
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
FAST_MODEL=qwen-turbo
REASONING_MODEL=qwen-plus
SANDBOX_ENABLED=true
AUTO_APPROVE=false
MAX_ITERATIONS=15
EOF
```

Set `SANDBOX_ENABLED=false` if you are not using Docker.

Create `AGENT.md`:

```bash
cat > AGENT.md <<'EOF'
# ChinaCode Demo

## Identity

You are a TypeScript agent focused on small, testable, verifiable changes.

## Rules

- Read files before editing them
- Use Vitest for tests
- Run or suggest `npm run typecheck` and `npm test` after changing code
- Cite modified files in the final answer

## Skills

- test-generation

## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation
EOF
```

Create the skill used by the subagent:

```bash
cat > skills/test-generation.md <<'EOF'
# Test Generation

## When to use
When the task involves creating or updating automated tests.

## Checklist
- Create Vitest tests for public behavior
- Cover at least one happy path and one edge case
- Keep test names descriptive

## Output format
Report changed files and commands executed.
EOF
```

## 3. Start the agent

With a global installation:

```bash
chinacode
```

During CLI development, run from the `chinacode-cli` repository with
`WORKSPACE_DIR` pointing to the demo project:

```bash
WORKSPACE_DIR=/absolute/path/to/chinacode-demo npm run dev
```

Keep `.env` in the directory where `npm run dev` runs, or export provider
variables in the shell. `AGENT.md`, `skills/`, and edited files live in the
project pointed to by `WORKSPACE_DIR`.

## 4. First task

At the CLI prompt:

```text
❯ create src/calculator.ts with add and divide functions. Then generate tests with the tester subagent and validate with npm test.
```

Expected flow:

1. The agent reads the workspace structure.
2. The agent creates or edits files with `write_file` or `edit_file`.
3. The CLI shows a diff and asks for approval because `AUTO_APPROVE=false`.
4. The agent can call `delegate_task` to generate tests with `test-generation`.
5. The agent runs `npm test` through `bash`, respecting sandbox settings.

If Docker sandbox blocks local dependencies or commands, run:

```text
❯ /sandbox off
```

Then repeat validation:

```text
❯ run npm test and npm run typecheck
```

## 5. Track cost and sessions

During the session:

```text
❯ /cost
❯ /sessions
```

Resume later:

```text
❯ /resume <session-id>
```

## 6. Exit

```text
❯ /exit
```

Use the [skills](../../../guides/skills.md), [subagents](../../../guides/subagents.md),
and [AGENT.md](../../../guides/agent-md.md) guides to evolve the project setup.
