# Integração MCP

O ChinaCode CLI pode carregar servidores MCP definidos em `mcp-servers.json` e expor as ferramentas remotas como funções do agente.

## Habilitar

No `.env`:

```env
MCP_ENABLED=true
WORKSPACE_DIR=.
```

Ao iniciar, o CLI valida `mcp-servers.json`, interpola variáveis no formato `${VARIAVEL}` e registra cada ferramenta com namespace:

```text
mcp_<server>_<tool>
```

Esse namespace evita colisões entre servidores que tenham ferramentas com o mesmo nome.

## Servidor stdio

```json
{
	"servers": [
		{
			"name": "filesystem",
			"transport": "stdio",
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-filesystem", "${WORKSPACE_DIR}"]
		}
	]
}
```

## Servidor SSE

```json
{
	"servers": [
		{
			"name": "remote_docs",
			"transport": "sse",
			"url": "https://example.com/mcp/sse",
			"headers": {
				"Authorization": "Bearer ${DOCS_TOKEN}"
			}
		}
	]
}
```

## Servidores oficiais

O arquivo padrão inclui:

- `filesystem`
- `git`
- `postgres` desabilitado por padrão, requer `POSTGRES_CONNECTION_STRING`
- `brave_search` desabilitado por padrão, requer `BRAVE_API_KEY`

Para ativar um servidor desabilitado, remova `"disabled": true` e configure as variáveis necessárias.

## Falhas de inicialização

Se um servidor falhar, o CLI registra um aviso e continua carregando os demais. Isso permite manter integrações opcionais no mesmo arquivo sem bloquear o agente.
