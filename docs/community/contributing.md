# Contributing

Obrigado por contribuir com o ChinaCode CLI. Este documento descreve o fluxo recomendado para mudancas no repositorio.

## Ambiente local

Requisitos:

- Node.js 20 ou superior.
- npm 10 ou superior.
- Docker opcional para sandbox de comandos.

Setup:

```bash
npm install
npm run build
npm run test:run
```

Para usar a CLI localmente:

```bash
npm link
chinacode
```

## Estrutura do projeto

- `src/index.ts`: entrada da CLI.
- `src/agent/`: loop principal, subagentes, compactacao e `AGENT.md`.
- `src/tools/`: ferramentas nativas, incluindo filesystem, bash e delegacao.
- `src/models/`: cliente, roteamento, retry e erros de modelo.
- `src/storage/`: persistencia de sessoes.
- `src/skills/`: loader de skills Markdown.
- `src/mcp/`: configuracao e hub MCP.
- `src/rag/`: indice local de contexto.
- `docs/`: documentacao para usuarios e contribuidores.
- `skills/`: skills de exemplo carregadas pelo CLI em um workspace.
- `plugins/`: manifestos de plugins locais.

## Fluxo de trabalho

1. Abra uma issue ou descreva claramente o problema.
2. Mantenha mudancas pequenas e rastreaveis.
3. Antes de editar, leia os docs e testes do modulo afetado.
4. Preserve comportamento publico, salvo quando a mudanca exigir alteracao documentada.
5. Atualize ou crie testes para comportamento novo ou corrigido.
6. Atualize documentacao quando comandos, configuracao, ferramentas ou fluxos mudarem.

## Padroes de codigo

- Use TypeScript.
- Mantenha imports e tipos consistentes com os arquivos vizinhos.
- Prefira funcoes pequenas e erros explicitos.
- Evite dependencias novas sem justificativa clara.
- Nao registre secrets em logs, testes ou documentacao.
- Use validacao estruturada quando lidar com entrada externa; o repo usa `zod` em varios contratos.

## Testes e validacao

Comandos principais:

```bash
npm run typecheck
npm run test:run
npm run build
```

Outros comandos uteis:

```bash
npm run test
npm run lint
npm run format
```

Ao abrir uma mudanca, informe:

- comandos executados;
- resultado dos testes;
- arquivos principais alterados;
- riscos ou limitacoes conhecidas.

## Documentacao

Atualize:

- `docs/reference/commands.md` ao adicionar ou alterar slash commands;
- `docs/reference/config.md` ao adicionar variaveis de ambiente;
- `docs/reference/tools.md` ao adicionar ou alterar ferramentas nativas;
- `docs/guides/` para explicacoes conceituais;
- `docs/tutorials/` para fluxos passo a passo;
- `docs/community/faq.md` para duvidas recorrentes.

Use exemplos executaveis e evite documentar funcionalidades que ainda nao existem.

## Pull requests

Um bom PR inclui:

- descricao do problema;
- resumo da solucao;
- arquivos ou modulos afetados;
- testes executados;
- screenshots ou logs quando houver mudanca visivel;
- pendencias conhecidas, se existirem.

## Trabalho com agentes

Este projeto pode receber contribuicoes feitas com agentes. Ao usar agentes:

- declare escopo de escrita e leitura;
- nao reverta mudancas de outro colaborador sem alinhamento;
- cite os arquivos alterados no fechamento;
- valide com comandos locais;
- mantenha prompts e documentacao consistentes com o comportamento real do repo.
