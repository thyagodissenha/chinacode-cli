import * as path from 'node:path'

const BLOCKED_NAMES = new Set(['.env', '.git/config', 'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'])
const BLOCKED_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.credentials', '.pkcs12'])
const ENV_PATTERN = /^\.env\..+$/

export class SecretsGuard {
  constructor(private workspaceDir: string) {}

  checkPath(filePath: string): string | null {
    const resolved = path.resolve(filePath)
    const base = path.basename(resolved)
    const ext = path.extname(resolved)

    if (BLOCKED_NAMES.has(base)) {
      return `Acesso bloqueado: ${base} pode conter secrets`
    }

    if (ENV_PATTERN.test(base)) {
      return `Acesso bloqueado: ${base} pode conter secrets`
    }

    if (BLOCKED_EXTENSIONS.has(ext)) {
      return `Acesso bloqueado: arquivos ${ext} podem conter chaves privadas`
    }

    const normalizedPath = resolved.replace(/\\/g, '/')
    if (normalizedPath.includes('/.git/config')) {
      return `Acesso bloqueado: .git/config pode conter secrets`
    }

    return null
  }

  sanitizeContent(content: string): string {
    return content
      .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***MASKED***')
      .replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***MASKED***')
      .replace(/AKIA[A-Z0-9]{16}/g, 'AKIA***MASKED***')
      .replace(/Bearer\s+[a-zA-Z0-9._\-]{20,}/gi, 'Bearer ***MASKED***')
      .replace(/(password|passwd|secret|token)\s*=\s*\S+/gi, '$1=***MASKED***')
  }

  isDestructiveCommand(command: string): boolean {
    const lower = command.toLowerCase()
    const patterns = [
      'rm -rf',
      'rm -r ',
      'rmdir',
      'drop table',
      'drop database',
      'truncate table',
      'git push --force',
      'git push -f',
      'mkfs',
      'dd if=',
      'chmod 777',
      'chmod -r 777',
      'chmod -R 777',
    ]
    return patterns.some(p => lower.includes(p))
  }

  isOutsideWorkspace(filePath: string): boolean {
    const resolved = path.resolve(filePath)
    return !resolved.startsWith(this.workspaceDir)
  }
}
