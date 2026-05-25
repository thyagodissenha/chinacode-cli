# Primeiro projeto

Este guia cria um projeto TypeScript minimo e usa o ChinaCode CLI para ler, editar e validar codigo com aprovacao interativa.

## 1. Criar o projeto

```bash
mkdir chinacode-demo
cd chinacode-demo
npm init -y
npm install -D typescript vitest @types/node
mkdir -p src skills
```

Crie uma configuracao TypeScript simples:

```bash
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node", "vitest"]
  },
  "include": ["src/**/*.ts"]
}
EOF
```

Adicione scripts ao `package.json`:

```bash
npm pkg set scripts.test="vitest run"
npm pkg set scripts.typecheck="tsc --noEmit"
```

## 2. Configurar o ChinaCode

Crie `.env` na raiz do projeto:

```bash
cat > .env <<'EOF'
OPENAI_API_KEY=sk-sua-chave
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
FAST_MODEL=qwen-turbo
REASONING_MODEL=qwen-plus
SANDBOX_ENABLED=true
AUTO_APPROVE=false
MAX_ITERATIONS=15
EOF
```

Se nao usa Docker, defina `SANDBOX_ENABLED=false`.

Crie `AGENT.md`:

```bash
cat > AGENT.md <<'EOF'
# ChinaCode Demo

## Identity

Voce e um agente TypeScript focado em mudancas pequenas, testaveis e verificaveis.

## Rules

- Leia arquivos antes de edita-los
- Use Vitest para testes
- Rode ou sugira `npm run typecheck` e `npm test` depois de alterar codigo
- Cite arquivos modificados no final

## Skills

- test-generation

## Subagents

- name: tester
  model: qwen-turbo
  skill: test-generation
EOF
```

Crie a skill usada pelo subagente:

```bash
cat > skills/test-generation.md <<'EOF'
# Test Generation

## Quando usar
Quando a tarefa envolver criar ou atualizar testes automatizados.

## Checklist
- Criar testes Vitest para comportamento publico
- Cobrir pelo menos um caso feliz e um caso de borda
- Manter nomes de teste descritivos

## Formato de saida
Informe arquivos alterados e comandos executados.
EOF
```

## 3. Iniciar o agente

Com instalacao global:

```bash
chinacode
```

Durante desenvolvimento do CLI, a partir do repositorio `chinacode-cli`, tambem e possivel executar com `WORKSPACE_DIR` apontando para este projeto:

```bash
WORKSPACE_DIR=/caminho/absoluto/para/chinacode-demo npm run dev
```

Nesse caso, mantenha o `.env` no diretorio onde `npm run dev` e executado ou exporte as variaveis do provedor no shell. O `AGENT.md`, `skills/` e os arquivos editados ficam no projeto indicado por `WORKSPACE_DIR`.

## 4. Primeira tarefa

No prompt do CLI:

```text
❯ crie src/calculator.ts com funcoes add e divide. Depois gere testes com o subagente tester e valide com npm test.
```

O fluxo esperado:

1. O agente le a estrutura do workspace.
2. O agente cria ou edita arquivos usando `write_file` ou `edit_file`.
3. O CLI mostra diff e pede aprovacao porque `AUTO_APPROVE=false`.
4. O agente pode chamar `delegate_task` para gerar testes com a skill `test-generation`.
5. O agente roda `npm test` via ferramenta `bash`, respeitando a configuracao de sandbox.

Se o sandbox Docker bloquear acesso a dependencias ou comandos locais, rode dentro da sessao:

```text
❯ /sandbox off
```

Depois repita a validacao:

```text
❯ rode npm test e npm run typecheck
```

## 5. Acompanhar custo e sessoes

Durante a sessao:

```text
❯ /cost
❯ /sessions
```

Para retomar depois:

```text
❯ /resume <id-da-sessao>
```

## 6. Finalizar

```text
❯ /exit
```

Use os guias de [skills](../guides/skills.md), [subagentes](../guides/subagents.md) e [AGENT.md](../guides/agent-md.md) para evoluir a configuracao do projeto.
