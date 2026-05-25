# AGENT.md

O arquivo `AGENT.md` permite personalizar o comportamento do ChinaCode CLI para cada workspace. Ele redefine a persona do agente, estabelece regras obrigatórias, ativa skills por padrão e configura subagentes especializados.

---

## O que é e onde colocar

Crie um arquivo chamado `AGENT.md` na raiz do seu projeto (mesmo diretório onde você executa `chinacode`):

```
meu-projeto/
├── AGENT.md          ← aqui
├── src/
├── package.json
└── .env
```

O arquivo é lido automaticamente na inicialização de cada sessão. Se ele não existir, o agente usa comportamento padrão sem erros.

---

## Seções disponíveis

O `AGENT.md` é um arquivo Markdown estruturado em seções com headings `##`. O parser reconhece quatro seções pelo nome (case-insensitive).

### `## Identity`

Redefine a persona do agente: nome, papel, tom de comunicação e estilo de resposta. O conteúdo desta seção substitui completamente o sistema de identidade padrão.

```markdown
## Identity

Você é Kira, uma engenheira sênior de backend especializada em Node.js e TypeScript.
Seu estilo é direto, técnico e sem rodeios. Prefira exemplos de código a explicações longas.
Sempre mencione arquivos afetados e justifique decisões de arquitetura.
```

### `## Rules`

Lista de regras comportamentais que o agente segue durante toda a sessão. Use uma linha por regra com prefixo `- ` ou `* `.

```markdown
## Rules

- Nunca modifique arquivos fora de `src/` sem confirmação explícita
- Sempre execute `npm test` após qualquer modificação de código
- Prefira edições cirúrgicas a reescritas completas de arquivos
- Documente funções públicas com JSDoc
- Não use `console.log` — use o logger interno em `src/utils/logger.ts`
```

### `## Skills`

Lista de skills (por nome de arquivo, sem extensão `.md`) que devem estar ativas por padrão nesta sessão. O agente aplica automaticamente a skill quando detectar uma tarefa compatível.

```markdown
## Skills

- code-review
- test-generation
- security-audit
```

> As skills listadas aqui precisam existir como arquivos em `./skills/<nome>.md`. Consulte [skills.md](./skills.md) para detalhes.

### `## Subagents`

Configura subagentes especializados com modelo e skill associados. Use blocos `- name: / model: / skill:` para cada subagente.

```markdown
## Subagents

- name: qa-agent
  model: qwen-turbo
  skill: test-generation

- name: security-agent
  model: qwen-max
  skill: security-audit
```

> Consulte [subagents.md](./subagents.md) para entender como o agente principal delega tarefas a subagentes.

---

## Exemplo completo de AGENT.md

```markdown
# Meu Projeto — Configuração do Agente

## Identity

Você é Dev, um engenheiro full-stack especializado no stack deste projeto:
Node.js 20, TypeScript 5, React 18 e PostgreSQL 16.

Seu comportamento:
- Respostas concisas e orientadas a código
- Sempre cite os arquivos que serão modificados antes de agir
- Use TypeScript estrito — sem `any` implícito
- Prefira funções puras e imutabilidade quando possível
- Agrupe imports por: built-ins → externos → internos

## Rules

- Nunca altere arquivos em `migrations/` sem aprovação explícita
- Sempre valide com `npm run lint` antes de declarar tarefa concluída
- Não adicione dependências sem perguntar primeiro
- Mantenha cobertura de testes acima de 80%
- Logs de debug devem usar o módulo `src/lib/logger.ts`, nunca `console.*`
- Em Pull Requests, atualize o `CHANGELOG.md` com a mudança
- Siga o padrão de commits: `feat:`, `fix:`, `chore:`, `docs:`

## Skills

- code-review
- test-generation
- security-audit

## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation

- name: auditor
  model: qwen-max
  skill: security-audit
```

---

## Comportamento quando AGENT.md está ausente

Se o arquivo `AGENT.md` não existir no diretório de trabalho, o ChinaCode inicia normalmente com:

- **Identity padrão**: `"Você é ChinaCode CLI, um agente de codificação autônomo."`
- **Sem regras extras**: nenhuma restrição adicional além das internas
- **Skills**: todas carregadas de `./skills/`, mas nenhuma pré-ativada por nome
- **Subagentes**: nenhum configurado (delegação ainda funciona sem configuração explícita)

Não há erro, aviso ou mensagem de falha — o arquivo é simplesmente opcional.

---

## Como recarregar o AGENT.md sem reiniciar

O `AGENT.md` é lido uma vez na inicialização da sessão. Para recarregar após editar o arquivo:

```
❯ /clear
```

O comando `/clear` limpa o histórico da conversa e reinicia o loop interno. Na próxima mensagem enviada, o agente lerá o `AGENT.md` atualizado e reconstruirá o system prompt.

> **Nota**: `/clear` descarta o histórico da sessão atual. Sessões anteriores continuam acessíveis via `/sessions` e `/resume`.

---

## Próximos passos

- [Guia de Skills](./skills.md) — como criar e usar skills personalizadas
- [Guia de Subagentes](./subagents.md) — como delegar tarefas a subagentes especializados
- [Referência de comandos](../reference/commands.md) — todos os slash commands disponíveis
