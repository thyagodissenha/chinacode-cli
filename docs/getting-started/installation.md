# Instalação

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 20.0.0 |
| npm | 10.0.0 |
| Docker (opcional) | 24.0.0 |

> **Docker** é opcional. Sem ele, comandos bash são executados diretamente no sistema host sem isolamento de rede ou memória.

---

## Instalação via npm (recomendado)

```bash
npm install -g chinacode
```

Verifique a instalação:

```bash
chinacode --version
```

---

## Instalação a partir do código-fonte

```bash
# Clone o repositório
git clone https://github.com/thyagodissenha/chinacode-cli.git
cd chinacode-cli

# Instale as dependências
npm install

# Build
npm run build

# Link global (opcional)
npm link
```

---

## Configuração inicial

Crie um arquivo `.env` na raiz do diretório onde você vai rodar o `chinacode`:

```bash
cp .env.example .env   # se disponível, ou crie manualmente
```

Conteúdo mínimo do `.env`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
```

> Consulte [config.md](../reference/config.md) para todas as variáveis disponíveis.

---

## Provedores suportados

| Provedor | BASE_URL | Modelos comuns |
|----------|----------|----------------|
| DashScope (Qwen) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus, qwen-max, qwen-turbo |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner |
| SiliconFlow | `https://api.siliconflow.cn/v1` | Qwen2.5, DeepSeek-V3 |
| Ollama (local) | `http://localhost:11434/v1` | llama3, qwen2.5-coder |
| LM Studio (local) | `http://localhost:1234/v1` | qualquer modelo carregado |

---

## Próximo passo

→ [Quick Start](./quick-start.md)
