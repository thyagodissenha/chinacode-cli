# Subagentes

Subagentes são mini-loops ReAct isolados invocados pelo agente principal para executar tarefas específicas de forma autônoma. Eles operam com seu próprio histórico de mensagens, podem usar todas as ferramentas nativas e retornam o resultado final ao agente principal.

---

## O que é um subagente

Quando o agente principal precisa delegar uma tarefa especializada — por exemplo, gerar uma suíte de testes enquanto continua outra tarefa — ele invoca a ferramenta `delegate_task`. Isso instancia um subagente isolado que:

1. Recebe a tarefa e opcionalmente uma skill e um modelo específico
2. Executa um loop ReAct independente (máximo de 5 iterações)
3. Usa as mesmas ferramentas disponíveis para o agente principal
4. Retorna apenas o resultado final, sem output intermediário no TUI

O agente principal espera o resultado antes de continuar.

---

## A ferramenta `delegate_task`

O agente principal acessa subagentes exclusivamente via a ferramenta `delegate_task`. O usuário não precisa chamá-la diretamente — o agente decide quando usá-la.

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `task` | string | sim | Descrição clara e completa da tarefa a executar |
| `skill` | string | não | Nome da skill a aplicar (ex: `code-review`, `test-generation`) |
| `model` | string | não | Nome exato do modelo a usar; usa o modelo padrão se omitido |

### Exemplo de chamada (interno)

```json
{
  "task": "Gere testes unitários para todas as funções exportadas em src/utils/format.ts. Use vitest e cubra happy path e edge cases.",
  "skill": "test-generation",
  "model": "qwen-turbo"
}
```

### Saída

```
[Subagente concluído em 3 iteração(ões)]
<resultado da tarefa>
```

O agente principal recebe esta string e a usa para continuar o fluxo.

---

## Fluxo de execução

```
Usuário
  │
  ▼
Agente principal (loop ReAct)
  │
  ├── decide delegar uma subtarefa
  │
  ▼
delegate_task(task, skill?, model?)
  │
  ▼
Subagente isolado
  ├── iteração 1: raciocina, chama ferramenta
  ├── iteração 2: processa resultado, age
  ├── iteração 3: retorna resposta final
  │   (máximo: 5 iterações)
  │
  ▼
Resultado → agente principal
  │
  ▼
Agente continua com o resultado incorporado
```

---

## Configurar subagentes no AGENT.md

A seção `## Subagents` do `AGENT.md` define subagentes nomeados com modelo e skill associados. O agente principal consulta esta configuração ao decidir como delegar.

### Formato

```markdown
## Subagents

- name: <identificador>
  model: <nome-do-modelo>
  skill: <nome-da-skill>
```

### Exemplo

```markdown
## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation

- name: auditor
  model: qwen-max
  skill: security-audit

- name: reviewer
  model: qwen-plus
  skill: code-review
```

Com esta configuração:
- O agente principal sabe que tarefas de testes devem ser delegadas ao `tester` com `qwen-turbo`
- Auditorias de segurança usam `qwen-max` para maior capacidade analítica
- Reviews de código ficam com o modelo intermediário `qwen-plus`

> O nome em `model:` deve corresponder exatamente ao modelo configurado em `.env` ou ao nome aceito pelo provedor.

---

## Casos de uso

### Geração de testes em paralelo conceitual

```
❯ implemente a função parseConfig em src/config.ts e gere os testes
```

O agente principal pode implementar a função e delegar a geração de testes ao subagente `tester`, recebendo o resultado e apresentando tudo junto.

### Auditoria de segurança especializada

```
❯ audita o módulo de autenticação em src/auth/
```

O agente invoca o subagente `auditor` com a skill `security-audit` e modelo `qwen-max`, recebendo um relatório estruturado por severidade.

### Revisão de código antes de commit

```
❯ revise as mudanças em src/api/ antes de eu commitar
```

O agente delega a revisão ao subagente `reviewer`, que aplica o checklist da skill `code-review` e retorna feedback em Crítico | Importante | Sugestão.

---

## Snippet de AGENT.md com modelo rápido para subagentes

Para projetos onde velocidade importa mais que profundidade nos subagentes:

```markdown
## Identity

Você é um agente de desenvolvimento ágil. Delegue subtarefas repetitivas
a subagentes para executar em paralelo conceitual e manter o fluxo principal rápido.

## Rules

- Use subagentes para tarefas de geração de testes e revisão de código
- Nunca delegue decisões arquiteturais — essas ficam no agente principal
- Apresente resultados de subagentes sem reformatar desnecessariamente

## Subagents

- name: fast-worker
  model: qwen-turbo
  skill: test-generation

- name: reviewer
  model: qwen-turbo
  skill: code-review
```

---

## Limitações

| Limitação | Detalhe |
|-----------|---------|
| **Máximo de iterações** | 5 por subagente; se atingido, retorna mensagem de limite sem resultado |
| **Sem feedback no TUI** | O output intermediário do subagente não aparece na interface — apenas o resultado final |
| **Sem aprovação de diff** | Edições feitas pelo subagente são aplicadas diretamente, sem prompt `[Y/N/A]` |
| **Ferramentas compartilhadas** | O subagente usa o mesmo conjunto de ferramentas do agente principal |
| **Sem subagentes aninhados** | Um subagente não pode invocar outro `delegate_task` |
| **Custos não rastreados** | Tokens consumidos pelo subagente não aparecem em `/cost` |

> Por não haver aprovação de diff em subagentes, prefira delegá-los a tarefas de leitura/análise ou a escritas em arquivos de teste isolados. Para modificações em código de produção, mantenha a execução no agente principal.

---

## Próximos passos

- [Guia do AGENT.md](./agent-md.md) — configurar identidade, regras e subagentes
- [Guia de Skills](./skills.md) — criar skills para especializar subagentes
- [Referência de ferramentas](../reference/tools.md) — ferramentas disponíveis para agente e subagentes
