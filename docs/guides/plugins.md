# Plugins

Plugins locais permitem declarar metadados, comandos e ferramentas compatíveis com o ChinaCode CLI sem executar código durante a descoberta.

## Estrutura

```text
plugins/
└── example-plugin/
    └── plugin.json
```

## Manifesto mínimo

```json
{
	"name": "example-plugin",
	"version": "0.1.0",
	"description": "Plugin de exemplo",
	"commands": [],
	"tools": []
}
```

## Comandos

```json
{
	"name": "example:hello",
	"description": "Mostra uma resposta de exemplo",
	"usage": "/example:hello <nome>"
}
```

## Ferramentas

Ferramentas são declaradas com JSON Schema. O loader valida o contrato, mas não importa nem executa o entrypoint do plugin.

```json
{
	"name": "example_echo",
	"description": "Ecoa uma mensagem",
	"parameters": {
		"type": "object",
		"properties": {
			"message": {
				"type": "string"
			}
		},
		"required": ["message"]
	}
}
```

## Regras de validação

- `name` do plugin usa letras minúsculas, números, `.`, `_` e `-`
- comandos usam letras minúsculas, números, `:`, `_` e `-`
- ferramentas usam nomes compatíveis com function calling
- nomes duplicados dentro do mesmo manifesto são rejeitados
- JSON inválido ou manifesto inválido vira erro estruturado sem interromper o CLI
