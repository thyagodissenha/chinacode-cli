# ChinaCode CLI — Roadmap

## Overview

| Fase | Período | Status | Objetivo |
|---|---|---|---|
| **F1: Foundation** | Semanas 1-4 | 🔄 Em andamento | MVP funcional e estável |
| **F2: Intelligence** | Semanas 5-8 | ⏳ Planejado | Agente realmente inteligente |
| **F3: Ecosystem** | Semanas 9-12 | ⏳ Planejado | Extensibilidade rica |
| **F4: Polish & Launch** | Semanas 13-16 | ⏳ Planejado | Pronto para público amplo |
| **F5: Growth** | Meses 5-12 | ⏳ Futuro | Escalar comunidade e produto |

---

## Fase 1: Foundation (Semanas 1-4) 🔄

**Critério de sucesso:** 10 usuários internos usando diariamente

### Concluído ✅
- Core agent loop com ReAct
- Ferramentas básicas (bash, read, write, glob)
- Sandbox Docker
- Streaming output
- Slash commands essenciais
- Cost tracking
- Ctrl+C gracioso

### Pendente 📌
- [ ] **F1.1** Diff approval interativo (preview visual antes de write_file)
- [ ] **F1.2** Persistência básica de sessão (SQLite)
- [ ] **F1.3** Tratamento robusto de erros DashScope (401/400/429/500/403/404)

---

## Fase 2: Intelligence (Semanas 5-8) ⏳

**Critério de sucesso:** Task completion rate > 75% em benchmarks internos

- [ ] **F2.1** Sistema Agent.md completo (parsing, Skills, Subagentes)
- [ ] **F2.2** Skills em Markdown (code-review, test-gen, db-migration, security-audit, perf)
- [ ] **F2.3** Subagentes especializados (delegate_task + execução isolada)
- [ ] **F2.4** Gestão de contexto com sumarização automática (70% trigger)
- [ ] **F2.5** Git-aware context (branch, status, commits, diff)
- [ ] **F2.6** Parser fallback de tool calls (JSON em markdown)
- [ ] **F2.7** Error recovery automático (circuit breaker + retry inteligente)

---

## Fase 3: Ecosystem (Semanas 9-12) ⏳

**Critério de sucesso:** 10+ plugins de terceiros publicados

- [ ] **F3.1** MCP Hub completo (stdio + SSE transport)
- [ ] **F3.2** Servidores MCP oficiais: filesystem, git, postgres, brave-search
- [ ] **F3.3** Sistema de plugins
- [ ] **F3.4** Benchmark mode `/bench`
- [ ] **F3.5** RAG local com embeddings

---

## Fase 4: Polish & Launch (Semanas 13-16) ⏳

**Critério de sucesso:** 500+ stars no GitHub na primeira semana

- [ ] **F4.1** Documentação completa (site dedicado)
- [ ] **F4.2** Tutorial interativo + demo GIF/vídeo
- [ ] **F4.3** Documentação trilíngue (PT/EN/ZH)
- [ ] **F4.4** CI/CD robusto + testes E2E automatizados
- [ ] **F4.5** Publicação oficial npm
- [ ] **F4.6** Anúncio: HN, Reddit, V2EX, Twitter/X

---

## Fase 5: Growth (Meses 5-12) ⏳

**Critério de sucesso:** 5.000+ stars; 100K+ downloads; $10K MRR

- [ ] Extensão VS Code + JetBrains
- [ ] Versão hosted (SaaS) com tiers Pro/Enterprise
- [ ] Telemetria opt-in anonimizada
- [ ] Parcerias oficiais com Alibaba (Qwen) / DeepSeek
- [ ] 10+ clientes enterprise pagantes

---

## Horizonte Longo Prazo (12+ meses)

- Versão mobile (Termux/iSH)
- Voice-driven coding mode
- Colaboração multi-user em tempo real
- Marketplace pago de skills premium
- Certificação enterprise (SOC2, ISO27001)
- Fundação open-source dedicada

---

## Feature Priority Matrix (P0 = crítico para MVP)

| Feature | Fase | Prioridade |
|---|---|---|
| Core Agent Loop (ReAct) | F1 | P0 ✅ |
| Ferramentas nativas (bash, read, write, edit, glob, grep) | F1 | P0 ✅ |
| Sandbox Docker | F1 | P0 ✅ |
| Streaming nativo | F1 | P0 ✅ |
| Multi-modelo + roteamento inteligente | F1 | P0 ✅ |
| TUI profissional + slash commands | F1 | P0 ✅ |
| Cost tracking em tempo real | F1 | P0 ✅ |
| Diff approval interativo | F1 | P0 📌 |
| Persistência de sessão (SQLite) | F1 | P1 📌 |
| Tratamento de erros DashScope | F1 | P0 📌 |
| Sistema Agent.md + Skills | F2 | P0 |
| Subagentes especializados | F2 | P1 |
| Gestão de contexto / sumarização | F2 | P1 |
| Git-aware context | F2 | P1 |
| MCP Hub | F3 | P1 |
