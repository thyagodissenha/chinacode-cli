# Hard Launch Social Posts

All URLs are placeholders until launch readiness review. Replace placeholders before publishing.

## Hacker News

Title:

```text
Show HN: ChinaCode CLI - open-source coding agent for Qwen, DeepSeek, and MiMo
```

Post body:

```text
Hi HN,

I built ChinaCode CLI, an open-source terminal coding agent for Chinese LLM providers such as Qwen, DeepSeek, and MiMo.

Repo: [GITHUB_REPO_URL]
Install: npm install -g chinacode
Docs: [DOCS_URL]
Demo: [DEMO_GIF_URL]

The goal is a practical Claude Code-style workflow for developers who want provider choice, lower-cost models, regional availability, or OpenAI-compatible Chinese LLM APIs.

Current features include:
- terminal-native agent workflow
- file/context handling for coding tasks
- tool calls and automatic error recovery
- skills and subagents
- MCP integration
- provider configuration for Chinese LLMs

This is an early public launch, so I would especially appreciate feedback on install friction, provider setup, missing docs, and where the agent fails on real coding tasks.
```

First comment:

```text
A few notes to set expectations:

- This is not claiming drop-in parity with Claude Code.
- The main angle is provider choice and open-source extensibility.
- Benchmarks and known limitations are here: [BENCHMARKS_URL]
- If you hit a bug, please file it here: [GITHUB_REPO_URL]/issues

I will be in the thread today and will turn repeated questions into docs fixes.
```

## Reddit

### r/programming

Title:

```text
ChinaCode CLI: an open-source terminal coding agent for Qwen, DeepSeek, and MiMo
```

Body:

```text
I am launching ChinaCode CLI, an open-source coding agent that runs from the terminal and targets Chinese LLM providers such as Qwen, DeepSeek, and MiMo.

Links:
- GitHub: [GITHUB_REPO_URL]
- npm: [NPM_PACKAGE_URL]
- Docs: [DOCS_URL]
- Demo GIF: [DEMO_GIF_URL]

Why I built it:
- provider choice matters for cost, availability, and model diversity
- many Chinese LLMs expose OpenAI-compatible APIs but lack polished coding-agent workflows
- the coding-agent loop should be inspectable and extensible

I am looking for technical feedback on the architecture, installation flow, provider setup, and missing docs.
```

### r/LocalLLaMA

Title:

```text
Open-source coding agent focused on Qwen, DeepSeek, MiMo, and OpenAI-compatible providers
```

Body:

```text
ChinaCode CLI is a terminal coding agent for developers experimenting with Chinese LLM providers and OpenAI-compatible APIs.

GitHub: [GITHUB_REPO_URL]
Docs: [DOCS_URL]
Demo: [DEMO_GIF_URL]

The project is built around a practical coding loop: gather context, call tools, edit files, recover from errors, and work with skills/subagents/MCP.

I would value feedback from this community on:
- provider configuration
- local or self-hosted model compatibility expectations
- benchmark design
- which Qwen/DeepSeek/MiMo coding workflows should be tested first
```

### r/commandline

Title:

```text
I built an open-source CLI coding agent for Chinese LLM providers
```

Body:

```text
ChinaCode CLI is a command-line coding agent for Qwen, DeepSeek, MiMo, and compatible APIs.

GitHub: [GITHUB_REPO_URL]
Install: npm install -g chinacode
Docs: [DOCS_URL]

The focus is a terminal-native workflow rather than an IDE extension: configure a provider, run the agent in a repo, let it inspect files, call tools, and propose edits.

I am especially interested in command-line UX feedback: config shape, prompts, error messages, install friction, and defaults.
```

### r/opensource

Title:

```text
Launching ChinaCode CLI, an MIT-licensed coding agent for Chinese LLMs
```

Body:

```text
I am launching ChinaCode CLI as an MIT-licensed open-source project.

GitHub: [GITHUB_REPO_URL]
Docs: [DOCS_URL]
Contributing: [GITHUB_REPO_URL]/blob/main/CONTRIBUTING.md

The project provides a terminal coding-agent workflow for Chinese LLM providers such as Qwen, DeepSeek, and MiMo. Early contributor areas include provider adapters, docs, examples, MCP integrations, skills, and benchmarks.

Feedback on contributor onboarding and issue structure is welcome.
```

## V2EX

Title:

```text
发布 ChinaCode CLI：面向 Qwen、DeepSeek、MiMo 的开源终端编程 Agent
```

Body:

```text
大家好，我在发布 ChinaCode CLI，一个面向 Qwen、DeepSeek、MiMo 等中文大模型服务商的开源终端编程 Agent。

GitHub: [GITHUB_REPO_URL]
npm: [NPM_PACKAGE_URL]
文档: [DOCS_URL]
Demo: [DEMO_GIF_URL]

它的目标不是简单复制某个闭源工具，而是提供一个可审计、可扩展、支持多服务商的命令行编程工作流。

当前重点：
- 终端内完成代码任务
- 支持文件上下文和工具调用
- 支持 Skills、Subagents、MCP
- 支持 Qwen、DeepSeek、MiMo 及 OpenAI-compatible API

希望收到这些反馈：
- 安装和配置是否顺畅
- 中文模型服务商的配置是否清楚
- 文档还缺什么
- 真实代码任务中哪里最容易失败
```

