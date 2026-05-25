# Ferramentas Nativas

O ChinaCode disponibiliza 7 ferramentas que o modelo pode chamar automaticamente para interagir com o sistema de arquivos e executar comandos.

Todas as ferramentas de arquivo resolvem caminhos relativos em relação ao diretório de trabalho (`WORKSPACE_DIR`).

---

## `read_file`

Lê o conteúdo de um arquivo com numeração de linhas.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | sim | Caminho do arquivo |
| `offset` | number | não | Linha inicial (0-based, padrão: 0) |
| `limit` | number | não | Máximo de linhas (padrão: 2000) |

**Exemplo de saída:**
```
1	import { foo } from './foo.js'
2	
3	export function bar() {
4	  return foo()
5	}
```

**Restrições de segurança:** Arquivos bloqueados: `.env`, `.env.*`, `id_rsa`, `id_ed25519`, `.pem`, `.key`, `.p12`, `.git/config`.

---

## `write_file`

Cria ou sobrescreve um arquivo. Cria diretórios intermediários automaticamente.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | sim | Caminho de destino |
| `content` | string | sim | Conteúdo completo do arquivo |

> Sempre mostra um diff e pede aprovação antes de escrever (a menos que `AUTO_APPROVE=true`).

---

## `edit_file`

Substitui uma string exata e única dentro de um arquivo — cirurgicamente, sem reescrever o arquivo inteiro.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | sim | Caminho do arquivo |
| `old_text` | string | sim | Texto exato a ser substituído (deve ocorrer exatamente 1 vez) |
| `new_text` | string | sim | Texto de substituição |

**Erros possíveis:**
- `Nenhuma ocorrência encontrada` — `old_text` não existe no arquivo
- `N ocorrências encontradas (ambíguo)` — use um trecho maior e mais específico

---

## `glob_search`

Encontra arquivos pelo nome usando padrões glob.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pattern` | string | sim | Padrão glob (ex: `*.ts`, `**/*.test.ts`) |

**Exemplos:**
- `*.ts` — todos os arquivos TypeScript no projeto
- `*.test.ts` — todos os arquivos de teste
- `*.md` — todos os arquivos Markdown

> Ignora `node_modules` e `.git` automaticamente. Retorna no máximo 500 resultados.

---

## `grep_search`

Busca um padrão regex no conteúdo dos arquivos, recursivamente.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `pattern` | string | sim | Expressão regular |
| `path` | string | não | Diretório de busca (padrão: `.`) |

**Saída:**
```
src/agent/loop.ts:58:  async run(userInput: string): Promise<void> {
src/models/router.ts:10:  select(userInput: string): ModelConfig {
```

> Ignora arquivos binários e `node_modules`. Retorna no máximo 100 resultados.

---

## `list_directory`

Lista arquivos e diretórios em um caminho.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `path` | string | sim | Diretório a listar |
| `recursive` | boolean | não | Listar recursivamente até 3 níveis (padrão: false) |

**Saída:**
```
src/
  agent/
    loop.ts (4.2KB)
  cost/
    tracker.ts (1.8KB)
README.md (2.1KB)
package.json (1.1KB)
```

---

## `bash`

Executa um comando shell e retorna stdout + stderr.

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `command` | string | sim | Comando shell |
| `timeout` | number | não | Timeout em ms (padrão: 60000) |

**Com sandbox Docker ativo (`SANDBOX_ENABLED=true`):**
- Executa dentro de um container `alpine:latest`
- Sem acesso à rede (`--network none`)
- Limite de memória: 512MB
- Limite de CPU: 1 core
- Workspace montado em `/workspace`

**Sem Docker:** executa diretamente no shell do host.

**Restrições de segurança:** Comandos bloqueados: `rm -rf`, `rm -r`, `rmdir`, `DROP TABLE`, `DROP DATABASE`, `git push --force`, `git push -f`, `mkfs`, `dd if=`, `chmod 777`.
