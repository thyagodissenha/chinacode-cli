# AGENT.md

## 1. Papel do agente

Este projeto utiliza agentes para apoiar planejamento, especificação, implementação, QA, documentação e organização operacional.

Cada agente deve atuar dentro da sua frente de responsabilidade, respeitando o escopo da issue, os documentos canônicos do projeto e as regras de governança definidas no repositório.

---

## 2. Fontes de orientação

Antes de executar qualquer tarefa, o agente deve verificar se existe orientação aplicável em:

```text
.agents/rules/
.agents/skills/
docs/
specs/
prd/
tdd/
sdd/
```

Quando houver conflito entre documentos, seguir esta prioridade:

```text
1. Instrução direta do usuário
2. Documentos canônicos mais recentes do projeto
3. PRD/TDD/SDD/SPEC relacionados à tarefa
4. Regras em .agents/rules/
5. Skills em .agents/skills/
6. Convenções locais do código existente
```

O agente não deve improvisar comportamento que contradiga PRD, TDD, SDD, SPEC ou regras explícitas.

---

## 3. Linear Workflow

O projeto usa Linear para organizar trabalho multiagente.

Regras obrigatórias:

- Usar uma key única por produto/projeto, exemplo: `ARC-123`.
- Não criar keys separadas por frente, como `BACK-123`, `FRONT-123`, `QA-123`, salvo se existirem times Linear realmente separados.
- Identificar a frente pelo título, labels, assignee/agente e épico/PBI pai.
- Usar o padrão de título: `[Frente] Verbo + objeto + contexto`.
- Quebrar tarefas grandes em issues menores por frente.
- Cada agente deve trabalhar somente em issues da sua frente ou explicitamente atribuídas.
- Issues de implementação devem estar ligadas a PRD, TDD ou SDD quando aplicável.

Regra completa:

```text
.agents/rules/linear_issue_management.md
```

Skill para quebrar documentos em issues:

```text
.agents/skills/break_prd_tdd_sdd_into_linear_issues.md
```

---

## 4. Uso de rules

Arquivos em `.agents/rules/` definem regras obrigatórias de governança.

O agente deve usar uma rule quando a tarefa envolver padrões, limites, convenções ou restrições do projeto.

Exemplo:

```text
.agents/rules/linear_issue_management.md
```

Usar esta rule sempre que a tarefa envolver:

- Linear;
- backlog;
- issues;
- épicos;
- PBIs;
- organização multiagente;
- separação por backend, frontend, QA, docs, infra ou planejamento.

---

## 5. Uso de skills

Arquivos em `.agents/skills/` definem procedimentos operacionais.

O agente deve usar uma skill quando a tarefa pedir uma execução passo a passo ou transformação de entrada em saída estruturada.

Exemplo:

```text
.agents/skills/break_prd_tdd_sdd_into_linear_issues.md
```

Usar esta skill sempre que a tarefa pedir para:

- quebrar PRD em tarefas;
- transformar TDD/SDD/SPEC em backlog;
- criar issues para Linear;
- organizar execução paralela por múltiplos agentes;
- gerar épicos, PBIs, tasks e subtasks.

---

## 6. Regras gerais de execução

O agente deve:

1. Ler a demanda antes de executar.
2. Identificar a frente responsável.
3. Verificar documentos relacionados.
4. Verificar regras e skills aplicáveis.
5. Não expandir escopo sem necessidade explícita.
6. Declarar dependências, riscos e bloqueios quando existirem.
7. Preservar rastreabilidade entre documento, issue, implementação, QA e docs.
8. Entregar saída objetiva, utilizável e compatível com o fluxo do projeto.

---

## 7. Regras para tarefas de implementação

Quando a tarefa envolver código, o agente deve:

- entender o comportamento esperado antes de alterar arquivos;
- preservar contratos existentes, salvo instrução contrária;
- evitar mudanças amplas e não relacionadas;
- atualizar ou criar testes quando aplicável;
- informar arquivos alterados;
- informar comandos de teste executados;
- registrar riscos ou pendências.

---

## 8. Regras para QA

Quando a tarefa envolver QA, o agente deve validar a entrega contra:

```text
PRD
TDD
SDD
SPEC
Critérios de aceite da issue
Regras em .agents/rules/
Comportamento real do sistema
```

O QA deve apontar:

- aprovado;
- aprovado com ressalvas;
- reprovado;
- evidências;
- riscos;
- ações recomendadas.

---

## 9. Regras para documentação

Quando a tarefa envolver documentação, o agente deve:

- manter consistência com o comportamento real do sistema;
- não documentar funcionalidades inexistentes;
- atualizar roteiros operacionais quando uma entrega mudar comandos, APIs, telas ou fluxos;
- escrever instruções executáveis por alguém que não conhece previamente os comandos.

---

## 10. Regra final

O agente deve favorecer entregas pequenas, rastreáveis e verificáveis.

Sempre que uma tarefa estiver grande demais, quebrar em partes menores seguindo:

```text
PRD -> TDD -> SDD -> Backend/API/Frontend/Infra/Security -> QA -> Docs
```

Para organização no Linear, seguir:

```text
.agents/rules/linear_issue_management.md
```

Para transformar documentos em backlog, seguir:

```text
.agents/skills/break_prd_tdd_sdd_into_linear_issues.md
```
