# FAQ

## O que e o ChinaCode?

ChinaCode e uma CLI de agente de codigo open-source escrita em TypeScript para trabalhar com modelos compativeis com OpenAI, com foco em provedores como Qwen, DeepSeek, SiliconFlow e modelos locais via Ollama ou LM Studio.

## Qual versao de Node.js preciso usar?

Node.js 20 ou superior. O `package.json` declara `"node": ">=20.0.0"`.

## Como inicio uma sessao?

Configure `.env` no workspace e execute:

```bash
chinacode
```

Para desenvolvimento a partir do codigo-fonte:

```bash
npm install
npm run build
npm link
chinacode
```

## Quais variaveis sao obrigatorias?

As variaveis obrigatorias sao:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

`DEFAULT_MODEL` usa `qwen-plus` por padrao quando nao definido.

## Posso usar DeepSeek?

Sim. Exemplo:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
DEFAULT_MODEL=deepseek-chat
REASONING_MODEL=deepseek-reasoner
```

## Posso usar modelo local?

Sim, com endpoint compativel com OpenAI, como Ollama:

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

## O que o sandbox faz?

Com `SANDBOX_ENABLED=true`, comandos bash rodam dentro de um container Docker `alpine:latest`, sem rede, com limite de memoria e CPU. Se Docker nao estiver disponivel, o agente executa no host com aviso.

## O agente escreve arquivos sem permissao?

Por padrao, nao. `write_file` e `edit_file` mostram diff e pedem aprovacao. Com `AUTO_APPROVE=true`, as edicoes sao aprovadas automaticamente.

## Onde as sessoes ficam salvas?

Em `~/.chinacode/sessions.db`. Use:

```text
> /sessions
> /resume <id>
```

## Como vejo custo e tokens?

Use:

```text
> /cost
> /export
```

Os precos sao configurados por `PRICE_INPUT` e `PRICE_OUTPUT`, em USD por 1M tokens.

## O que sao skills?

Skills sao arquivos Markdown em `./skills/*.md` com instrucoes especializadas. O agente carrega esses arquivos na inicializacao e aplica a skill quando a tarefa combina com a descricao em `## Quando usar`.

## O que sao subagentes?

Subagentes sao loops ReAct isolados invocados pela ferramenta interna `delegate_task`. Eles recebem uma tarefa, opcionalmente uma skill e um modelo, executam ate 5 iteracoes e retornam o resultado ao agente principal.

## O ChinaCode suporta MCP?

Sim. Defina `MCP_ENABLED=true` e configure servidores em `mcp-servers.json`. As ferramentas sao expostas com namespace `mcp_<server>_<tool>`.

## O ChinaCode suporta RAG local?

Sim. Com `RAG_ENABLED=true`, o CLI indexa arquivos texto do workspace, ignorando `.git`, `dist` e `node_modules`, e injeta trechos relevantes por turno.

## Como valido uma mudanca neste repo?

Use os scripts existentes:

```bash
npm run typecheck
npm run test:run
npm run build
```

`npm run lint` tambem existe, mas verifica `src` via Biome.

## Onde encontro mais documentacao?

- `docs/getting-started/installation.md`
- `docs/getting-started/quick-start.md`
- `docs/reference/commands.md`
- `docs/reference/config.md`
- `docs/reference/tools.md`
- `docs/guides/skills.md`
- `docs/guides/subagents.md`
