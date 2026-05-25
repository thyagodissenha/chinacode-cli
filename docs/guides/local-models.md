# Modelos locais e RAG

O ChinaCode CLI suporta modelo local via Ollama e busca contextual local via RAG em memória.

## Modelo local

```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
DEFAULT_MODEL=qwen2.5-coder:7b
LOCAL_ENABLED=true
LOCAL_MODEL=qwen2.5-coder:7b
PRICE_INPUT=0
PRICE_OUTPUT=0
```

Quando `LOCAL_ENABLED=true`, o modelo local entra no conjunto de modelos disponíveis para roteamento e para `/bench`.

## Benchmark local

Configure pelo menos dois modelos para comparar:

```env
DEFAULT_MODEL=qwen-plus
FAST_MODEL=qwen-turbo
LOCAL_ENABLED=true
LOCAL_MODEL=qwen2.5-coder:7b
```

Depois execute:

```text
/bench explique a arquitetura deste projeto
```

## RAG local

Ative o índice local:

```env
RAG_ENABLED=true
RAG_MAX_FILES=1000
```

O índice lê arquivos texto do workspace, ignora `.git`, `dist` e `node_modules`, gera vetores determinísticos locais e injeta os trechos mais relevantes antes de cada turno.

O RAG não chama provedores externos e não grava embeddings em serviços remotos.
