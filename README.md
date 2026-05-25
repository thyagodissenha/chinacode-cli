# ChinaCode CLI

ChinaCode is an open-source coding agent CLI for OpenAI-compatible Chinese LLM providers such as Qwen, DeepSeek, SiliconFlow, Ollama, and LM Studio.

## Quick Start

Run without installing globally:

```bash
npx chinacode
```

Or install the CLI:

```bash
npm install -g chinacode
chinacode
```

The package requires Node.js 20 or newer.

## Minimal Configuration

Create a `.env` file in the project where you run `chinacode`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
```

For DeepSeek:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
DEFAULT_MODEL=deepseek-chat
REASONING_MODEL=deepseek-reasoner
```

## Common Commands

```bash
chinacode
```

Inside the CLI prompt:

```text
/help
/cost
/sessions
/resume <id>
/exit
```

## Documentation

- [Installation](docs/getting-started/installation.md)
- [Configuration](docs/reference/config.md)
- [Slash Commands](docs/reference/commands.md)
- [npm Publishing](docs/reference/npm-publishing.md)

## Publishing Status

The CLI is prepared for npm distribution as the `chinacode` package. The `bin` entry exposes the `chinacode` command, so users can run it with `npx chinacode` after publication.

See [docs/reference/npm-publishing.md](docs/reference/npm-publishing.md) for the release checklist.

## License

MIT
