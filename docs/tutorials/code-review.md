# Tutorial: Revisao de Codigo com ChinaCode

Este tutorial mostra como usar o ChinaCode CLI para revisar mudancas locais antes de abrir ou atualizar um pull request.

## Objetivo

Ao final, voce tera um fluxo repetivel para:

- carregar o contexto do repositorio;
- pedir uma revisao focada em bugs, seguranca e testes;
- aplicar uma skill de code review;
- validar a resposta com comandos locais.

## Pre-requisitos

- Node.js 20 ou superior.
- Dependencias instaladas com `npm install`.
- Um arquivo `.env` no workspace com `OPENAI_API_KEY`, `OPENAI_BASE_URL` e `DEFAULT_MODEL`.
- Opcional: `REASONING_MODEL` configurado para revisoes mais profundas.

Exemplo minimo:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
REASONING_MODEL=qwen-max
FAST_MODEL=qwen-turbo
```

## 1. Abra o CLI no projeto

```bash
chinacode
```

Durante a sessao, use `/help` para confirmar comandos e skills carregadas. O projeto inclui uma skill pronta em `skills/code-review.md`.

## 2. Peca um resumo das mudancas

Comece com uma pergunta de leitura para o agente montar contexto antes da revisao:

```text
> resuma as mudancas git atuais e identifique os arquivos que merecem review
```

O agente pode usar ferramentas de busca, leitura de arquivos e contexto git para localizar os pontos relevantes.

## 3. Rode a revisao com a skill

Peca uma revisao explicita:

```text
> faca um code review das mudancas atuais. Priorize bugs, regressoes, seguranca e testes ausentes.
```

A skill `code-review` orienta o agente a verificar:

- type safety e uso de TypeScript;
- code smells, duplicacao e magic numbers;
- tratamento de erros e edge cases;
- performance;
- seguranca;
- cobertura de testes.

O formato esperado separa achados em `Critico`, `Importante` e `Sugestao`.

## 4. Peca correcoes pequenas

Quando o review apontar problemas concretos, trabalhe em uma correcao por vez:

```text
> corrija o problema importante sobre tratamento de erro em src/config.ts e adicione teste
```

O ChinaCode mostra diff e pede aprovacao antes de escrever arquivos, exceto quando `AUTO_APPROVE=true`.

## 5. Valide localmente

Depois das correcoes, rode os comandos do projeto:

```bash
npm run typecheck
npm run test:run
```

Use `/cost` para acompanhar tokens e custo da sessao:

```text
> /cost
```

## 6. Compacte contexto em revisoes longas

Se a conversa ficar extensa:

```text
> /compact
```

O comando sumariza o historico usando o modelo rapido quando configurado.

## Prompt pronto

```text
Revise as mudancas git atuais como code reviewer senior.
Priorize achados que possam causar bug, regressao, falha de seguranca ou teste insuficiente.
Para cada achado, cite arquivo, comportamento observado, impacto e correcao recomendada.
Se nao houver achados, diga isso explicitamente e indique qualquer risco residual.
```

## Boas praticas

- Peca revisao antes de grandes refactors, nao apenas no fim.
- Prefira prompts com escopo de arquivos ou modulo.
- Execute os testes sugeridos antes de declarar a revisao concluida.
- Use `REASONING_MODEL` para revisoes complexas e `FAST_MODEL` para leitura/listagem.
