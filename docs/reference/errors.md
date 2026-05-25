# Erros comuns e soluções

---

## Erros de autenticação

### `API key inválida ou expirada` (HTTP 401 · InvalidApiKey / invalid_api_key)

**Causa:** A `OPENAI_API_KEY` está incorreta, expirada ou revogada.

**Solução passo a passo:**
1. Acesse o console do seu provedor:
   - DashScope: [dashscope.aliyun.com](https://dashscope.aliyun.com)
   - DeepSeek: [platform.deepseek.com](https://platform.deepseek.com)
2. Gere uma nova API key
3. Atualize o `.env`:
   ```env
   OPENAI_API_KEY=nova-chave-aqui
   ```
4. Reinicie o ChinaCode

---

### `Conta com fatura em aberto` (HTTP 401 · Arrearage)

**Causa:** Sua conta tem pagamento pendente, bloqueando o uso da API.

**Solução:**
1. Acesse o painel de billing do provedor
2. Regularize o pagamento pendente
3. Aguarde a reativação (geralmente imediata após pagamento)

---

## Erros de rate limit

### `Rate limit atingido` (HTTP 429)

**Causa:** Você excedeu o limite de requisições por minuto/hora do seu plano.

**Solução:**
- O agente tenta automaticamente com backoff exponencial
- Se persistir, aguarde alguns segundos e tente novamente
- Para projetos intensivos, considere upgrade de plano ou usar `FAST_MODEL` para reduzir carga no modelo principal

---

## Erros de modelo

### `Modelo não encontrado` (HTTP 400 · model_not_exist)

**Causa:** O valor de `DEFAULT_MODEL` (ou `REASONING_MODEL` / `FAST_MODEL`) não existe no provedor configurado.

**Solução:**
1. Verifique o nome exato do modelo na documentação do provedor
2. Corrija no `.env`:
   ```env
   # DashScope: qwen-plus, qwen-max, qwen-turbo, qwen-long
   DEFAULT_MODEL=qwen-plus

   # DeepSeek: deepseek-chat, deepseek-reasoner
   DEFAULT_MODEL=deepseek-chat
   ```
3. Reinicie o ChinaCode

---

### `Contexto excedido` (HTTP 400 · context_length_exceeded)

**Causa:** O histórico da conversa ultrapassou o limite de tokens do modelo.

**Solução:**
- Use `/compact` para sumarizar o contexto *(disponível na Fase 2)*
- Ou use `/clear` para iniciar uma nova conversa
- Ou troque para um modelo com contexto maior (ex: `qwen-long` suporta 1M tokens)

---

## Erros de servidor

### `Erro temporário do servidor` (HTTP 500 / 502 / 503 / 504)

**Causa:** Problema temporário na infraestrutura do provedor.

**Solução:**
- O agente tenta automaticamente (esses erros são marcados como retryáveis)
- Se persistir por mais de alguns minutos, verifique o status do provedor:
  - DashScope: [status.aliyun.com](https://status.aliyun.com)
  - DeepSeek: [status.deepseek.com](https://status.deepseek.com)

---

## Erros de sandbox

### `⚠ Executando sem sandbox Docker`

**Causa:** O Docker não está instalado ou não está em execução.

**Comportamento:** O agente continua funcionando, mas comandos bash rodam diretamente no host (sem isolamento).

**Solução (se quiser isolamento):**
1. Instale o Docker Desktop: [docs.docker.com/get-docker](https://docs.docker.com/get-docker/)
2. Inicie o Docker Desktop
3. Reinicie o ChinaCode

**Para desabilitar o aviso intencionalmente:**
```env
SANDBOX_ENABLED=false
```

---

## Erros de segurança

### `Acesso bloqueado: <arquivo> pode conter secrets`

**Causa:** O modelo tentou ler um arquivo protegido (`.env`, chaves SSH, certificados).

**Comportamento esperado:** O agente não lê o arquivo e informa ao modelo que o acesso foi bloqueado. Isso é uma proteção, não um bug.

---

### `⚠ Comando destrutivo detectado`

**Causa:** O modelo gerou um comando bash considerado destrutivo (ex: `rm -rf`, `DROP TABLE`, `git push --force`).

**Comportamento esperado:** O comando não é executado. O agente é informado para tentar uma abordagem alternativa.

**Se o comando for legítimo:**
Use `/approve` *(em desenvolvimento)* ou execute o comando manualmente fora do ChinaCode.

---

## Erros de instalação

### `Cannot find module 'chinacode'`

**Causa:** A instalação global não foi concluída ou o PATH não foi atualizado.

**Solução:**
```bash
npm install -g chinacode
# ou, a partir do código-fonte:
npm run build && npm link
```

### `Error: better-sqlite3 was compiled against a different version of Node.js`

**Causa:** O módulo nativo `better-sqlite3` foi compilado para uma versão diferente do Node.js.

**Solução:**
```bash
npm rebuild better-sqlite3
```

---

## Obtendo ajuda

Se o problema persistir, abra uma issue com:
- Saída completa do erro
- Versão do Node.js (`node --version`)
- Provedor e modelo configurados
- Sistema operacional
