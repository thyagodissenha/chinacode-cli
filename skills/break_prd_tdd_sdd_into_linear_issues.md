# Skill: Break PRD/TDD/SDD Into Linear Issues

## 1. Objetivo

Transformar documentos de planejamento e especificação em uma estrutura pronta para o Linear, com épicos, PBIs e issues pequenas o suficiente para execução paralela por múltiplos agentes.

Esta skill deve ser usada quando o usuário pedir para:

- quebrar um PRD em tarefas;
- transformar PRD/TDD/SDD em backlog;
- criar issues para o Linear;
- organizar trabalho para múltiplos agentes;
- criar épicos, PBIs, tasks e subtasks;
- preparar execução paralela de backend, frontend, QA, docs, infra ou segurança.

---

## 2. Entradas esperadas

A skill pode receber um ou mais dos seguintes documentos:

```text
PRD
TDD
SDD
Roadmap
SPEC
Backlog bruto
Notas de reunião
Descrição textual de uma feature
```

Quando houver mais de um documento, usar esta prioridade:

```text
1. PRD: define objetivo, escopo e regras de negócio
2. TDD: define arquitetura, decisões técnicas e componentes
3. SDD/SPEC: define comportamento, contratos e critérios de aceite
4. Roadmap: define sequência, milestone e prioridade
5. Notas/backlog bruto: complementa contexto, mas não sobrescreve documentos canônicos
```

---

## 3. Saída esperada

A saída deve ser organizada em formato compatível com Linear.

Gerar:

```text
1. Épicos/PBIs pais
2. Issues filhas por frente
3. Dependências entre issues
4. Labels recomendadas
5. Critérios de aceite
6. Ordem sugerida de execução
7. Mapa de paralelismo por agente
8. Riscos e bloqueios
```

---

## 4. Regras de nomenclatura

Usar uma key única por produto/projeto.

Exemplo:

```text
ARC-101 - [Backend] Implementar endpoint de criação de mundo
```

Não separar a key por frente, exceto se existirem times Linear realmente independentes.

Evitar:

```text
BACK-101
FRONT-102
QA-103
```

Usar o padrão:

```text
[Frente] Verbo + objeto + contexto
```

Frentes aceitas:

```text
[Planning]
[PRD]
[TDD]
[SDD]
[Backend]
[API]
[Frontend]
[QA]
[Docs]
[Infra]
[Security]
[Integration]
[Refactor]
[Research]
```

---

## 5. Processo de execução da skill

### Passo 1 — Identificar entregas principais

Ler o material de entrada e identificar entregas independentes.

Cada entrega grande deve virar um épico ou PBI pai.

Exemplo:

```text
ARC-100 - [Epic] Importação mensal de folha
ARC-200 - [Epic] Auditoria administrativa
ARC-300 - [Epic] Segurança de autenticação
```

---

### Passo 2 — Separar por fluxo funcional

Para cada épico, identificar fluxos funcionais.

Exemplo:

```text
Epic:
ARC-100 - [Epic] Importação mensal de folha

Fluxos:
- upload da planilha;
- validação completa antes de persistir;
- persistência mensal;
- vínculo com centro de custo do mês;
- relatório de erros;
- rollback total em caso de falha.
```

---

### Passo 3 — Quebrar por frente de trabalho

Cada fluxo deve ser quebrado por frente.

Exemplo:

```text
ARC-101 - [PRD] Definir regras da importação mensal
ARC-102 - [TDD] Definir modelo de dados da importação
ARC-103 - [SDD] Especificar validação atômica da importação
ARC-104 - [Backend] Implementar entidade de centro de custo mensal
ARC-105 - [Backend] Implementar validação completa antes da persistência
ARC-106 - [API] Criar endpoint de upload da folha
ARC-107 - [Frontend] Criar tela de upload da folha
ARC-108 - [QA] Validar rollback total em caso de erro
ARC-109 - [Docs] Documentar roteiro operacional
```

---

### Passo 4 — Definir dependências

Toda issue deve declarar dependências quando necessário.

Exemplo:

```text
ARC-106 - [API] Criar endpoint de upload da folha
Depende de:
- ARC-102 - [TDD] Definir modelo de dados da importação
- ARC-103 - [SDD] Especificar validação atômica da importação
- ARC-105 - [Backend] Implementar validação completa antes da persistência
```

Regras:

- Frontend depende de API/contrato.
- QA depende de SDD/SPEC e implementação mínima.
- Docs depende do comportamento final validado.
- Backend pode depender de TDD ou SDD.
- Security pode bloquear Backend, API ou Frontend.
- Infra pode bloquear execução local, deploy ou testes.

---

### Passo 5 — Definir labels

Cada issue deve receber labels por frente, tipo e agente.

Exemplo:

```text
ARC-105 - [Backend] Implementar validação completa antes da persistência

Labels:
backend
feature
agent:backend
```

Exemplo QA:

```text
ARC-108 - [QA] Validar rollback total em caso de erro

Labels:
qa
test
agent:qa
```

---

### Passo 6 — Definir critérios de aceite

Cada issue deve ter critérios objetivos.

Exemplo:

