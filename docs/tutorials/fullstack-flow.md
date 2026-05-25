# Tutorial: Fluxo Fullstack com ChinaCode

Este tutorial descreve um fluxo completo para planejar, implementar, testar e documentar uma mudanca fullstack usando o ChinaCode CLI.

O repositorio atual e uma CLI TypeScript, mas o fluxo vale para qualquer workspace com backend, frontend, testes e documentacao.

## Pre-requisitos

- `chinacode` instalado ou executado a partir do codigo-fonte.
- `.env` configurado com provedor compativel com OpenAI.
- Projeto aberto no diretorio onde o agente deve trabalhar.
- Opcional: Docker ativo para isolamento de comandos bash via `SANDBOX_ENABLED=true`.

Para desenvolvimento deste repo:

```bash
npm install
npm run build
npm run test:run
```

## 1. Configure modelos por tipo de tarefa

Use modelos diferentes para equilibrar custo e profundidade:

```env
DEFAULT_MODEL=qwen-plus
REASONING_MODEL=qwen-max
FAST_MODEL=qwen-turbo
MAX_ITERATIONS=15
SANDBOX_ENABLED=true
```

O roteamento inteligente usa `REASONING_MODEL` para entradas como `debug`, `review` e `refactor`, e `FAST_MODEL` para `read`, `list`, `search` e `find`.

## 2. Declare regras do workspace

Crie ou atualize `AGENT.md` na raiz do projeto:

```markdown
# Meu Projeto

## Identity

Voce e um engenheiro fullstack senior. Trabalhe de forma incremental e cite arquivos alterados.

## Rules

- Preserve contratos publicos existentes.
- Rode testes relevantes antes de concluir.
- Nao adicione dependencias sem explicar a necessidade.
- Atualize documentacao quando comandos, APIs ou fluxos mudarem.

## Skills

- code-review
- test-generation
- security-audit

## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation

- name: reviewer
  model: qwen-plus
  skill: code-review
```

O `AGENT.md` e lido ao iniciar a sessao. Use `/clear` para recarregar apos edita-lo.

## 3. Comece por descoberta

Peca ao agente para mapear o sistema antes de editar:

```text
> entenda a arquitetura deste projeto e explique onde implementar a mudanca: adicionar historico pesquisavel de sessoes
```

Em um fluxo fullstack real, peca para localizar:

- rotas ou comandos existentes;
- tipos e contratos compartilhados;
- componentes ou telas afetadas;
- testes do modulo;
- documentacao relacionada.

## 4. Quebre a tarefa

```text
> quebre essa mudanca em passos pequenos: backend, UI, testes e docs. Depois implemente o primeiro passo.
```

Para mudancas com risco, mantenha o agente principal nas decisoes arquiteturais e use subagentes para leitura, testes ou revisao.

## 5. Implemente incrementalmente

Exemplo de prompt para backend:

```text
> implemente a persistencia necessaria mantendo compatibilidade com o schema atual. Atualize testes unitarios do modulo.
```

Exemplo de prompt para UI ou CLI:

```text
> exponha o novo fluxo na interface existente, seguindo os padroes dos comandos atuais. Atualize a referencia de comandos.
```

O ChinaCode pode usar ferramentas como `read_file`, `edit_file`, `write_file`, `grep_search`, `glob_search`, `list_directory` e `bash`. Escritas mostram diff e pedem aprovacao quando `AUTO_APPROVE` nao esta ativo.

## 6. Teste e revise

Para este repo, os comandos principais sao:

```bash
npm run typecheck
npm run test:run
```

Tambem existem:

```bash
npm run build
npm run lint
```

Use o benchmark quando quiser comparar qualidade/custo entre modelos configurados:

```text
> /bench revise o modulo de sessoes e proponha melhorias
```

## 7. Atualize documentacao

Sempre que a entrega alterar comportamento visivel, atualize os docs correspondentes:

- `docs/reference/commands.md` para slash commands;
- `docs/reference/config.md` para variaveis de ambiente;
- `docs/reference/tools.md` para ferramentas nativas;
- `docs/guides/` para fluxos operacionais;
- `docs/tutorials/` para exemplos passo a passo.

## Checklist de entrega fullstack

- A mudanca foi dividida em passos pequenos.
- Contratos e tipos foram preservados ou documentados.
- Testes relevantes foram criados ou atualizados.
- `npm run typecheck` passou.
- `npm run test:run` passou ou a falha foi registrada.
- Documentacao foi atualizada quando necessario.
- O agente informou arquivos alterados, validacoes e riscos.
