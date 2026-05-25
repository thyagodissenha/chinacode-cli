# Roteiro de Demo: ChinaCode CLI

Este roteiro textual pode ser usado para gravar um GIF curto ou video de lancamento.

## Cenario

Mostrar o ChinaCode ajudando em uma tarefa real de manutencao: entender o projeto, revisar mudancas, criar uma skill customizada e validar com testes.

Duracao sugerida: 2 a 4 minutos.

## Preparacao

No terminal:

```bash
cd chinacode-cli
npm install
npm run build
```

Configure `.env`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
REASONING_MODEL=qwen-max
FAST_MODEL=qwen-turbo
SANDBOX_ENABLED=true
```

## Cena 1: Inicio

Narracao:

```text
Vamos iniciar o ChinaCode no workspace. Ele carrega AGENT.md, skills, plugins locais, configuracao de modelos e ferramentas nativas.
```

Comando:

```bash
chinacode
```

Digite:

```text
> /help
```

Mostrar:

- slash commands;
- skills carregadas de `./skills`;
- prompt pronto para receber tarefa.

## Cena 2: Descoberta do projeto

Digite:

```text
> explique a arquitetura deste repositorio em 5 pontos e cite os diretorios principais
```

Narracao:

```text
Antes de editar, o agente le o projeto e resume onde ficam CLI, ferramentas, modelos, storage, skills e documentacao.
```

## Cena 3: Code review

Digite:

```text
> faca um code review das mudancas git atuais. Priorize bugs, seguranca, regressoes e testes ausentes.
```

Narracao:

```text
A skill code-review orienta a revisao. O resultado vem em achados priorizados, com arquivo, impacto e recomendacao.
```

Mostrar rapidamente:

- achados por severidade;
- sugestao de teste ou correcao;
- comando `/cost`.

## Cena 4: Skill customizada

Crie uma skill durante a demo:

```text
> crie uma skill chamada release-notes para gerar notas de release a partir de mudancas git, com checklist e formato de saida
```

Se aparecer diff, aprove.

Digite:

```text
> /clear
```

Depois:

```text
> /help
```

Narracao:

```text
Skills sao arquivos Markdown no workspace. Depois de recarregar a sessao, a nova skill fica disponivel ao agente.
```

## Cena 5: Validacao

Digite:

```text
> rode a validacao relevante para este repo e me diga se a documentacao esta consistente
```

Ou rode diretamente no terminal:

```bash
npm run typecheck
npm run test:run
```

Narracao:

```text
O fluxo termina com validacao objetiva: comandos executados, arquivos alterados e riscos restantes.
```

## Encerramento

Mensagem final sugerida:

```text
ChinaCode combina contexto local, skills Markdown, subagentes, sandbox Docker, MCP opcional e rastreamento de custo em uma CLI de desenvolvimento.
```

## Checklist visual para o video

- Terminal em fonte legivel.
- Mostrar `chinacode` iniciando.
- Mostrar `/help`.
- Mostrar uma resposta com arquivos reais do repo.
- Mostrar um diff aprovado.
- Mostrar `npm run test:run` ou `npm run typecheck`.
- Encerrar com resumo de arquivos alterados e validacoes.