## Zhihu

Article title:

```text
我们为什么需要一个面向中文大模型的开源编程 Agent？
```

Opening:

```text
今天发布 ChinaCode CLI：一个面向 Qwen、DeepSeek、MiMo 等中文大模型服务商的开源终端编程 Agent。

项目地址：[GITHUB_REPO_URL]
文档：[DOCS_URL]
Demo：[DEMO_GIF_URL]

过去一年，编程 Agent 的产品形态逐渐清晰：它们不只是聊天机器人，而是在真实代码仓库里读取上下文、调用工具、修改文件、运行测试，并根据错误继续迭代。

但如果开发者希望使用 Qwen、DeepSeek、MiMo 或其他 OpenAI-compatible 的中文大模型服务，完整的终端编程 Agent 工作流仍然不够顺手。ChinaCode CLI 想解决这个问题。
```

Outline:

```text
1. 编程 Agent 和普通聊天工具的区别
2. 为什么中文大模型服务商需要更好的开发者工具
3. ChinaCode CLI 的设计目标
4. 当前已经支持的能力
5. 不夸大的地方：仍然是早期版本
6. 如何安装和试用
7. 希望社区一起贡献什么
```

Closing:

```text
如果你正在使用 Qwen、DeepSeek、MiMo 或 OpenAI-compatible API 做开发工具，欢迎试用、提 Issue 或贡献 provider、文档、benchmark。

GitHub: [GITHUB_REPO_URL]
```

## Juejin

Title:

```text
ChinaCode CLI：把 Qwen、DeepSeek、MiMo 接入终端编程 Agent 工作流
```

Body:

```text
ChinaCode CLI 是一个开源命令行工具，目标是让开发者可以用 Qwen、DeepSeek、MiMo 等中文大模型服务商完成真实代码任务。

项目地址：[GITHUB_REPO_URL]
安装：[NPM_PACKAGE_URL]
文档：[DOCS_URL]

核心场景：
- 在现有代码仓库中让 Agent 读取上下文
- 根据需求修改文件
- 调用工具并根据错误恢复
- 使用 Skills、Subagents 和 MCP 扩展能力

适合谁：
- 正在评估中文大模型编程能力的开发者
- 想降低 Agent 使用成本的团队
- 希望工具链可审计、可扩展的开源用户

这次发布希望收集真实使用反馈，尤其是安装、配置、模型效果、错误恢复和文档问题。
```

## Twitter/X

### Launch Thread

Post 1:

```text
Launching ChinaCode CLI today.

It is an open-source terminal coding agent for Qwen, DeepSeek, MiMo, and OpenAI-compatible Chinese LLM providers.

GitHub: [GITHUB_REPO_URL]
Demo: [DEMO_GIF_URL]
```

Post 2:

```text
The goal: bring a Claude Code-style coding loop to developers who want provider choice, lower-cost models, regional availability, and inspectable open-source agent behavior.
```

Post 3:

```text
Current features:

- terminal-native coding workflow
- file context for repo tasks
- tool calls
- automatic error recovery
- skills and subagents
- MCP integration
- provider config for Qwen, DeepSeek, MiMo
```

Post 4:

```text
Install:

npm install -g chinacode

Docs: [DOCS_URL]
npm: [NPM_PACKAGE_URL]
Benchmarks/limitations: [BENCHMARKS_URL]
```

Post 5:

```text
This is an early public launch. I am looking for feedback on install friction, provider setup, docs, benchmarks, and real coding tasks where the agent fails.

Issues and contributions welcome: [GITHUB_REPO_URL]
```

### Short Posts

```text
ChinaCode CLI is live: an open-source coding agent for Qwen, DeepSeek, MiMo, and OpenAI-compatible Chinese LLMs.

[GITHUB_REPO_URL]
```

```text
If you are experimenting with Qwen or DeepSeek for coding, I would love feedback on ChinaCode CLI's terminal agent workflow.

Repo: [GITHUB_REPO_URL]
Docs: [DOCS_URL]
```

```text
Day 1 launch update for ChinaCode CLI:

- [STAR_COUNT] GitHub stars
- [NPM_DOWNLOADS] npm downloads
- [ISSUES_OPENED] issues opened
- shipped [PATCH_RELEASE_OR_DOC_FIX]

Repo: [GITHUB_REPO_URL]
```

## Reply Snippets

```text
Thanks for trying it. Could you open an issue with your provider config shape, error output, and Node version? [GITHUB_REPO_URL]/issues
```

```text
That is a fair limitation. The current release focuses on provider choice and terminal workflow; parity with closed-source coding agents is not something we are claiming yet.
```

```text
Benchmarks are tracked here: [BENCHMARKS_URL]. Reproducible benchmark PRs are welcome because model/provider behavior changes quickly.
```

```text
The project should work with OpenAI-compatible APIs where the provider supports the required chat/tool behavior. Provider-specific docs are here: [DOCS_URL]
```
