# ChinaCode CLI — Project

## Vision

Ser a ferramenta de referência global para desenvolvedores que desejam utilizar modelos de IA asiáticos em workflows profissionais de codificação, estabelecendo um novo padrão de qualidade para agentes de terminal open-source.

## Mission

Democratizar o acesso a agentes de codificação de alta qualidade através de uma ferramenta aberta, transparente e economicamente acessível, que respeite a autonomia do desenvolvedor e promova a diversidade no ecossistema de modelos de linguagem.

## Tagline

> *"O poder dos modelos chineses, no seu terminal, sob suas regras."*

## Core Value Proposition

Alternativa open-source ao Claude Code com suporte nativo a modelos chineses (Qwen, DeepSeek, MiMo), execução local, transparência total de custos e sem vendor lock-in.

## Guiding Principles

1. **Transparência Radical** — cada token, cada custo, cada decisão do agente é auditável
2. **Segurança Primeiro** — autonomia nunca compromete a integridade do ambiente do usuário
3. **Performance Consciente** — otimização para latência e custo sem sacrificar qualidade
4. **Extensibilidade como Padrão** — qualquer dev pode estender em minutos
5. **Respeito ao Usuário** — sem telemetria intrusiva, sem surpresas na fatura

## Key Differentiators

| Diferencial | Descrição |
|---|---|
| Soberania | Funciona com qualquer OpenAI-compatible ou localmente via Ollama/vLLM |
| Custo | 10-50x mais barato que Claude Code (pay-as-you-go, token-level tracking) |
| Modelos | Qwen, DeepSeek, MiMo + qualquer GGUF local |
| Segurança | Sandbox Docker obrigatório para execução autônoma |
| Personalização | Agent.md em Markdown + Skills + MCP |
| Código | Open-source MIT — 100% auditável |

## Tech Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript 5+ / ESM |
| API Client | `openai` SDK (OpenAI-compat) |
| Validation | Zod |
| UI/Terminal | readline + chalk + ora |
| Sandbox | Docker |
| Persistência | SQLite (better-sqlite3) |
| MCP | @modelcontextprotocol/sdk |

## Target Users

- **Thiago (primário):** Desenvolvedor sênior, 28-40 anos, valoriza privacidade e controle, cansado de pagar $100+/mês no Claude Max
- **Mei (secundário):** Pesquisadora de ML, quer comparar modelos e integrar com APIs asiáticas
- **Carlos (terciário):** Empreendedor bootstrapped com budget limitado

## Success Metrics (6 months)

- 1.000+ GitHub stars
- 10.000+ instalações npm
- Task completion rate > 80%
- Custo médio por tarefa < $0.03

## Repository

`github.com/seu-usuario/chinacode-cli` (a definir)

## Status

**Fase 1 Foundation** — em desenvolvimento ativo (Maio 2026)
