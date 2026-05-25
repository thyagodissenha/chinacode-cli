# 第一个项目

本指南会创建一个最小 TypeScript 项目，并使用 ChinaCode CLI 读取、编辑和验证代码，同时保留交互式 diff 审批。

## 1. 创建项目

```bash
mkdir chinacode-demo
cd chinacode-demo
npm init -y
npm install -D typescript vitest @types/node
mkdir -p src skills
```

创建简单的 TypeScript 配置：

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

添加脚本：

```bash
npm pkg set scripts.test="vitest run"
npm pkg set scripts.typecheck="tsc --noEmit"
```

## 2. 配置 ChinaCode

创建 `.env`：

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

如果不使用 Docker，请设置 `SANDBOX_ENABLED=false`。

创建 `AGENT.md`：

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

创建子代理使用的 skill：

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

## 3. 启动 agent

全局安装后：

```bash
chinacode
```

在开发 CLI 时，可以从 `chinacode-cli` 仓库运行，并让 `WORKSPACE_DIR` 指向示例项目：

```bash
WORKSPACE_DIR=/absolute/path/to/chinacode-demo npm run dev
```

请把 `.env` 放在执行 `npm run dev` 的目录，或在 shell 中导出 provider 变量。`AGENT.md`、`skills/` 和被编辑的文件位于 `WORKSPACE_DIR` 指向的项目中。

## 4. 第一个任务

在 CLI prompt 中输入：

```text
❯ create src/calculator.ts with add and divide functions. Then generate tests with the tester subagent and validate with npm test.
```

预期流程：

1. agent 读取 workspace 结构。
2. agent 使用 `write_file` 或 `edit_file` 创建或编辑文件。
3. 因为 `AUTO_APPROVE=false`，CLI 会显示 diff 并请求审批。
4. agent 可以调用 `delegate_task`，通过 `test-generation` 生成测试。
5. agent 通过 `bash` 运行 `npm test`，并遵守 sandbox 配置。

如果 Docker sandbox 阻止访问本地依赖或命令，请运行：

```text
❯ /sandbox off
```

然后再次验证：

```text
❯ run npm test and npm run typecheck
```

## 5. 查看成本和会话

会话中可以运行：

```text
❯ /cost
❯ /sessions
```

稍后恢复：

```text
❯ /resume <session-id>
```

## 6. 退出

```text
❯ /exit
```

继续阅读 [skills](../../../guides/skills.md)、[subagents](../../../guides/subagents.md)
和 [AGENT.md](../../../guides/agent-md.md) 指南，完善项目配置。
