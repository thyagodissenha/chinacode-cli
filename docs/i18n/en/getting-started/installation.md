# Installation

## Prerequisites

| Requirement | Minimum version |
|-------------|-----------------|
| Node.js | 20.0.0 |
| npm | 10.0.0 |
| Docker (optional) | 24.0.0 |

> **Docker** is optional. Without it, bash commands run directly on the host system without network or memory isolation.

---

## Install with npm (recommended)

```bash
npm install -g chinacode
```

Verify the installation:

```bash
chinacode --version
```

---

## Install from source

```bash
# Clone the repository
git clone https://github.com/thyagodissenha/chinacode-cli.git
cd chinacode-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

---

## Initial configuration

Create a `.env` file at the root of the directory where you will run `chinacode`:

```bash
cp .env.example .env   # if available, or create it manually
```

Minimum `.env` contents:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
```

> See [config.md](../../../reference/config.md) for all available variables.

---

## Supported providers

| Provider | BASE_URL | Common models |
|----------|----------|---------------|
| DashScope (Qwen) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus, qwen-max, qwen-turbo |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner |
| SiliconFlow | `https://api.siliconflow.cn/v1` | Qwen2.5, DeepSeek-V3 |
| Ollama (local) | `http://localhost:11434/v1` | llama3, qwen2.5-coder |
| LM Studio (local) | `http://localhost:1234/v1` | any loaded model |

---

## Next step

-> [Quick Start](./quick-start.md)
