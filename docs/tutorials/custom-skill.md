# Tutorial: Criando uma Skill Customizada

Skills sao arquivos Markdown em `./skills/*.md` que ensinam o agente a executar uma categoria de tarefa com checklist e formato de saida proprios.

## Quando criar uma skill

Crie uma skill quando uma tarefa se repete no projeto e precisa de criterios consistentes, por exemplo:

- revisar migrations;
- gerar testes de API;
- auditar seguranca;
- preparar release notes;
- validar acessibilidade de UI.

## 1. Crie o arquivo

No diretorio do projeto:

```bash
mkdir -p skills
touch skills/api-contract-review.md
```

O nome do arquivo sem `.md` vira o identificador da skill: `api-contract-review`.

## 2. Escreva a estrutura minima

```markdown
# API Contract Review

## Quando usar
Quando o usuario pedir revisao de contrato de API, compatibilidade de endpoint ou mudanca em DTOs.

## Checklist
- [ ] Verificar se parametros obrigatorios continuam documentados
- [ ] Confirmar compatibilidade com clientes existentes
- [ ] Checar codigos de status e mensagens de erro
- [ ] Validar tipos TypeScript compartilhados
- [ ] Confirmar testes para sucesso, erro e edge cases

## Formato de saida
Liste achados em: Quebra de contrato | Risco | Sugestao.
Inclua arquivo e comportamento esperado em cada item.
```

A secao `## Quando usar` e importante: o loader usa esse texto como descricao curta no prompt do agente.

## 3. Confirme que a skill aparece

Inicie uma nova sessao:

```bash
chinacode
```

Depois:

```text
> /help
```

Se o arquivo estiver valido, a lista de skills disponiveis inclui `api-contract-review`.

## 4. Use a skill por intencao

Skills nao sao slash commands. O agente escolhe a skill quando a solicitacao combina com a descricao:

```text
> revise o contrato da API alterada em src/api/users.ts e aponte quebras para clientes existentes
```

Para reduzir ambiguidade, cite o nome da skill no prompt:

```text
> use a skill api-contract-review para revisar estas mudancas
```

## 5. Ative por padrao no AGENT.md

Adicione a skill ao `AGENT.md` do workspace:

```markdown
## Skills

- api-contract-review
- code-review
- test-generation
```

Use `/clear` ou inicie uma nova sessao para recarregar o arquivo.

## 6. Delegue para subagente quando fizer sentido

Subagentes usam a ferramenta interna `delegate_task` e podem receber uma skill especifica. Configure no `AGENT.md`:

```markdown
## Subagents

- name: api-reviewer
  model: qwen-plus
  skill: api-contract-review
```

Depois peca:

```text
> revise os contratos de API com um subagente e implemente apenas correcoes pequenas de documentacao
```

Use subagentes principalmente para leitura, analise, revisao e testes isolados. Para alteracoes amplas em codigo de producao, mantenha a execucao no agente principal.

## Boas praticas

- Mantenha a skill curta, operacional e especifica.
- Escreva checklists verificaveis, nao preferencias vagas.
- Defina formato de saida para facilitar triagem.
- Evite instrucoes que contradigam `AGENT.md`, PRD, TDD, SDD ou regras em `rules/`.
- Atualize a skill quando o processo do time mudar.
