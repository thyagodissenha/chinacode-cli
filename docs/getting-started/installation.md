# Instalacao

Este guia instala o ChinaCode CLI e deixa uma configuracao minima pronta para abrir a primeira sessao.

## Pre-requisitos

| Requisito | Versao minima | Observacao |
|-----------|---------------|------------|
| Node.js | 20.0.0 | Necessario para instalar e executar o CLI |
| npm | 10.0.0 | Usado para instalar dependencias e rodar scripts |
| Docker | 24.0.0 | Opcional; habilita sandbox para comandos `bash` |

Com Docker indisponivel, o CLI continua funcionando, mas comandos `bash` rodam diretamente no host quando o sandbox estiver ativo e o fallback for acionado. Para desativar o sandbox explicitamente, use `SANDBOX_ENABLED=false` no `.env` ou `/sandbox off` dentro da sessao.

Verifique as versoes locais:

```bash
node --version
npm --version
docker --version
```

## Instalar pelo npm

Quando o pacote publico estiver disponivel, instale o binario global:

```bash
npm install -g chinacode
```

Depois, inicie o CLI em qualquer workspace com:

```bash
chinacode
```

O comando mostra o cabecalho com a versao do CLI ao iniciar a sessao.

## Instalar a partir do codigo-fonte

Use este fluxo para desenvolver o proprio CLI ou testar a versao atual do repositorio:

```bash
git clone https://github.com/thyagodissenha/chinacode-cli.git
cd chinacode-cli
npm install
npm run build
```

Execute sem instalar globalmente a partir da raiz do repositorio:

```bash
npm run dev
```

Esse modo usa o diretorio atual como workspace e carrega `.env` desse mesmo diretorio. Para desenvolver o CLI contra outro projeto, exporte as variaveis do provedor no shell ou mantenha o `.env` no repositorio do CLI e aponte `WORKSPACE_DIR` para o projeto alvo:

```bash
WORKSPACE_DIR=/caminho/absoluto/para/meu-projeto npm run dev
```

Ou crie um link global local:

```bash
npm link
chinacode
```

Scripts disponiveis no repositorio:

| Script | Uso |
|--------|-----|
| `npm run dev` | Executa `src/index.ts` com `tsx` |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Executa `dist/index.js` apos o build |
| `npm run typecheck` | Valida tipos sem emitir arquivos |
| `npm test` | Roda a suite Vitest em modo watch |
| `npm run test:run` | Roda a suite Vitest uma vez |

## Configurar `.env`

O ChinaCode le variaveis de ambiente e tambem carrega um arquivo `.env` no diretorio onde voce executa o comando. Para a primeira execucao dentro deste repositorio:

```bash
cp .env.example .env
```

Para outro projeto, crie um `.env` na raiz desse workspace. Configuracao minima para DashScope/Qwen:

```env
OPENAI_API_KEY=sk-sua-chave
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
```

Configuracao minima para DeepSeek:

```env
OPENAI_API_KEY=sk-sua-chave
OPENAI_BASE_URL=https://api.deepseek.com/v1
DEFAULT_MODEL=deepseek-chat
```

Configuracao local com Ollama:

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

Variaveis uteis para o primeiro uso:

| Variavel | Padrao | Quando ajustar |
|----------|--------|----------------|
| `REASONING_MODEL` | nao definido | Tarefas de debug, review e refactor |
| `FAST_MODEL` | nao definido | Leituras, buscas e listagens rapidas |
| `MAX_ITERATIONS` | `15` | Limitar ciclos do agente por turno |
| `AUTO_APPROVE` | `false` | Aprovar edicoes sem prompt interativo |
| `SANDBOX_ENABLED` | `true` | Desativar se voce nao usa Docker |
| `WORKSPACE_DIR` | `.` | Apontar o agente para outro diretorio base |
| `PRICE_INPUT` | `0.8` | Custo por 1M tokens de entrada |
| `PRICE_OUTPUT` | `2.4` | Custo por 1M tokens de saida |

Veja a lista completa em [Configuracao](../reference/config.md).

## Validar a instalacao

No repositorio do ChinaCode:

```bash
npm run typecheck
npm run build
npm run dev
```

Em um projeto que usa o binario global:

```bash
chinacode
```

Dentro da sessao, rode:

```text
❯ /help
❯ /cost
❯ /exit
```

Se o CLI abrir, listar comandos e encerrar mostrando o resumo da sessao, a instalacao esta funcional.

## Proximo passo

Siga para o [Quick Start](./quick-start.md) para usar o primeiro agente em poucos minutos.
