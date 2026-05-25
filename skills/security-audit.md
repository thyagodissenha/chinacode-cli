# Security Audit

## Quando usar
Quando o usuário pedir auditoria de segurança, verificação de vulnerabilidades, ou "security review".

## Checklist
- [ ] Verificar inputs não sanitizados (SQL injection, command injection, XSS)
- [ ] Checar secrets hardcoded ou expostos em logs
- [ ] Avaliar autenticação e autorização em cada endpoint
- [ ] Verificar dependências com vulnerabilidades conhecidas (npm audit)
- [ ] Checar CORS, headers de segurança, rate limiting
- [ ] Validar que dados sensíveis não são logados

## Saída
Liste vulnerabilidades por severidade: Critical | High | Medium | Low
