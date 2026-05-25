# Quick Start

Este fluxo leva de um projeto vazio a uma sessao funcional do ChinaCode CLI em cerca de 5 minutos.

## 1. Abra um workspace

Use um projeto existente ou crie um diretorio pequeno para teste:

```bash
mkdir meu-projeto-chinacode
cd meu-projeto-chinacode
npm init -y
mkdir -p src skills
```

Se voce esta testando a partir do codigo-fonte do ChinaCode, este diretorio sera o workspace alvo. Mais abaixo, o comando `npm run dev` deve ser executado no repositorio do CLI com `WORKSPACE_DIR` apontando para este caminho.

## 2. Crie o `.env`

Escolha um provedor OpenAI-compatible. Exemplo com Qwen via DashScope:

```bash
cat > .env <<'EOF'
OPENAI_API_KEY=sk-sua-chave
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
FAST_MODEL=qwen-turbo
SANDBOX_ENABLED=true
AUTO_APPROVE=false
PRICE_INPUT=0.8
PRICE_OUTPUT=2.4
EOF
```

Sem Docker, troque para:

```env
SANDBOX_ENABLED=false
```

## 3. Adicione instrucoes do agente

Crie `AGENT.md` na raiz do workspace. O CLI le este arquivo na inicializacao para definir identidade, regras, skills padrao e subagentes configurados.

```bash
cat > AGENT.md <<'EOF'
# Meu Projeto

## Identity

Voce e um agente de codigo TypeScript. Seja direto, faca mudancas pequenas e cite arquivos modificados.

## Rules

- Antes de editar, leia o arquivo relevante
- Prefira TypeScript simples e testavel
- Depois de editar, sugira ou execute uma validacao adequada

## Skills

- test-generation

## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation
EOF
```

Adicione uma skill simples para o subagente de testes:

```bash
cat > skills/test-generation.md <<'EOF'
# Test Generation

## Quando usar
Quando o usuario pedir testes, specs ou cobertura.

## Checklist
- Cobrir caminho feliz
- Cobrir entradas vazias ou invalidas
- Usar Vitest quando o projeto ja usa Vitest

## Formato de saida
Liste arquivos criados ou modificados e comandos de validacao.
EOF
```

## 4. Inicie o CLI

Com o pacote global:

```bash
chinacode
```

A partir do repositorio do ChinaCode, sem link global:

```bash
WORKSPACE_DIR=/caminho/absoluto/para/meu-projeto-chinacode npm run dev
```

Nesse modo, o `.env` precisa estar disponivel no diretorio onde `npm run dev` e executado ou as variaveis precisam estar exportadas no shell.

Ao iniciar, o CLI mostra o cabecalho da versao e a mensagem:

```text
ChinaCode CLI v0.1.0 - pronto. Digite /help para ajuda.
```

## 5. Use o primeiro agente

No prompt `❯`, comece com uma tarefa de leitura:

```text
❯ liste a estrutura deste projeto e diga quais arquivos de configuracao voce encontrou
```

Depois peca uma primeira mudanca pequena:

```text
❯ crie src/math.ts com uma funcao add(a, b) e gere um teste usando o subagente tester
```

O agente pode usar ferramentas como `list_directory`, `write_file`, `edit_file`, `bash` e `delegate_task`. Quando houver escrita de arquivo com `AUTO_APPROVE=false`, o CLI exibe um diff e pede aprovacao:

```text
Aprovar? [Y]es / [N]o / [A]lways:
```

| Resposta | Efeito |
|----------|--------|
| `Y` ou Enter | Aprova apenas esta escrita |
| `N` | Rejeita a escrita; o agente pode tentar outro caminho |
| `A` | Aprova automaticamente as proximas escritas da sessao |

## 6. Comandos uteis

| Comando | O que faz |
|---------|-----------|
| `/help` | Lista comandos e skills carregadas |
| `/model <nome>` | Troca o modelo padrao da sessao |
| `/sandbox on` ou `/sandbox off` | Liga ou desliga sandbox Docker |
| `/cost` | Mostra tokens e custo acumulados |
| `/bench <tarefa>` | Compara a tarefa entre modelos configurados |
| `/sessions` | Lista sessoes salvas |
| `/resume <id>` | Retoma uma sessao anterior |
| `/compact` | Sumariza contexto longo |
| `/exit` | Encerra o CLI |

O historico fica em `~/.chinacode/sessions.db` e e atualizado durante a sessao e ao sair.

## 7. Encerrar

```text
❯ /cost
❯ /exit
```

Voce tambem pode pressionar Ctrl+C duas vezes para encerrar.

## Proximos passos

- [Primeiro projeto](./first-project.md)
- [Configuracao completa](../reference/config.md)
- [Comandos](../reference/commands.md)
- [Ferramentas nativas](../reference/tools.md)
- [Guia do AGENT.md](../guides/agent-md.md)
- [Subagentes](../guides/subagents.md)
