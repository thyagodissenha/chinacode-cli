# Configuração

O ChinaCode lê configuração de variáveis de ambiente ou de um arquivo `.env` no diretório de trabalho atual.

---

## Variáveis obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `OPENAI_API_KEY` | API key do provedor LLM | `sk-xxxxxxxxxx` |
| `OPENAI_BASE_URL` | URL base da API (compatível com OpenAI) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

---

## Modelo

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DEFAULT_MODEL` | `qwen-plus` | Modelo padrão para tarefas gerais |
| `REASONING_MODEL` | — | Modelo para tarefas complexas (debug, análise, refactor) |
| `FAST_MODEL` | — | Modelo para tarefas rápidas (leitura, busca, listagem) |
| `LOCAL_MODEL` | — | Nome do modelo local (requer `LOCAL_ENABLED=true`) |
| `LOCAL_ENABLED` | `false` | Habilita modelo local via Ollama (`http://localhost:11434/v1`) |

**Roteamento inteligente:** O agente seleciona automaticamente o modelo mais adequado com base na intenção detectada no input do usuário:

- Palavras como `debug`, `explain`, `review`, `refactor` → `REASONING_MODEL`
- Palavras como `read`, `list`, `search`, `find` → `FAST_MODEL`
- Demais inputs → `DEFAULT_MODEL`

---

## Comportamento do agente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MAX_ITERATIONS` | `15` | Número máximo de ciclos de raciocínio por turno |
| `AUTO_APPROVE` | `false` | Aprova automaticamente escrita/edição de arquivos sem prompt |
| `SESSION_TIMEOUT_MS` | `300000` | Timeout de inatividade da sessão em ms (5 min) |
| `WORKSPACE_DIR` | `.` | Diretório base para resolução de caminhos relativos |

---

## Sandbox

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SANDBOX_ENABLED` | `true` | Executa comandos bash dentro de container Docker isolado |

Com `SANDBOX_ENABLED=true`, o Docker precisa estar instalado e em execução. Se não estiver disponível, o agente executa no host com um aviso.

---

## Preços (cost tracking)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PRICE_INPUT` | `0.8` | Custo por 1M tokens de input (USD) |
| `PRICE_OUTPUT` | `2.4` | Custo por 1M tokens de output (USD) |

> Ajuste esses valores conforme o provedor e modelo que você usa. Os valores padrão são aproximados para o Qwen Plus via DashScope.

---

## Exemplo de `.env` completo

```env
# Provedor
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Modelos
DEFAULT_MODEL=qwen-plus
REASONING_MODEL=qwen-max
FAST_MODEL=qwen-turbo

# Agente
MAX_ITERATIONS=15
AUTO_APPROVE=false
WORKSPACE_DIR=.

# Sandbox
SANDBOX_ENABLED=true

# Preços (USD por 1M tokens)
PRICE_INPUT=0.8
PRICE_OUTPUT=2.4
```

---

## Configuração para DeepSeek

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
DEFAULT_MODEL=deepseek-chat
REASONING_MODEL=deepseek-reasoner
PRICE_INPUT=0.27
PRICE_OUTPUT=1.10
```

---

## Configuração para Ollama (local, sem custo)

```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
DEFAULT_MODEL=qwen2.5-coder:7b
LOCAL_ENABLED=true
LOCAL_MODEL=qwen2.5-coder:7b
SANDBOX_ENABLED=false
PRICE_INPUT=0
PRICE_OUTPUT=0
```
