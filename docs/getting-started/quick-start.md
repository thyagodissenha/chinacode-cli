# Quick Start

Este guia leva você do zero até uma sessão funcional em menos de 5 minutos.

---

## 1. Configure sua API key

```bash
# Crie o .env no diretório do seu projeto
echo 'OPENAI_API_KEY=sua-chave-aqui' > .env
echo 'OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1' >> .env
echo 'DEFAULT_MODEL=qwen-plus' >> .env
```

---

## 2. Inicie o ChinaCode

```bash
# No diretório do seu projeto
chinacode
```

Você verá o cabeçalho:

```
────────────────────────────────────────────────────────────
  ChinaCode CLI v0.1.0 | modelo: qwen-plus | sandbox: on
────────────────────────────────────────────────────────────
❯
```

---

## 3. Faça sua primeira pergunta

```
❯ liste os arquivos TypeScript neste projeto
```

O agente vai usar a ferramenta `glob_search` para encontrar os arquivos e exibir o resultado.

---

## 4. Peça uma modificação de código

```
❯ adicione uma função soma(a, b) no arquivo src/utils.ts
```

Quando o agente propuser escrever o arquivo, você verá um diff e poderá aprovar:

```
📝 src/utils.ts
+ export function soma(a: number, b: number): number {
+   return a + b
+ }

Aprovar? [Y]es / [N]o / [A]lways:
```

- **Y** — aprova esta edição
- **N** — rejeita e o agente tenta outra abordagem
- **A** — aprova esta e todas as edições seguintes da sessão

---

## 5. Comandos úteis na sessão

| Comando | O que faz |
|---------|-----------|
| `/help` | Lista todos os comandos disponíveis |
| `/cost` | Mostra tokens e custo acumulados |
| `/clear` | Limpa o histórico da conversa |
| `/exit` | Encerra o CLI |

> Consulte [commands.md](../reference/commands.md) para a lista completa.

---

## 6. Encerrando a sessão

```
❯ /exit
```

Ou pressione **Ctrl+C** duas vezes em menos de 800ms.

A sessão é salva automaticamente em `~/.chinacode/sessions.db` e pode ser retomada com `/resume <id>`.

---

## Próximos passos

- [Referência de slash commands](../reference/commands.md)
- [Ferramentas nativas](../reference/tools.md)
- [Configuração completa](../reference/config.md)
- [Erros comuns e soluções](../reference/errors.md)
