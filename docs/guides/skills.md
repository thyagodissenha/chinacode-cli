# Skills

Skills são arquivos Markdown que ensinam ao agente como executar categorias específicas de tarefas. Quando o agente detecta que a solicitação do usuário corresponde a uma skill carregada, ele aplica automaticamente o checklist e o formato de saída definidos nela.

---

## Como o agente usa skills

1. Na inicialização, o agente lê todos os arquivos `./skills/*.md` do workspace
2. Para cada arquivo, extrai o nome (sem `.md`) e a descrição da seção `## Quando usar`
3. As skills disponíveis são injetadas no system prompt
4. Quando o usuário envia uma mensagem, o agente avalia qual skill se aplica e segue seu checklist

Skills não são comandos explícitos — o agente as aplica por julgamento contextual com base na intenção da solicitação.

---

## Formato do arquivo de skill

Cada skill é um arquivo Markdown em `./skills/<nome>.md`. A estrutura recomendada:

```markdown
# Nome da Skill

## Quando usar
Descrição de quando esta skill deve ser aplicada (usada como descrição curta pelo agente).

## Checklist
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Formato de saída
Instruções sobre como estruturar a resposta.
```

**Regras do formato:**
- O nome do arquivo (sem `.md`) é o identificador da skill
- A seção `## Quando usar` é usada pelo loader para extrair a descrição curta
- O conteúdo completo do arquivo é injetado no contexto do agente quando a skill é ativada
- Seções adicionais (exemplos, padrões, restrições) são livres

---

## Como listar as skills disponíveis

Use o comando `/help` na sessão para ver as skills carregadas:

```
❯ /help
```

O output inclui as skills detectadas em `./skills/`:

```
Skills disponíveis (./skills/):
  • code-review       — revisão de código, análise de PR
  • test-generation   — criação de testes, specs, cobertura
  • security-audit    — auditoria de segurança, vulnerabilidades
```

---

## Skills built-in

O ChinaCode inclui três skills de exemplo prontas para uso.

### `code-review`

Arquivo: `skills/code-review.md`

```markdown
# Code Review

## Quando usar
Quando o usuário pedir revisão de código, análise de PR, ou "review".

## Checklist
- [ ] Verificar type safety e uso correto de TypeScript
- [ ] Identificar code smells: funções muito longas, duplicação, magic numbers
- [ ] Checar tratamento de erros e edge cases
- [ ] Avaliar performance: loops desnecessários, N+1, falta de cache
- [ ] Verificar segurança: injection, XSS, secrets expostos
- [ ] Confirmar testes adequados para o código revisado

## Formato de saída
Estruture o feedback em: Crítico | Importante | Sugestão
```

**Ativada por**: "revise este código", "faz um review do PR", "analisa esse arquivo"

---

### `test-generation`

Arquivo: `skills/test-generation.md`

```markdown
# Test Generation

## Quando usar
Quando o usuário pedir para criar testes, escrever specs, ou "adicionar cobertura".

## Checklist
- [ ] Cobrir o happy path com assertions claras
- [ ] Testar edge cases: null, undefined, array vazio, strings vazias
- [ ] Testar casos de erro e exceções esperadas
- [ ] Usar nomes descritivos: "should X when Y"
- [ ] Evitar mocks desnecessários — testar comportamento real quando possível
- [ ] Verificar que cada teste é independente (sem estado compartilhado)

## Padrão
Use vitest. Agrupe com describe(), use beforeEach para setup.
```

**Ativada por**: "cria testes para essa função", "adiciona cobertura ao módulo X", "escreve specs"

---

### `security-audit`

Arquivo: `skills/security-audit.md`

```markdown
# Security Audit

## Quando usar
Quando o usuário pedir auditoria de segurança, verificação de vulnerabilidades, ou "security review".

## Checklist
- [ ] Verificar inputs não sanitizados (SQL injection, command injection, XSS)
- [ ] Checar secrets hardcoded ou expostos em logs
- [ ] Avaliar autenticação e autorização em cada endpoint
- [ ] Verificar dependências com vulnerabilidades conhecidas (npm audit)
- [ ] Checar CORS, headers de segurança, rate limiting
- [ ] Validar que dados sensíveis não são logados

## Saída
Liste vulnerabilidades por severidade: Critical | High | Medium | Low
```

**Ativada por**: "audita a segurança", "verifica vulnerabilidades", "faz um security review"

---

## Como criar uma skill personalizada

### Passo 1 — Crie o arquivo

```bash
mkdir -p skills
touch skills/minha-skill.md
```

### Passo 2 — Escreva o conteúdo

```markdown
# Database Migration

## Quando usar
Quando o usuário pedir para criar, revisar ou executar migrations de banco de dados.

## Checklist
- [ ] Verificar se a migration tem rollback (`down`) implementado
- [ ] Confirmar que índices necessários estão criados
- [ ] Checar se colunas `NOT NULL` têm valor default para dados existentes
- [ ] Validar que a migration é idempotente quando possível
- [ ] Confirmar que o arquivo segue a convenção de nome: `YYYYMMDD_descricao.ts`

## Formato de saída
Liste as operações em ordem de execução. Destaque operações destrutivas com ⚠.
```

### Passo 3 — Ative na sessão

A skill é carregada automaticamente na próxima sessão. Para usar na sessão atual, execute `/clear` para recarregar o contexto.

### Passo 4 — Referencie no AGENT.md (opcional)

Para garantir que a skill esteja sempre ativa neste workspace, adicione ao `AGENT.md`:

```markdown
## Skills

- minha-skill
- code-review
- test-generation
```

---

## Como referenciar uma skill no AGENT.md

Na seção `## Skills` do `AGENT.md`, liste os nomes das skills (sem extensão `.md`) que devem estar ativas por padrão:

```markdown
## Skills

- code-review
- test-generation
- database-migration
```

O agente inclui as skills listadas no system prompt e as prioriza ao avaliar qual aplicar para cada tarefa.

> Skills listadas em `AGENT.md` mas cujo arquivo não existe em `./skills/` são ignoradas silenciosamente.

---

## Próximos passos

- [Guia do AGENT.md](./agent-md.md) — como configurar persona, regras e skills padrão
- [Guia de Subagentes](./subagents.md) — como delegar tarefas usando skills em subagentes isolados
- [Referência de ferramentas](../reference/tools.md) — ferramentas nativas disponíveis para o agente
