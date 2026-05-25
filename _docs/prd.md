# 📋 ChinaCode CLI — Product Requirements Document (PRD)

### Versão 1.0 | Codename: "Silk Road" | Maio de 2026

**Autor:** Produto & Engenharia
**Status:** Aprovado para Desenvolvimento
**Confidencialidade:** Público (Open Source)
**Repositório:** github.com/seu-usuario/chinacode-cli

---

## 📑 Sumário

1. [Sumário Executivo](#1-sumário-executivo)
2. [Visão e Missão](#2-visão-e-missão)
3. [Contexto de Mercado e Oportunidade](#3-contexto-de-mercado-e-oportunidade)
4. [Público-Alvo e Personas](#4-público-alvo-e-personas)
5. [Objetivos Estratégicos (OKRs)](#5-objetivos-estratégicos-okrs)
6. [Escopo Funcional Detalhado](#6-escopo-funcional-detalhado)
7. [Arquitetura de Alto Nível](#7-arquitetura-de-alto-nível)
8. [Experiência do Usuário (UX)](#8-experiência-do-usuário-ux)
9. [Requisitos Não-Funcionais](#9-requisitos-não-funcionais)
10. [Estratégia de Diferenciação Competitiva](#10-estratégia-de-diferenciação-competitiva)
11. [Ecossistema de Integrações](#11-ecossistema-de-integrações)
12. [Tratamento de Erros e Resiliência](#12-tratamento-de-erros-e-resiliência)
13. [Roadmap de Desenvolvimento](#13-roadmap-de-desenvolvimento)
14. [Métricas de Sucesso](#14-métricas-de-sucesso)
15. [Riscos e Mitigações](#15-riscos-e-mitigações)
16. [Estratégia de Lançamento e Go-to-Market](#16-estratégia-de-lançamento-e-go-to-market)
17. [Apêndices](#17-apêndices)

---

## 1. Sumário Executivo

O **ChinaCode CLI** é uma ferramenta de terminal de código aberto que oferece uma experiência completa de agente de codificação autônomo, construída especificamente para aproveitar o poder dos **modelos de linguagem chineses** (Qwen, DeepSeek, MiMo) em ambientes de desenvolvimento de software.

Posicionado como a **alternativa open-source ao Claude Code**, o ChinaCode CLI combina a sofisticação de agentes autônomos modernos (com acesso a ferramentas, execução de comandos e edição de arquivos) com diferenciais únicos: transparência total de custos, suporte multi-modelo, execução local, e um sistema de configuração baseado em Markdown que permite personalização profunda sem vendor lock-in.

### Proposta de Valor Central

> *"Um agente de codificação profissional, transparente e soberano, que coloca o poder dos modelos chineses nas mãos de desenvolvedores que exigem controle, privacidade e custo previsível."*

### Diferenciais Fundamentais

- **Soberania Tecnológica:** Nenhum vendor lock-in; funciona com qualquer provedor OpenAI-compatible ou localmente
- **Transparência Financeira:** Custo real por token visível em tempo real, sem orçamentos opacos
- **Segurança por Design:** Sandbox Docker obrigatório para execução autônoma
- **Extensibilidade Nativa:** Padrão Agent.md + MCP (Model Context Protocol)
- **Custo-Efetividade Radical:** Até 95% mais barato que soluções equivalentes ocidentais

---

## 2. Visão e Missão

### Visão (5 anos)

Ser a ferramenta de referência global para desenvolvedores que desejam utilizar modelos de IA asiáticos em workflows profissionais de codificação, estabelecendo um novo padrão de qualidade para agentes de terminal open-source.

### Missão

Democratizar o acesso a agentes de codificação de alta qualidade através de uma ferramenta aberta, transparente e economicamente acessível, que respeite a autonomia do desenvolvedor e promova a diversidade no ecossistema de modelos de linguagem.

### Princípios Orientadores

1. **Transparência Radical:** Cada token, cada custo, cada decisão do agente deve ser auditável
2. **Segurança Primeiro:** Autonomia nunca compromete a integridade do ambiente do usuário
3. **Performance Consciente:** Otimização para latência e custo sem sacrificar qualidade
4. **Extensibilidade como Padrão:** Qualquer desenvolvedor deve poder estender a ferramenta em minutos
5. **Respeito ao Usuário:** Sem telemetria intrusiva, sem surpresas na fatura, sem dependências forçadas

---

## 3. Contexto de Mercado e Oportunidade

### 3.1 Panorama Atual (2026)

O mercado de ferramentas de codificação com IA está em rápida consolidação:

- **Claude Code (Anthropic):** Líder atual em qualidade de agente autônomo, mas fechado e caro
- **Cursor:** Focado em experiência de IDE, menos orientado a terminal
- **GitHub Copilot CLI:** Integrado ao ecossistema Microsoft, limitado a GPT
- **Aider:** Open-source popular, mas com foco limitado a git-aware editing
- **OpenHands/Cline:** Alternativas open-source, mas com UX inferior

### 3.2 A Oportunidade dos Modelos Chineses

Os modelos chineses atingiram paridade competitiva com os modelos ocidentais líderes:

- **Qwen 3 / Qwen2.5-Coder:** Estado da arte em código, Apache 2.0
- **DeepSeek V3 / R1:** Raciocínio avançado a fração do custo
- **MiMo:** Modelos compactos de alta performance para edge

Porém, **falta uma ferramenta first-class** que explore essas capacidades. Desenvolvedores usam essas APIs via wrappers genéricos, perdendo otimizações específicas.

### 3.3 Gap de Mercado Identificado

| Necessidade | Soluções Atuais | ChinaCode CLI |
|---|---|---|
| Agente autônomo de qualidade | Claude Code (caro, fechado) | ✅ Open-source, barato |
| Suporte a modelos chineses | Wrappers genéricos | ✅ Otimizado nativamente |
| Transparência de custos | Orçamentos opacos | ✅ Token-level tracking |
| Execução local/offline | Limitado ou inexistente | ✅ Ollama/vLLM nativo |
| Personalização profunda | Arquivos de config proprietários | ✅ Agent.md em Markdown |
| Extensibilidade via padrões | Plugins proprietários | ✅ MCP (padrão aberto) |

### 3.4 Tamanho de Mercado

- **TAM (Total Addressable Market):** 30M+ desenvolvedores globais usando IA no workflow
- **SAM (Serviceable Addressable Market):** 5M+ desenvolvedores usando ferramentas CLI de IA
- **SOM (Serviceable Obtainable Market):** 100K desenvolvedores nos primeiros 18 meses (foco em entusiastas de modelos chineses, desenvolvedores na Ásia, e early adopters de open-source)

---

## 4. Público-Alvo e Personas

### 4.1 Persona Primária: "Thiago, o Desenvolvedor Soberano"

**Perfil:** Desenvolvedor sênior, 28-40 anos, trabalha remoto, valoriza privacidade e controle.

**Dores:**
- Cansado de pagar $100+/mês em Claude Max
- Preocupado com envio de código proprietário para APIs ocidentais
- Quer experimentar modelos chineses mas não sabe por onde começar
- Precisa de uma ferramenta que funcione offline em viagens

**Comportamento:**
- Usa terminal 80% do tempo
- Contribui para projetos open-source
- Acompanha HuggingFace, ModelScope, GitHub trending
- Tem hardware local razoável (16GB+ RAM, GPU opcional)

### 4.2 Persona Secundária: "Mei, a Pesquisadora de IA"

**Perfil:** Pesquisadora/engenheira de ML, 25-35 anos, baseada na Ásia ou com forte interesse em modelos asiáticos.

**Dores:**
- Precisa comparar múltiplos modelos rapidamente
- Quer benchmarking transparente para papers/blog posts
- Necessita de uma ferramenta que respeite particularidades culturais/linguísticas dos modelos
- Busca integrar com ModelScope, DashScope, APIs chinesas

**Comportamento:**
- Publica análises técnicas em Zhihu, V2EX, Twitter/X
- Mantém blog técnico bilíngue
- Participa de comunidades de modelos open-weights

### 4.3 Persona Terciária: "Carlos, o Empreendedor Bootstrapped"

**Perfil:** Fundador de startup pequena, 30-45 anos, budget limitado.

**Dores:**
- Não pode pagar $200/mês em Claude Code Max 20x
- Precisa de uma ferramenta que escale com o negócio
- Quer previsibilidade de custos para planejamento

**Comportamento:**
- Otimiza cada dólar gasto
- Prefere soluções pay-as-you-go
- Avalia ROI rigorosamente

### 4.4 Persona Anti-Alvo

- **Desenvolvedores 100% IDE:** Usuários que nunca abrem terminal não são o público inicial
- **Corporações com compliance rígido:** Empresas que exigem SOC2/ISO27001 antes de testar (fase futura)
- **Usuários casuais de ChatGPT:** Não precisam de agente autônomo

---

## 5. Objetivos Estratégicos (OKRs)

### 5.1 Objetivos de Lançamento (Primeiros 6 meses)

**Objective 1: Estabelecer presença técnica sólida**
- KR1: Atingir 1.000 estrelas no GitHub
- KR2: 50+ contribuidores ativos (PRs merged)
- KR3: 10.000+ instalações via npm/npx

**Objective 2: Validar qualidade técnica**
- KR1: Task completion rate > 80% em benchmark SWE-bench-like interno
- KR2: Custo médio por tarefa < $0.03 (vs $0.15 do Claude Code)
- KR3: Zero vulnerabilidades de segurança críticas reportadas

**Objective 3: Construir comunidade vibrante**
- KR1: 500+ membros no Discord/Telegram
- KR2: 20+ artigos/blog posts de terceiros sobre a ferramenta
- KR3: Presença em 3+ conferências (online ou presencial)

### 5.2 Objetivos de Crescimento (6-18 meses)

**Objective 4: Tornar-se referência em modelos chineses**
- KR1: Parceria oficial com Alibaba (Qwen) ou DeepSeek
- KR2: 5.000+ estrelas no GitHub
- KR3: 1M+ downloads acumulados

**Objective 5: Sustentabilidade financeira**
- KR1: Modelo de monetização definido (cloud hosted, enterprise, suporte)
- KR2: Receita recorrente > $10K MRR
- KR3: 10+ clientes enterprise pagantes

### 5.3 Objetivos de Longo Prazo (18+ meses)

**Objective 6: Ecossistema completo**
- KR1: Extensões oficiais para VS Code e JetBrains
- KR2: Marketplace de skills e plugins
- KR3: Versão hosted (SaaS) com margem > 60%

---

## 6. Escopo Funcional Detalhado

### 6.1 Core Agent Loop (P0 — Crítico)

#### 6.1.1 Loop ReAct (Reason + Act)
- **Descrição:** Ciclo iterativo onde o modelo raciocina, decide usar uma ferramenta, observa o resultado, e continua até conclusão
- **Requisitos:**
  - Suporte a múltiplas iterações consecutivas (até limite configurável, default 15)
  - Preservação completa do histórico entre iterações
  - Detecção de loops infinitos e saída graciosa
  - Timeout configurável por sessão

#### 6.1.2 Streaming Nativo
- **Descrição:** Renderização token-a-token da resposta do modelo
- **Requisitos:**
  - Latência para primeiro token (TTFT) < 500ms local, < 1.5s remoto
  - Suporte a tool calls em streaming
  - Interrupção graciosa via Ctrl+C (cancela geração sem sair)

#### 6.1.3 Parser Fallback de Tool Calls
- **Descrição:** Recuperação automática quando o modelo retorna tool calls em formato não-nativo
- **Requisitos:**
  - Detecção de blocos ```json``` dentro de texto markdown
  - Validação contra schema Zod antes de executar
  - Log de warning quando fallback é acionado

### 6.2 Sistema de Ferramentas (P0 — Crítico)

#### 6.2.1 Ferramentas Nativas

| Ferramenta | Descrição | Parâmetros |
|---|---|---|
| `bash` | Execução de comandos shell | command, timeout |
| `read_file` | Leitura de arquivos | path, offset, limit |
| `write_file` | Escrita de arquivos | path, content |
| `edit_file` | Edição cirúrgica | path, old_text, new_text |
| `glob_search` | Busca por padrão | pattern |
| `grep_search` | Busca por conteúdo | pattern, path |
| `list_directory` | Listagem de diretório | path, recursive |
| `delegate_task` | Delegação para subagente | subagent_name, task_description |

#### 6.2.2 Sandbox de Execução
- **Descrição:** Isolamento de comandos via Docker
- **Requisitos:**
  - Container efêmero (`--rm`)
  - Isolamento de rede (`--network none`)
  - Volume mount restrito ao workspace
  - Timeout forçado (default 60s)
  - Fallback local com warning quando Docker indisponível

#### 6.2.3 Diff Approval Interativo
- **Descrição:** Preview visual antes de cada write_file
- **Requisitos:**
  - Renderização colorida (verde=adição, vermelho=remoção)
  - Confirmação Y/N/A (Yes/No/Always)
  - Modo "auto-approve" configurável

### 6.3 Multi-Modelo e Roteamento (P0 — Crítico)

#### 6.3.1 Suporte a Múltiplos Modelos

**Modelos Remotos:**
- Qwen (via DashScope): qwen-plus, qwen-max, qwen-turbo, qwen3-max, qwen2.5-coder
- DeepSeek (via DeepSeek API): deepseek-chat, deepseek-reasoner
- MiMo e outros via SiliconFlow/Together AI

**Modelos Locais:**
- Ollama (default `http://localhost:11434/v1`)
- LM Studio (default `http://localhost:1234/v1`)
- vLLM/SGLang (default `http://localhost:8000/v1`)

#### 6.3.2 Roteamento Inteligente
- **Descrição:** Seleção automática de modelo baseado em intenção
- **Regras:**
  - Palavras-chave de raciocínio (debug, analyze, refactor) → modelo Reasoning
  - Palavras-chave simples (read, list, search) → modelo Fast
  - Demais casos → modelo Default
  - Tarefas triviais (com LOCAL_ENABLED) → modelo Local

#### 6.3.3 Fallback Transparente
- Se modelo primário falhar (429, 500), tentar secundário
- Se API remota cair, fallback para local (se disponível)
- Logs claros de qual modelo está sendo usado em cada turno

### 6.4 Sistema de Configuração Agent.md (P0 — Crítico)

#### 6.4.1 Estrutura do Arquivo
- **Localização:** Raiz do projeto (`./agent.md`)
- **Formato:** Markdown com seções convencionadas
- **Seções obrigatórias:** Nenhuma (tudo é opcional)
- **Seções reconhecidas:**
  - `## Identity` — Persona do agente
  - `## Rules` — Regras de comportamento
  - `## Skills` — Lista de skills disponíveis
  - `## Subagents` — Definição de subagentes

#### 6.4.2 Sistema de Skills
- **Descrição:** Documentos markdown com conhecimento especializado
- **Localização:** Pasta `./skills/*.md`
- **Conteúdo típico:**
  - Objetivo da skill
  - Checklist de verificação
  - Formato de output esperado
  - Exemplos
- **Skills iniciais fornecidas:**
  - `code-review.md` — Revisão de código
  - `test-generation.md` — Geração de testes
  - `db-migration.md` — Migrations de banco
  - `security-audit.md` — Auditoria de segurança
  - `performance-optimization.md` — Otimização

#### 6.4.3 Subagentes Especializados
- **Descrição:** Agentes dedicados a tarefas específicas
- **Configuração:**
  - Nome único
  - Skill associada
  - Modelo específico (pode diferir do principal)
  - Descrição para roteamento
- **Mecanismo de Delegação:**
  - Ferramenta `delegate_task` no loop principal
  - Subagente recebe contexto + skill + tarefa
  - Resultado retorna ao agente principal

### 6.5 Integração MCP (Model Context Protocol) (P1 — Alta)

#### 6.5.1 MCP Hub
- **Descrição:** Gerenciador centralizado de servidores MCP
- **Transportes suportados:**
  - `stdio` — Para servidores locais (filesystem, postgres, etc.)
  - `sse` — Para servidores remotos
- **Namespace:** Todas as ferramentas MCP prefixadas com `mcp_<server>_<tool>`

#### 6.5.2 Servidores MCP Iniciais
- `filesystem` — Acesso controlado a diretórios
- `postgresql` / `mysql` — Consultas a bancos
- `brave-search` / `tavily` — Busca web
- `github` — Interações com repositórios
- `puppeteer` / `playwright` — Automação de navegador

#### 6.5.3 Configuração
- Array JSON no `.env` ou arquivo dedicado `mcp-servers.json`
- Variáveis de ambiente por servidor (API keys, etc.)
- Validação de schema na inicialização

### 6.6 Interface de Usuário (P0 — Crítico)

#### 6.6.1 TUI Profissional
- **Layout fixo:**
  - Header com status do sistema (modelo, sandbox, versão)
  - Área de mensagens com scroll controlado
  - Barra de status com métricas (tokens, custo)
  - Input fixo na parte inferior
- **Renderização:**
  - ANSI colors (chalk)
  - Spinners elegantes (ora)
  - Diffs coloridos (diff)
  - Syntax highlighting para blocos de código

#### 6.6.2 Slash Commands

| Comando | Aliases | Descrição |
|---|---|---|
| `/help` | `/h`, `/?` | Lista comandos disponíveis |
| `/model <name>` | `/m` | Troca modelo default |
| `/sandbox <on\|off>` | `/sb` | Liga/desliga sandbox |
| `/local <on\|off>` | `/l` | Liga/desliga modelo local |
| `/cost` | `/c` | Mostra custo da sessão |
| `/clear` | `/cls` | Limpa histórico |
| `/compact` | — | Sumariza contexto longo |
| `/resume <id>` | — | Retoma sessão salva |
| `/sessions` | — | Lista sessões anteriores |
| `/export` | — | Exporta sessão para CSV/JSON |
| `/bench <task>` | — | Benchmark entre modelos |
| `/exit` | `/q`, `/quit` | Sai graciosamente |

#### 6.6.3 Controles de Teclado
- `Ctrl+C` uma vez: Cancela operação atual / mostra aviso de saída
- `Ctrl+C` duas vezes (< 800ms): Sai do CLI
- `Ctrl+L`: Limpa tela
- `Tab`: Autocomplete de comandos e caminhos
- `↑/↓`: Histórico de inputs

### 6.7 Persistência e Histórico (P1 — Alta)

#### 6.7.1 Sessões Salvas
- **Storage:** SQLite local (`~/.chinacode/sessions.db`)
- **Conteúdo salvo:**
  - Histórico completo de mensagens
  - Metadata (data, diretório, modelo, custo)
  - Estado de ferramentas (arquivos modificados)
- **Comandos:**
  - `/sessions` — Lista últimas 20 sessões
  - `/resume <id>` — Carrega sessão específica
  - Auto-save a cada 10 interações

#### 6.7.2 Histórico de Comandos
- Persistência entre sessões
- Busca por substring
- Deduplicação inteligente

### 6.8 Gestão de Contexto (P1 — Alta)

#### 6.8.1 Sumarização Automática
- **Trigger:** Quando histórico excede 70% do contexto do modelo
- **Mecanismo:**
  - Mantém system prompt + últimas 6 mensagens intactas
  - Sumariza mensagens antigas usando modelo Fast
  - Insere resumo como mensagem de sistema
- **Manual:** Via comando `/compact`

#### 6.8.2 Contexto Git-Aware
- **Auto-detecção:**
  - Branch atual
  - Status (arquivos modificados, staged)
  - Últimos commits
  - Diff desde último commit
- **Injeção no system prompt** quando relevante

### 6.9 Tracking de Custos (P0 — Crítico)

#### 6.9.1 Métricas em Tempo Real
- Tokens de input por turno
- Tokens de output por turno
- Custo acumulado em USD
- Custo por modelo

#### 6.9.2 Preços Configuráveis
- Arquivo `.env` com preços por 1M tokens
- Suporte a múltiplas tabelas de preço por modelo
- Atualização automática quando trocar modelo

#### 6.9.3 Relatórios
- Resumo ao final de cada sessão
- Export para CSV/JSON (`/export`)
- Gráficos históricos (roadmap futuro)

### 6.10 Segurança (P0 — Crítico)

#### 6.10.1 Proteção de Secrets
- Nunca enviar ao LLM:
  - Conteúdo de `.env`, `.git/config`
  - Arquivos `.pem`, `.key`, `id_rsa`
  - Tokens em comentários de código
- Detecção por regex e heurística

#### 6.10.2 Confirmações
- Comandos destrutivos (`rm -rf`, `drop table`, `git push --force`) exigem confirmação dupla
- Writes fora do workspace exigem aprovação

#### 6.10.3 Auditoria
- Log de todas as execuções em `~/.chinacode/audit.log`
- Timestamp, comando, resultado, usuário

---

## 7. Arquitetura de Alto Nível

### 7.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Runtime | Node.js 20+ | ESM nativo, fetch global, vasto ecossistema |
| Linguagem | TypeScript 5+ | Type-safety, DX superior |
| Module System | ESM | Padrão moderno, compatibilidade com SDKs |
| API Client | `openai` SDK | Compatível com todas APIs chinesas |
| Validation | Zod | Schemas robustos, inferência de tipos |
| UI/Terminal | readline + chalk + ora | Estabilidade, sem dependências pesadas |
| Sandbox | Docker | Padrão de mercado, isolamento de kernel |
| Persistência | SQLite (better-sqlite3) | Zero-config, embutido |
| MCP | @modelcontextprotocol/sdk | SDK oficial |

### 7.2 Componentes Principais

┌─────────────────────────────────────────┐
│ CLI Entry Point │
│ (readline REPL + TUI) │
└──────────────────┬──────────────────────┘
│
┌──────────┴──────────┐
│ │
┌────▼─────┐ ┌────▼─────┐
│ Commands │ │ Agent │
│ Parser │ │ Loop │
└──────────┘ └────┬─────┘
│
┌──────────────┼──────────────┐
│ │ │
┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
│ Model │ │ Tool │ │ Context │
│ Router │ │ Executor │ │ Manager │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘
│ │ │
┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
│ OpenAI │ │ Sandbox │ │ MCP │
│ Clients │ │ Docker │ │ Hub │
└───────────┘ └───────────┘ └───────────┘


### 7.3 Fluxo de Dados Típico

1. Usuário digita input no REPL
2. Command Parser verifica se é slash command (executa localmente se sim)
3. Se for mensagem normal, Agent Loop é acionado
4. Context Manager monta messages array (system + history + user)
5. Model Router seleciona modelo apropriado
6. OpenAI Client envia request em streaming
7. Tool Executor processa tool calls via Sandbox ou MCP
8. Resultados são adicionados ao histórico
9. Loop continua até resposta final ou limite de iterações
10. Cost Tracker atualiza métricas
11. UI renderiza resultado

### 7.4 Decisões Arquiteturais Críticas

**ADR-001: readline+chalk ao invés de Ink/React**
- **Motivo:** Maior estabilidade, menos bugs de renderização, menor bundle
- **Trade-off:** Menos recursos visuais avançados, mas suficiente para o caso de uso

**ADR-002: Docker como sandbox padrão**
- **Motivo:** Isolamento real de kernel, não apenas lógico
- **Trade-off:** Requer Docker instalado; mitigado por fallback local com warnings

**ADR-003: SQLite para persistência**
- **Motivo:** Zero-config, embutido, query SQL nativa
- **Trade-off:** Não escala para multi-user (irrelevante para CLI single-user)

**ADR-004: MCP como padrão de extensão**
- **Motivo:** Padrão aberto, crescente adoção, vendor-neutral
- **Trade-off:** Curva de aprendizado para desenvolvedores de plugins

---

## 8. Experiência do Usuário (UX)

### 8.1 Princípios de Design

1. **Feedback Imediato:** Cada ação do usuário gera resposta visual em < 100ms
2. **Progressive Disclosure:** Informação complexa só quando necessária
3. **Forgiveness:** Ctrl+C sempre funciona, ações destrutivas pedem confirmação
4. **Consistency:** Mesmos padrões em todos os modos (chat, tools, subagents)
5. **Transparency:** Usuário sempre sabe o que está acontecendo e quanto custa

### 8.2 Fluxos Principais

#### 8.2.1 Primeira Execução (Onboarding)

Usuário roda npx chinacode pela primeira vez
CLI detecta ausência de .env
Wizard interativo guia configuração:
Escolha de provedor (DashScope, DeepSeek, Local)
Input da API key (com validação)
Teste de conectividade
Criação de agent.md inicial com defaults
Mensagem de boas-vindas com exemplo de uso

#### 8.2.2 Sessão Típica de Codificação

Usuário navega para diretório do projeto
Executa chinacode
Descreve tarefa em linguagem natural
Agente:
Explora codebase (glob_search, read_file)
Formula plano
Executa mudanças (com diff approval)
Roda testes (bash)
Reporta resultado
Usuário itera até satisfação
/exit mostra resumo de custo

#### 8.2.3 Uso de Subagente

Usuário: "faça uma revisão de segurança do auth.ts"
Agente principal detecta intenção → delega para subagente reviewer
Subagente (com modelo Reasoning) executa skill security-audit
Resultado retorna ao agente principal
Agente formata e apresenta ao usuário

### 8.3 Tratamento de Estados de Erro

| Estado | Comportamento |
|---|---|
| API key inválida | Mensagem clara + link para obter nova key |
| Rate limit (429) | Retry exponencial + notificação |
| Modelo indisponível | Fallback automático + aviso |
| Sandbox falhou | Warning + pergunta se continua em modo inseguro |
| Context overflow | Sumarização automática + log |
| Ctrl+C durante execução | Cancela geração, mantém sessão |

### 8.4 Acessibilidade

- Suporte a screen readers (ANSI semântico)
- Modo de alto contraste (flag `--high-contrast`)
- Respeita `NO_COLOR` env var
- Mensagens de erro sempre em texto (não só emojis)

---

## 9. Requisitos Não-Funcionais

### 9.1 Performance

| Métrica | Meta | Medição |
|---|---|---|
| Cold start | < 500ms | Tempo de `chinacode` até prompt pronto |
| TTFT (local) | < 500ms | Primeiro token após submit |
| TTFT (remoto) | < 1500ms | Primeiro token após submit |
| Tool execution | < 2s overhead | Além do tempo real do comando |
| Memory (idle) | < 150MB | RSS em repouso |
| Memory (active) | < 400MB | RSS em sessão longa |
| CPU (idle) | < 1% | Quando aguardando input |

### 9.2 Confiabilidade

- **Uptime do cliente:** 99.9% (considerando dependências externas)
- **Taxa de sucesso de tool calls:** > 95%
- **Recuperação de erros:** Automática em 80% dos casos transitórios
- **MTTR (Mean Time To Recovery):** < 30s para erros recuperáveis

### 9.3 Segurança

- **Zero secrets em logs:** Validação por regex em todas saídas
- **Sandbox escape:** Testes automatizados mensais
- **Dependências vulneráveis:** Scan diário via `npm audit`
- **SBOM (Software Bill of Materials):** Publicado a cada release
- **Code signing:** Binários assinados via Sigstore

### 9.4 Compatibilidade

| Plataforma | Versão Mínima | Status |
|---|---|---|
| macOS | 12+ (Monterey) | ✅ Primary |
| Linux (Ubuntu/Debian) | 20.04+ | ✅ Primary |
| Linux (Fedora/RHEL) | 35+ | ✅ Primary |
| Windows | 10+ via WSL2 | ✅ Primary |
| Windows (nativo) | 10+ | ⚠️ Best-effort |
| Node.js | 20.0.0+ | ✅ Required |
| Docker | 20.10+ | ⚠️ Optional |

### 9.5 Escalabilidade

- **Tamanho de codebase:** Suporta projetos com 100K+ arquivos
- **Contexto:** Gerencia até 128K tokens (modelo dependente)
- **Sessões:** Mantém histórico de 1000+ sessões sem degradação
- **MCP servers:** Suporta 20+ servidores simultâneos

### 9.6 Manutenibilidade

- **Cobertura de testes:** > 70% unit, > 50% integration
- **Complexidade ciclomática:** < 15 por função
- **Documentação de API:** 100% das funções públicas
- **Changelog:** Automatizado via conventional commits

---

## 10. Estratégia de Diferenciação Competitiva

### 10.1 Matriz Comparativa vs Claude Code

| Dimensão | Claude Code | ChinaCode CLI | Vantagem |
|---|---|---|---|
| **Preço (mensal)** | $100-$200 | $2-$20 (pay-as-you-go) | 🟢 10-50x mais barato |
| **Modelos disponíveis** | Só Claude | Qwen, DeepSeek, MiMo, locais | 🟢 Multi-vendor |
| **Execução offline** | ❌ | ✅ Ollama/vLLM | 🟢 Soberania |
| **Transparência de custo** | Budget opaco | Token-level tracking | 🟢 Previsibilidade |
| **Código-fonte** | Fechado | Open-source (MIT) | 🟢 Auditabilidade |
| **Personalização** | CLAUDE.md proprietário | Agent.md em Markdown | 🟢 Portabilidade |
| **Extensões** | MCP + limitado | MCP full + plugins | 🟢 Ecossistema |
| **Qualidade do agente** | 🟢 Excelente | 🟡 Bom (melhorando) | 🔴 Gap a fechar |
| **Latência** | 🟢 Rápido | 🟡 Variável | 🔴 Depende do modelo |
| **Suporte enterprise** | 🟢 Dedicado | 🔴 Comunidade | 🔴 Gap inicial |

### 10.2 Propostas de Valor Únicas (USPs)

1. **"Pague pelo que usar, não pelo que teme usar"**
   - Sem surpresas na fatura; orçamento 100% previsível

2. **"Seus modelos, suas regras"**
   - Rode onde quiser: cloud chinesa, cloud americana, laptop pessoal

3. **"Aberto por design, não por acidente"**
   - Cada linha de código auditável; fork e customize livremente

4. **"A ponte entre o ecossistema chinês e o mundo"**
   - Documentação trilíngue (PT/EN/ZH); suporte a APIs asiáticas de primeira classe

5. **"Segurança não é feature premium"**
   - Sandbox Docker disponível para todos, não tier-gated

### 10.3 Posicionamento de Marca

**Tagline:** *"O poder dos modelos chineses, no seu terminal, sob suas regras."*

**Tom de voz:**
- Técnico mas acessível
- Transparente sobre limitações
- Entusiasta sobre open-source
- Respeitoso com todas as comunidades (ocidental e asiática)

---

## 11. Ecossistema de Integrações

### 11.1 Provedores de Modelo (Lançamento)

| Provedor | Modelos | Região | Prioridade |
|---|---|---|---|
| DashScope (Alibaba) | Qwen Plus, Qwen Max, Qwen3 Max, Qwen2.5-Coder | China/Global | P0 |
| DeepSeek API | DeepSeek Chat, DeepSeek Reasoner | China/Global | P0 |
| SiliconFlow | Qwen, DeepSeek, MiMo | China | P1 |
| Together AI | Qwen, DeepSeek | Global | P1 |
| Ollama (local) | Qualquer GGUF | Local | P0 |
| LM Studio (local) | Qualquer GGUF | Local | P1 |
| vLLM (local) | Qualquer HF | Local | P1 |

### 11.2 Servidores MCP (Lançamento)

| Categoria | Servidor | Prioridade |
|---|---|---|
| Filesystem | `@modelcontextprotocol/server-filesystem` | P0 |
| Git | `@modelcontextprotocol/server-git` | P0 |
| PostgreSQL | `@modelcontextprotocol/server-postgres` | P1 |
| Brave Search | `@modelcontextprotocol/server-brave-search` | P1 |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` | P2 |
| GitHub | `@modelcontextprotocol/server-github` | P2 |

### 11.3 Ferramentas de Desenvolvimento

- **Git:** Detecção automática, integração com commits
- **npm/yarn/pnpm:** Sugestão de comandos de instalação
- **Docker:** Sandbox + gerenciamento de containers
- **IDEs (futuro):** Bridge para VS Code / JetBrains

### 11.4 APIs e Serviços Externos

- **GitHub/GitLab:** Para criar PRs, issues automaticamente
- **Linear/Jira:** Para atualizar tarefas
- **Slack/Discord:** Para notificações de tarefas longas
- **Sentry:** Para reportar erros (opt-in)

---

## 12. Tratamento de Erros e Resiliência

### 12.1 Taxonomia de Erros

Baseado no knowledge base oficial da DashScope/Alibaba, erros são classificados em categorias acionáveis:

#### 12.1.1 Erros de Autenticação (401)

| Código | Causa | Ação do CLI |
|---|---|---|
| `InvalidApiKey` / `invalid_api_key` | API key inválida ou expirada | Guiar usuário a obter nova key com link direto |
| `Arrearage` | Conta com faturas em aberto | Mensagem clara sobre billing + link console |
| `NOT AUTHORIZED` | Workspace inválido | Verificar configuração e região |

**Mensagem acionável exemplo:**

❌ Sua API key do DashScope é inválida ou expirou.
🔧 Como resolver:
Acesse https://dashscope.console.aliyun.com/
Vá em API Keys → Create New Key
Atualize seu .env com: OPENAI_API_KEY=sk-nova-key
💡 Dicas:
Keys começam com "sk-" e têm 32 caracteres
Verifique se Base URL corresponde à região da key
Coding Plan keys (sk-sp-) exigem URL específica

#### 12.1.2 Erros de Validação (400)

| Código | Causa | Ação do CLI |
|---|---|---|
| `InvalidParameter` | Parâmetros fora de spec | Ajustar automaticamente ou alertar |
| `DataInspectionFailed` | Conteúdo sensível bloqueado | Reformular prompt automaticamente |
| `model_not_exist` | Nome de modelo incorreto | Sugerir nomes válidos similares |
| `context_length_exceeded` | Input muito longo | Trigger sumarização automática |
| `enable_thinking` incompatível | Modelo não suporta thinking | Desabilitar flag e retry |

#### 12.1.3 Erros de Rate Limit (429)

| Código | Causa | Ação do CLI |
|---|---|---|
| `limit_requests` / `Throttling.RateQuota` | Muitas requisições por minuto | Backoff exponencial (1s, 4s, 16s) |
| `insufficient_quota` / `Throttling.AllocationQuota` | TPM excedido | Reduzir batch size + fallback |
| `limit_burst_rate` | Pico súbito de requests | Request smoothing |
| `FreeTierOnly` | Cota gratuita esgotada | Sugerir upgrade ou modelo alternativo |

#### 12.1.4 Erros de Servidor (500/503)

| Código | Causa | Ação do CLI |
|---|---|---|
| `internal_error` | Erro genérico do servidor | Retry até 3x com backoff |
| `RequestTimeOut` | Timeout > 300s | Usar streaming obrigatoriamente |
| `ModelUnavailable` | Modelo em manutenção | Fallback para modelo alternativo |
| `ModelServingError` | Saturação de capacidade | Retry com jitter aleatório |

#### 12.1.5 Erros de Permissão (403)

| Código | Causa | Ação do CLI |
|---|---|---|
| `AccessDenied` | Sem permissão ao modelo | Sugerir申請 (aplicação) de acesso |
| `Unpurchased` | Serviço não ativado | Link para ativação |
| `Workspace.AccessDenied` | Sem acesso ao workspace | Usar API key do main account |

#### 12.1.6 Erros de Recurso (404)

| Código | Causa | Ação do CLI |
|---|---|---|
| `ModelNotFound` | Modelo não existe | Listar modelos disponíveis |
| `model_not_supported` | Não suporta OpenAI-compat | Switch para DashScope nativo |

### 12.2 Estratégia de Retry

Tentativa 1: Imediata
Tentativa 2: Após 1 segundo + jitter (0-500ms)
Tentativa 3: Após 4 segundos + jitter
Tentativa 4: Após 16 segundos + jitter
Após 4 falhas no modelo primário: Fallback para modelo alternativo
Após falha no fallback: Erro final com diagnóstico completo

**Retry apenas em erros recuperáveis:**
- 429 (rate limit) — sempre retry
- 500, 502, 503, 504 — retry
- 408 (timeout) — retry
- Network errors — retry

**Nunca retry em:**
- 400 (bad request) — erro do cliente
- 401 (unauthorized) — erro de auth
- 403 (forbidden) — erro de permissão
- 404 (not found) — recurso não existe

### 12.3 Diagnóstico Inteligente

O CLI deve fornecer **mensagens de erro acionáveis**, não apenas códigos:

❌ **Ruim:** `Error 401: invalid_api_key`

✅ **Bom:**
❌ Sua API key do DashScope é inválida ou expirou.
🔧 Como resolver:
Acesse https://dashscope.console.aliyun.com/
Vá em API Keys → Create New Key
Atualize seu .env com: OPENAI_API_KEY=sk-nova-key
💡 Dica: Keys começam com "sk-" e têm 32 caracteres.
Verifique também se o OPENAI_BASE_URL corresponde à região da key.

### 12.4 Observabilidade

- **Logs estruturados** em `~/.chinacode/logs/YYYY-MM-DD.jsonl`
- **Correlation IDs** para rastrear requests (header `X-Request-Id`)
- **Métricas exportáveis** (Prometheus format) em modo daemon
- **Health check endpoint** quando rodando como servidor
- **Dashboard local** (`/stats`) com distribuição de erros por tipo

### 12.5 Circuit Breaker

Após 5 falhas consecutivas em um provedor específico:
1. Marcar provedor como "degraded" por 60 segundos
2. Rotear automaticamente para fallback
3. Tentar probe request após timeout
4. Restaurar se probe passar

---

## 13. Roadmap de Desenvolvimento

### 13.1 Fase 1: Foundation (Semanas 1-4) — 🏁 ATUAL

**Objetivo:** MVP funcional e estável

**Entregáveis:**
- [x] Core agent loop com ReAct
- [x] Ferramentas básicas (bash, read, write, glob)
- [x] Sandbox Docker
- [x] Streaming output
- [x] Slash commands essenciais
- [x] Cost tracking
- [x] Ctrl+C gracioso
- [ ] Diff approval interativo
- [ ] Persistência básica de sessão
- [ ] Tratamento robusto de erros DashScope

**Critério de Sucesso:** 10 usuários internos usando diariamente

### 13.2 Fase 2: Intelligence (Semanas 5-8)

**Objetivo:** Agente realmente inteligente

**Entregáveis:**
- [ ] Sistema Agent.md completo
- [ ] Skills em markdown
- [ ] Subagentes especializados
- [ ] Gestão de contexto com sumarização
- [ ] Git-aware context
- [ ] LSP integration básica
- [ ] Parser fallback de tool calls
- [ ] Error recovery automático

**Critério de Sucesso:** Task completion rate > 75% em benchmarks internos

### 13.3 Fase 3: Ecosystem (Semanas 9-12)

**Objetivo:** Extensibilidade rica

**Entregáveis:**
- [ ] MCP Hub completo (stdio + SSE)
- [ ] Servidores MCP oficiais (filesystem, git, postgres)
- [ ] Sistema de plugins
- [ ] Marketplace de skills
- [ ] Benchmark mode `/bench`
- [ ] RAG local com embeddings

**Critério de Sucesso:** 10+ plugins de terceiros publicados

### 13.4 Fase 4: Polish & Launch (Semanas 13-16)

**Objetivo:** Pronto para público amplo

**Entregáveis:**
- [ ] Documentação completa (site dedicado)
- [ ] Tutorial interativo
- [ ] Demo GIF/vídeo
- [ ] Documentação trilíngue (PT/EN/ZH)
- [ ] CI/CD robusto
- [ ] Testes E2E automatizados
- [ ] Publicação oficial npm
- [ ] Anúncio em HN, Reddit, V2EX

**Critério de Sucesso:** 500+ stars no GitHub na primeira semana

### 13.5 Fase 5: Growth (Meses 5-12)

**Objetivo:** Escalar comunidade e produto

**Entregáveis:**
- [ ] Extensão VS Code
- [ ] Extensão JetBrains
- [ ] Versão hosted (SaaS)
- [ ] Planos enterprise
- [ ] Telemetria opt-in (anonimizada)
- [ ] A/B testing de prompts
- [ ] Parcerias oficiais com provedores

**Critério de Sucesso:** 5.000+ stars; 100K+ downloads; $10K MRR

### 13.6 Horizonte de Longo Prazo (12+ meses)

- Versão mobile (Termux/iSH)
- Voice-driven coding mode
- Colaboração multi-user em tempo real
- Marketplace pago de skills premium
- Certificação enterprise (SOC2, ISO27001)
- Fundação open-source dedicada

---

## 14. Métricas de Sucesso

### 14.1 Métricas de Produto (Lagging)

| Métrica | Meta 6 meses | Meta 12 meses | Meta 24 meses |
|---|---|---|---|
| **GitHub Stars** | 1.000 | 5.000 | 20.000 |
| **Downloads npm (mensal)** | 5.000 | 50.000 | 500.000 |
| **Contribuidores ativos** | 20 | 100 | 300 |
| **Usuários recorrentes semanais** | 500 | 5.000 | 50.000 |
| **Sessões completadas por dia** | 2.000 | 50.000 | 1.000.000 |

### 14.2 Métricas de Qualidade (Leading)

| Métrica | Meta | Medição |
|---|---|---|
| **Task completion rate** | > 80% | Benchmark interno mensal |
| **Custo médio por tarefa** | < $0.03 | Tracking automático |
| **TTFT P95** | < 2s | Telemetria opt-in |
| **Crash rate** | < 0.1% | Sentry (opt-in) |
| **NPS (Net Promoter Score)** | > 50 | Pesquisa trimestral |
| **Error recovery rate** | > 80% | Logs internos |

### 14.3 Métricas de Negócio

| Métrica | Meta 12 meses |
|---|---|
| **MRR (Monthly Recurring Revenue)** | $10.000 |
| **Clientes enterprise** | 10 |
| **CAC (Customer Acquisition Cost)** | < $50 |
| **LTV (Lifetime Value)** | > $500 |
| **Churn mensal** | < 5% |

### 14.4 Métricas de Comunidade

- Resposta a issues em < 48h
- PRs revisados em < 72h
- Releases mensais regulares
- Blog posts quinzenais
- Presença em 5+ conferências/ano

---

## 15. Riscos e Mitigações

### 15.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **API chinesa instável** | Alta | Alto | Multi-provider + fallback local + circuit breaker |
| **Tool calling inconsistente** | Média | Alto | Parser fallback + prompts otimizados |
| **Sandbox escape** | Baixa | Crítico | Testes de penetração trimestrais |
| **Modelos locais fracos** | Média | Médio | Roteamento híbrido; local só para simples |
| **Incompatibilidade terminal** | Baixa | Baixo | Fallback para modo linear |
| **Rate limits agressivos** | Alta | Médio | Request smoothing + retry inteligente |
| **Mudanças breaking em APIs** | Média | Alto | Versionamento de adapters por provedor |

### 15.2 Riscos de Mercado

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Claude Code lança versão open** | Baixa | Crítico | Velocidade de execução + nicho específico |
| **Alibaba lança ferramenta oficial** | Média | Alto | Posicionar como community-driven, multi-vendor |
| **Sanções geopolíticas** | Baixa | Crítico | Manter neutralidade; múltiplas regiões |
| **Fadiga de ferramentas IA** | Média | Médio | Focar em ROI tangível |
| **Concorrência de Cursor/Aider** | Alta | Médio | Diferenciação clara + execução superior |

### 15.3 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Burnout do maintainer** | Alta | Alto | Construir time core cedo |
| **Falta de monetização** | Média | Alto | Validar pricing antes do lançamento |
| **Problemas legais (licenças)** | Baixa | Alto | Revisão jurídica de todas dependências |
| **Vazamento de dados de usuário** | Baixa | Crítico | Zero telemetria por padrão |

### 15.4 Plano de Contingência

**Cenário Crítico 1: Alibaba lança ferramenta oficial Qwen-CLI**
- Pivot para multi-vendor (enfatizar DeepSeek, MiMo, locais)
- Buscar parceria oficial ao invés de competição
- Focar em nichos que oficial não cobre (subagentes, skills)

**Cenário Crítico 2: Sanções bloqueiam acesso a APIs chinesas**
- Foco total em modelos locais e fine-tunes
- Migração para provedores alternativos (Together AI, Fireworks)
- Posicionamento como ferramenta de soberania digital

**Cenário Crítico 3: Baixa adoção após 6 meses**
- Pivot para uso enterprise (consultoria + customização)
- Integrar como plugin em ferramentas estabelecidas (Cursor, Aider)
- Reduzir escopo e focar em nicho específico (ex: code review)

---

## 16. Estratégia de Lançamento e Go-to-Market

### 16.1 Fases de Lançamento

#### Pré-Lançamento (Semanas -4 a 0)
- Construção de landing page
- Beta fechado com 20-50 usuários
- Coleta de depoimentos
- Preparação de conteúdo (blog posts, vídeos)
- Criação de canal Discord/Telegram

#### Soft Launch (Semana 0)
- Publicação no npm
- Post no blog oficial
- Anúncio em comunidades específicas (não mainstream)
- Objetivo: validar infraestrutura sob carga real

#### Hard Launch (Semana +2)
- Post no Hacker News (Show HN)
- Post no Reddit (r/programming, r/LocalLLaMA, r/commandline)
- Post no V2EX, Zhihu, Juejin (China)
- Post no Twitter/X com demo GIF
- Envio para newsletters (TLDR, Morning Brew Tech)

#### Amplification (Semanas +4 a +12)
- Artigos em publicações técnicas (InfoQ, TheNewStack)
- Palestras em meetups
- Parcerias com influenciadores de IA
- Workshops online

### 16.2 Canais de Aquisição

| Canal | Prioridade | Custo | Alcance |
|---|---|---|---|
| **GitHub trending** | P0 | Baixo | Alto |
| **HN / Reddit** | P0 | Baixo | Médio-Alto |
| **Twitter/X** | P1 | Baixo | Médio |
| **YouTube (tutoriais)** | P1 | Médio | Alto |
| **Conferências** | P2 | Alto | Médio |
| **SEO (blog técnico)** | P1 | Médio (tempo) | Alto (longo prazo) |
| **Ads (GitHub, Twitter)** | P3 | Alto | Variável |

### 16.3 Conteúdo de Lançamento

1. **Blog post de anúncio:** "Apresentando ChinaCode CLI: agente de codificação open-source para modelos chineses"
2. **Tutorial de 5 minutos:** Do zero ao primeiro agente funcionando
3. **Demo vídeo (3min):** Mostrando 3 casos de uso reais
4. **Comparison post:** "ChinaCode CLI vs Claude Code: qual escolher?"
5. **Benchmarks técnicos:** Performance, custo, qualidade lado-a-lado

### 16.4 Estratégia de Comunidade

- **Código de conduta** claro desde o dia 1
- **Labels de issues** amigáveis para first-timers (`good-first-issue`, `help-wanted`)
- **Programa de embaixadores** para evangelistas
- **Swag (adesivos, camisetas)** para contribuidores
- **Reconhecimento público** (hall of fame, changelog mentions)

### 16.5 Monetização (Horizonte 12+ meses)

**Modelo freemium com 3 tiers:**

1. **Community (Gratuito):**
   - CLI open-source completo
   - Suporte via comunidade
   - Sem limites artificiais

2. **Pro ($20/mês):**
   - Cloud hosted (sem setup)
   - Sessões salvas em cloud
   - Suporte por email (24h)
   - Skills premium
   - Analytics avançado

3. **Enterprise ($100+/usuário/mês):**
   - SSO/SAML
   - Audit logs avançados
   - Modelos privados
   - SLA garantido
   - Suporte dedicado
   - Customização

---

## 17. Apêndices

### Apêndice A: Glossário

- **Agente:** Sistema de IA autônomo que usa ferramentas para realizar tarefas
- **LLM (Large Language Model):** Modelo de linguagem de grande escala
- **MCP (Model Context Protocol):** Protocolo aberto para integração de ferramentas
- **ReAct:** Padrão de Reason + Act para agentes
- **Sandbox:** Ambiente isolado para execução de código
- **Streaming:** Resposta entregue incrementalmente (token-a-token)
- **Tool calling:** Capacidade do modelo de invocar funções externas
- **TTFT (Time to First Token):** Tempo até o primeiro token da resposta
- **TPM (Tokens Per Minute):** Limite de throughput de tokens
- **RPS/RPM:** Requests per second/minute

### Apêndice B: Referências

- Claude Code: https://claude.com/claude-code
- Anthropic MCP Spec: https://modelcontextprotocol.io
- DashScope (Alibaba): https://dashscope.aliyun.com
- DashScope Error Codes: https://help.aliyun.com/zh/model-studio/error-code
- DeepSeek: https://www.deepseek.com
- Qwen: https://qwen.ai
- Ollama: https://ollama.com
- vLLM: https://vllm.ai

### Apêndice C: Personas Detalhadas

(ver Seção 4)

### Apêndice D: Benchmarks e Testes Planejados

**Benchmarks técnicos:**
- SWE-bench (resolução de issues reais do GitHub)
- HumanEval (geração de código Python)
- MBPP (Mostly Basic Python Programming)
- Custom benchmark: 100 tarefas reais de desenvolvimento web

**Critérios de qualidade:**
- Correção funcional (testes passam?)
- Qualidade do código (linting, complexidade)
- Eficiência (tokens gastos, tempo)
- Segurança (vulnerabilidades introduzidas?)

### Apêndice E: Requisitos Legais e Compliance

- **Licença:** MIT (permissiva, comercial-friendly)
- **Contributor License Agreement:** CLA Assistant
- **Privacy Policy:** Zero telemetria por padrão
- **Trademarks:** "ChinaCode CLI" registrado
- **Export compliance:** Verificar restrições de modelos por região

### Apêndice F: Estrutura de Documentação

docs/
├── getting-started/
│ ├── installation.md
│ ├── quick-start.md
│ └── first-project.md
├── guides/
│ ├── agent-md.md
│ ├── skills.md
│ ├── subagents.md
│ ├── mcp-integration.md
│ └── local-models.md
├── reference/
│ ├── commands.md
│ ├── tools.md
│ ├── config.md
│ ├── errors.md
│ └── api.md
├── tutorials/
│ ├── code-review-workflow.md
│ ├── fullstack-project.md
│ └── custom-skill.md
└── community/
├── contributing.md
├── code-of-conduct.md
└── faq.md

### Apêndice G: Métricas de Telemetria (Opt-in)

Quando usuário consente, coletamos **apenas**:
- Versão do CLI
- SO e arquitetura
- Modelos usados (sem conteúdo)
- Contagens agregadas de tokens
- Erros (sem payloads)
- Duração de sessões

**Nunca coletamos:**
- Conteúdo de prompts ou respostas
- Código-fonte
- Nomes de arquivos
- API keys ou credentials
- IPs ou identificadores pessoais

### Apêndice H: Matriz de Erros DashScope (Referência Rápida)

Tabela consolidada dos erros mais comuns e ações automáticas do CLI:

| Categoria | Erros Comuns | Ação Automática |
|---|---|---|
| Auth (401) | `InvalidApiKey`, `Arrearage` | Alerta + link de resolução |
| Validação (400) | `InvalidParameter`, `DataInspectionFailed` | Retry com ajuste |
| Rate Limit (429) | `limit_requests`, `insufficient_quota` | Backoff exponencial |
| Servidor (500) | `internal_error`, `RequestTimeOut` | Retry + fallback |
| Permissão (403) | `AccessDenied`, `Unpurchased` | Alerta + link |
| Recurso (404) | `ModelNotFound` | Sugerir alternativas |

---

## 📝 Aprovações

| Papel | Nome | Data | Status |
|---|---|---|---|
| Product Owner | [A definir] | — | ⏳ Pendente |
| Tech Lead | [A definir] | — | ⏳ Pendente |
| Design Lead | [A definir] | — | ⏳ Pendente |
| Community Manager | [A definir] | — | ⏳ Pendente |

---

## 📚 Histórico de Versões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 1.0 | Maio 2026 | Produto & Engenharia | Versão inicial completa |

---

**Fim do Documento**

*Este PRD é um documento vivo. Atualizações serão feitas trimestralmente ou quando mudanças significativas de escopo/estratégia ocorrerem. Contribuições via PR são bem-vindas.*

**Para salvar:** Copie este conteúdo e salve como `PRD.md` na raiz do repositório.