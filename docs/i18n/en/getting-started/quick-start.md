# Quick Start

This guide takes you from zero to a working session in less than 5 minutes.

---

## 1. Configure your API key

```bash
# Create the .env file in your project directory
echo 'OPENAI_API_KEY=your-key-here' > .env
echo 'OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1' >> .env
echo 'DEFAULT_MODEL=qwen-plus' >> .env
```

---

## 2. Start ChinaCode

```bash
# In your project directory
chinacode
```

You will see the header:

```text
────────────────────────────────────────────────────────────
  ChinaCode CLI v0.1.0 | model: qwen-plus | sandbox: on
────────────────────────────────────────────────────────────
❯
```

---

## 3. Ask your first question

```text
❯ list the TypeScript files in this project
```

The agent will use the `glob_search` tool to find the files and display the result.

---

## 4. Request a code change

```text
❯ add a sum(a, b) function to the src/utils.ts file
```

When the agent proposes writing the file, you will see a diff and can approve it:

```text
📝 src/utils.ts
+ export function sum(a: number, b: number): number {
+   return a + b
+ }

Approve? [Y]es / [N]o / [A]lways:
```

- **Y** - approves this edit
- **N** - rejects it and the agent tries another approach
- **A** - approves this edit and all following edits in the session

---

## 5. Useful session commands

| Command | What it does |
|---------|--------------|
| `/help` | Lists all available commands |
| `/cost` | Shows accumulated tokens and cost |
| `/clear` | Clears the conversation history |
| `/exit` | Exits the CLI |

> See [commands.md](../../../reference/commands.md) for the complete list.

---

## 6. Ending the session

```text
❯ /exit
```

Or press **Ctrl+C** twice within 800ms.

The session is saved automatically to `~/.chinacode/sessions.db` and can be resumed with `/resume <id>`.

---

## Next steps

- [Slash command reference](../../../reference/commands.md)
- [Native tools](../../../reference/tools.md)
- [Complete configuration](../../../reference/config.md)
- [Common errors and solutions](../../../reference/errors.md)
