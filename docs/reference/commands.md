# Slash Commands

Todos os comandos começam com `/` e são executados diretamente no prompt do CLI, sem enviar mensagem ao modelo.

---

## Navegação e ajuda

### `/help` · `/h` · `/?`

Exibe a lista completa de comandos disponíveis.

```
❯ /help
```

---

## Sessão e histórico

### `/clear` · `/cls`

Limpa o histórico da conversa atual. O modelo não terá memória das mensagens anteriores.

```
❯ /clear
```

### `/sessions`

Lista as sessões anteriores salvas em `~/.chinacode/sessions.db`.

```
❯ /sessions
ID                    | Data       | Diretório            | Modelo       | Custo    | Msgs
──────────────────────────────────────────────────────────────────────────────────────────
1748123456789-a1b2c3  | 25/05/2026 | /meu/projeto         | qwen-plus    | $0.0042  | 12
```

### `/resume <id>`

Retoma uma sessão anterior, restaurando o histórico de mensagens.

```
❯ /resume 1748123456789-a1b2c3
Sessão restaurada: 12 mensagens, custo $0.0042 USD
```

---

## Custo e métricas

### `/cost` · `/c`

Exibe o custo acumulado e total de tokens da sessão atual.

```
❯ /cost
Custo da sessão: 0.004200 USD
Tokens: 1500 input + 800 output
```

### `/export`

Exporta o histórico de custo da sessão nos formatos JSON e CSV para o stdout.

```
❯ /export
=== JSON ===
[
  {
    "model": "qwen-plus",
    "inputTokens": 1500,
    ...
  }
]
=== CSV ===
model,inputTokens,outputTokens,...
```

---

## Modelo e sandbox

### `/model <nome>` · `/m <nome>`

Troca o modelo padrão da sessão atual. O nome deve ser válido para o provedor configurado.

```
❯ /model qwen-max
Modelo alterado para: qwen-max
```

```
❯ /model deepseek-chat
Modelo alterado para: deepseek-chat
```

### `/sandbox <on|off>` · `/sb <on|off>`

Liga ou desliga o isolamento via Docker para comandos bash.

```
❯ /sandbox off
Sandbox Docker: desabilitado

❯ /sandbox on
Sandbox Docker: habilitado
```

> Com sandbox **off**, comandos bash rodam diretamente no host sem limite de rede ou memória.

---

## Contexto

### `/compact`

Sumariza o histórico longo para reduzir o uso de tokens. *(Disponível na Fase 2)*

```
❯ /compact
⚠ /compact será implementado na Fase 2 (Intelligence).
```

---

## Saída

### `/exit` · `/q` · `/quit`

Encerra o CLI imediatamente.

```
❯ /exit
```

> Atalho alternativo: pressione **Ctrl+C** duas vezes em menos de 800ms.

---

## Aprovação de escrita (inline, não são comandos)

Quando o agente propõe criar ou editar um arquivo, o prompt de aprovação aparece automaticamente:

```
Aprovar? [Y]es / [N]o / [A]lways:
```

| Tecla | Ação |
|-------|------|
| `Y` ou Enter | Aprova esta edição |
| `N` | Rejeita — o agente pode tentar outra abordagem |
| `A` | Aprova esta e todas as edições seguintes (`AUTO_APPROVE=true` temporário) |
