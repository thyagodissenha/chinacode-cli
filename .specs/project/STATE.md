# ChinaCode CLI — State

## Decisions

| ID | Decisão | Motivo | Data |
|---|---|---|---|
| ADR-001 | readline+chalk ao invés de Ink/React | Maior estabilidade, menos bugs de renderização, menor bundle | Mai 2026 |
| ADR-002 | Docker como sandbox padrão | Isolamento real de kernel; fallback local com warning quando indisponível | Mai 2026 |
| ADR-003 | SQLite para persistência | Zero-config, embutido, query SQL nativa; não escala multi-user (irrelevante para CLI) | Mai 2026 |
| ADR-004 | MCP como padrão de extensão | Padrão aberto, crescente adoção, vendor-neutral | Mai 2026 |
| ADR-005 | openai SDK para todas APIs | Compatível com todas APIs chinesas via OpenAI-compat endpoint | Mai 2026 |

## Integrations

| Serviço | Detalhes |
|---|---|
| **Linear** | Workspace: `ia-development` · Projeto: [ChinaCode CLI](https://linear.app/ia-development/project/chinacode-cli-a8bd25556692) · Team: `IA` · Issues: IA-9 a IA-36 |

## Blockers

_Nenhum blocker ativo_

## Todos

- [ ] Definir nome de usuário GitHub antes de publicar
- [ ] Validar modelo de monetização antes do lançamento (Fase 4)
- [ ] Revisão jurídica de dependências (licenças) antes do lançamento
- [ ] Construir time core para evitar burnout do maintainer

## Deferred Ideas

- RAG local com embeddings (Fase 3)
- Voice-driven coding mode (12+ meses)
- Colaboração multi-user em tempo real (12+ meses)
- Versão mobile via Termux/iSH (12+ meses)
- Telemetria opt-in anonimizada (Fase 5)

## Lessons Learned

_A preencher durante o desenvolvimento_

## Preferences

_A preencher durante o desenvolvimento_
