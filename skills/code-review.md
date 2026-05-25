# Code Review

## Quando usar
Quando o usuário pedir revisão de código, análise de PR, ou "review".

## Checklist
- [ ] Verificar type safety e uso correto de TypeScript
- [ ] Identificar code smells: funções muito longas, duplicação, magic numbers
- [ ] Checar tratamento de erros e edge cases
- [ ] Avaliar performance: loops desnecessários, N+1, falta de cache
- [ ] Verificar segurança: injection, XSS, secrets expostos
- [ ] Confirmar testes adequados para o código revisado

## Formato de saída
Estruture o feedback em: Crítico | Importante | Sugestão