```md
## Critérios de aceite

- [ ] O endpoint rejeita arquivo inválido sem persistir dados.
- [ ] Todos os erros encontrados são retornados em uma única resposta.
- [ ] Nenhum dado parcial é salvo quando houver erro.
- [ ] O retorno informa linha, coluna, campo e motivo do erro.
- [ ] O comportamento está coberto por teste automatizado ou roteiro manual.
```

Critérios ruins:

```text
- Funcionar corretamente.
- Fazer a tela.
- Melhorar o backend.
```

Critérios bons:

```text
- O usuário Admin consegue visualizar auditoria filtrada por período.
- Usuários não Admin recebem 403 ao acessar a auditoria.
- O sistema registra usuário, data, operação e entidade afetada.
```

---

## 6. Template de issue Linear

Usar este modelo para cada issue:

```md
# [Frente] Verbo + objeto + contexto

## Objetivo

Descrever o objetivo da issue.

## Contexto

Explicar por que esta issue existe e qual documento originou a demanda.

## Escopo

- Item dentro do escopo
- Item dentro do escopo
- Item dentro do escopo

## Fora de escopo

- Item que não deve ser resolvido nesta issue

## Dependências

- ARC-XXX
- Documento PRD/TDD/SDD relacionado

## Critérios de aceite

- [ ] Critério objetivo
- [ ] Critério objetivo
- [ ] Critério objetivo

## Frente responsável

[Backend]

## Agente responsável

agent:backend

## Labels

backend, feature, agent:backend

## Evidências esperadas

- Arquivos alterados
- Testes executados
- Logs relevantes
- Payloads de exemplo, se aplicável
- Screenshots, se aplicável

## Observações

- Riscos
- Decisões relevantes
- Pontos de atenção
```

---

## 7. Template de épico/PBI pai

Usar este modelo para entregas grandes:

```md
# [Epic] Nome da entrega

## Objetivo

Descrever a entrega de forma clara.

## Problema que resolve

Explicar qual dor, necessidade ou capacidade será entregue.

## Escopo funcional

- Capacidade 1
- Capacidade 2
- Capacidade 3

## Fora de escopo

- Item não incluído nesta entrega

## Documentos relacionados

- PRD:
- TDD:
- SDD:
- Roadmap:
- SPEC:

## Issues filhas

- ARC-101 - [PRD] ...
- ARC-102 - [TDD] ...
- ARC-103 - [Backend] ...
- ARC-104 - [API] ...
- ARC-105 - [Frontend] ...
- ARC-106 - [QA] ...
- ARC-107 - [Docs] ...

## Dependências gerais

- Dependência 1
- Dependência 2

## Critérios gerais de aceite

- [ ] Critério geral da entrega
- [ ] Critério geral da entrega
- [ ] Critério geral da entrega

## Riscos

- Risco 1
- Risco 2

## Ordem sugerida

1. Planning/PRD
2. TDD
3. SDD
4. Backend/API/Infra/Security
5. Frontend
6. QA
7. Docs
```

---

## 8. Mapa de paralelismo

Ao final da quebra, gerar um mapa de execução paralela.

Exemplo:

```md
## Mapa de paralelismo

### Pode iniciar imediatamente

- ARC-101 - [PRD] Definir regras da importação mensal
- ARC-102 - [TDD] Definir arquitetura inicial
- ARC-120 - [Research] Avaliar biblioteca de parsing de planilha

### Depende de PRD/TDD/SDD

- ARC-104 - [Backend] Implementar entidades
- ARC-105 - [Backend] Implementar validações
- ARC-106 - [API] Criar endpoint

### Depende de API/contrato

- ARC-107 - [Frontend] Criar tela de upload

### Depende de implementação

- ARC-108 - [QA] Validar importação ponta a ponta
- ARC-109 - [Docs] Documentar roteiro operacional
```

---

## 9. Validação antes de finalizar

Antes de entregar as issues, verificar:

```text
- Existe pelo menos um épico/PBI pai para entregas grandes?
- Cada issue tem uma frente principal?
- Issues grandes foram quebradas?
- Frontend não começa sem contrato/API definido?
- QA possui critérios validáveis?
- Docs aparece no final da entrega?
- Dependências foram declaradas?
- Labels foram sugeridas?
- A sequência permite paralelismo seguro?
- Não existem issues genéricas demais?
```

---

## 10. Formato final recomendado

A resposta final da skill deve seguir este formato:

```md
# Linear Backlog Pack

## 1. Visão geral

Resumo da entrega e documentos usados.

## 2. Épicos/PBIs

Lista dos épicos/PBIs pais.

## 3. Issues por épico

Issues filhas, agrupadas por épico.

## 4. Dependências

Tabela ou lista com dependências entre issues.

## 5. Mapa de paralelismo

Separação por grupos que podem trabalhar em paralelo.

## 6. Labels recomendadas

Lista de labels usadas.

## 7. Riscos e bloqueios

Pontos que podem impedir execução.

## 8. Checklist de prontidão

Checklist final para iniciar execução multiagente.
```

---

## 11. Regra final da skill

A skill não deve apenas listar tarefas.

Ela deve transformar documentos em um backlog executável, rastreável e seguro para múltiplos agentes.

Cada issue deve responder claramente:

```text
Quem executa?
O que deve ser feito?
Por que existe?
De quais documentos depende?
Quais são os critérios de aceite?
O que está fora do escopo?
Quais evidências devem ser entregues?
```
