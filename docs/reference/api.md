# API e contratos de extensao

Esta referencia descreve os contratos publicos que integracoes, plugins e
documentacao externa podem assumir para o ChinaCode CLI 0.1.0.

---

## Binario CLI

O pacote expõe o binario `chinacode` via `package.json`.

```bash
npx chinacode
```

Durante desenvolvimento local:

```bash
npm install
npm run dev
```

Para testar o binario gerado:

```bash
npm run build
node dist/index.js
```

---

## Modelo de ferramentas

Ferramentas internas e ferramentas MCP sao registradas no mesmo formato:

```ts
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: unknown) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}
```

`parameters` deve ser um JSON Schema de objeto. O agente valida argumentos
antes da execucao sempre que a ferramenta fornece schema suficiente.

Ferramentas nativas disponiveis:

| Ferramenta | Responsabilidade |
|---|---|
| `read_file` | Ler arquivo com offset e limite |
| `write_file` | Criar ou sobrescrever arquivo com aprovacao de diff |
| `edit_file` | Substituir texto exato e unico em arquivo existente |
| `glob_search` | Localizar arquivos por padrao glob |
| `grep_search` | Buscar regex no conteudo dos arquivos |
| `list_directory` | Listar arquivos e diretorios |
| `bash` | Executar comando shell com timeout e sandbox opcional |
| `delegate_task` | Executar uma tarefa isolada em subagente |

Detalhes de parametros ficam em [tools.md](./tools.md).

---

## Mensagens do agente

O loop usa mensagens compativeis com APIs OpenAI-compatible:

```ts
type Role = "system" | "user" | "assistant" | "tool";

interface Message {
  role: Role;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}
```

`function.arguments` e sempre uma string JSON no formato retornado pelo modelo.
Quando o provedor nao retorna tool calls nativos, o parser fallback tenta extrair
blocos JSON em markdown antes de descartar a chamada.

---

## Configuracao de modelos

Cada modelo segue este contrato:

```ts
interface ModelConfig {
  provider:
    | "dashscope"
    | "deepseek"
    | "siliconflow"
    | "together"
    | "ollama"
    | "lmstudio"
    | "vllm";
  model: string;
  baseUrl: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

interface ModelSet {
  default: ModelConfig;
  reasoning?: ModelConfig;
  fast?: ModelConfig;
  local?: ModelConfig;
}
```

O roteador seleciona `reasoning`, `fast`, `local` ou `default` conforme a
intencao detectada no input e a disponibilidade de cada modelo. Veja
[config.md](./config.md) para variaveis de ambiente.

---

## Agent.md

`AGENT.md` e lido no diretorio do workspace. O parser reconhece secoes H1/H2
com estes nomes:

| Secao | Tipo | Efeito |
|---|---|---|
| `Identity` | texto | Define a persona do agente |
| `Rules` | lista | Adiciona regras obrigatorias ao prompt |
| `Skills` | lista | Lista skills esperadas pelo workspace |
| `Subagents` | blocos YAML simples | Define subagentes nomeados |

Formato de subagente:

```markdown
## Subagents

- name: reviewer
  model: qwen-plus
  skill: code-review
```

Skills em `skills/*.md` sao carregadas e adicionadas ao prompt do sistema.

---

## Manifesto de plugin

Plugins locais ficam em `plugins/<nome>/plugin.json`.

```json
{
  "name": "example-plugin",
  "version": "0.1.0",
  "description": "Plugin de exemplo",
  "commands": [
    {
      "name": "hello",
      "description": "Mostra uma saudacao",
      "usage": "/hello"
    }
  ],
  "tools": [
    {
      "name": "example_tool",
      "description": "Ferramenta de exemplo",
      "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": false
      }
    }
  ]
}
```

Regras de validacao:

| Campo | Regra |
|---|---|
| `name` | letras minusculas, numeros, `.`, `_` ou `-`; maximo 80 caracteres |
| `version` | string nao vazia |
| `description` | string nao vazia |
| `commands[].name` | comeca com letra; aceita letras, numeros, `:`, `_` e `-` |
| `tools[].name` | nome valido de funcao JavaScript |
| `tools[].parameters` | JSON Schema com `type: "object"` |

Na versao 0.1.0, o CLI descobre e valida manifestos de plugin, mas nao executa
codigo de plugin durante a descoberta.

---

## MCP

Quando `MCP_ENABLED=true`, o CLI le `mcp-servers.json`, inicia servidores e
registra ferramentas com namespace:

```text
mcp_<server>_<tool>
```

Servidores com erro sao ignorados com aviso para nao bloquear o uso dos demais.
Veja [mcp-integration.md](../guides/mcp-integration.md).

---

## Persistencia de sessoes

Sessoes ficam em SQLite via `better-sqlite3`, no banco
`~/.chinacode/sessions.db`.

Contrato salvo por sessao:

```ts
interface SessionRecord {
  id: string;
  directory: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  totalCost: number;
  messageCount: number;
  messages: string;
}
```

`messages` e JSON serializado de `Message[]`.

---

## Compatibilidade

| Area | Garantia em 0.1.x |
|---|---|
| Comandos slash documentados | Estaveis, salvo correcao de bug |
| Manifesto de plugin | Estavel para validacao local |
| `mcp-servers.json` | Estavel para `stdio` e `sse` |
| Tipos TypeScript internos | Podem mudar sem aviso ate 1.0 |
| Banco SQLite | Pode receber migracoes compativeis |
