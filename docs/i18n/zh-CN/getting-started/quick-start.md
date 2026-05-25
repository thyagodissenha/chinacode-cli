# 快速开始

本指南将帮助你在 5 分钟内从零开始进入可用会话。

---

## 1. 配置 API key

```bash
# 在你的项目目录中创建 .env 文件
echo 'OPENAI_API_KEY=your-key-here' > .env
echo 'OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1' >> .env
echo 'DEFAULT_MODEL=qwen-plus' >> .env
```

---

## 2. 启动 ChinaCode

```bash
# 在你的项目目录中
chinacode
```

你会看到标题栏：

```text
────────────────────────────────────────────────────────────
  ChinaCode CLI v0.1.0 | model: qwen-plus | sandbox: on
────────────────────────────────────────────────────────────
❯
```

---

## 3. 提出第一个问题

```text
❯ list the TypeScript files in this project
```

agent 会使用 `glob_search` 工具查找 TypeScript 文件并显示结果。

---

## 4. 请求代码修改

```text
❯ add a sum(a, b) function to the src/utils.ts file
```

当 agent 提议写入文件时，你会看到 diff，并可以批准：

```text
📝 src/utils.ts
+ export function sum(a: number, b: number): number {
+   return a + b
+ }

Approve? [Y]es / [N]o / [A]lways:
```

- **Y** - 批准本次编辑
- **N** - 拒绝，agent 会尝试另一种方式
- **A** - 批准本次编辑以及本会话中的后续所有编辑

---

## 5. 会话中的常用命令

| 命令 | 作用 |
|------|------|
| `/help` | 列出所有可用命令 |
| `/cost` | 显示累计 tokens 和费用 |
| `/clear` | 清空对话历史 |
| `/exit` | 退出 CLI |

> 查看 [commands.md](../../../reference/commands.md) 获取完整列表。

---

## 6. 结束会话

```text
❯ /exit
```

或在 800ms 内按两次 **Ctrl+C**。

会话会自动保存到 `~/.chinacode/sessions.db`，可以使用 `/resume <id>` 恢复。

---

## 下一步

- [Slash 命令参考](../../../reference/commands.md)
- [原生工具](../../../reference/tools.md)
- [完整配置](../../../reference/config.md)
- [常见错误和解决方案](../../../reference/errors.md)
