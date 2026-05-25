# Test Generation

## Quando usar
Quando o usuário pedir para criar testes, escrever specs, ou "adicionar cobertura".

## Checklist
- [ ] Cobrir o happy path com assertions claras
- [ ] Testar edge cases: null, undefined, array vazio, strings vazias
- [ ] Testar casos de erro e exceções esperadas
- [ ] Usar nomes descritivos: "should X when Y"
- [ ] Evitar mocks desnecessários — testar comportamento real quando possível
- [ ] Verificar que cada teste é independente (sem estado compartilhado)

## Padrão
Use vitest. Agrupe com describe(), use beforeEach para setup.
