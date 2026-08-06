# Verificar acessibilidade e responsividade da interface

## Objetivo

Confirmar que uma mudança de interface preserva navegação por teclado, foco visível, semântica dos controles, preferência por movimento reduzido e uso nos breakpoints afetados.

## Gatilhos

- Pedido de revisão de acessibilidade, teclado ou responsividade.
- Mudança em componentes interativos, navegação, modais, formulários ou CSS de layout.

## Entradas

- Diff dos componentes e estilos afetados.
- Critérios visuais de `design.md` e tokens de `src/styles/theme.css`.
- Testes existentes em `src/test/acessibilidade.test.ts`, `src/test/motion.test.ts` e nos componentes afetados.

## Etapas

1. Mapear os fluxos interativos e breakpoints alterados.
2. Conferir elemento semântico, nome acessível, ordem de foco, operação por teclado e retorno de foco quando aplicável.
3. Confirmar foco visível e ausência de diferenciação baseada apenas em cor.
4. Conferir responsividade e `prefers-reduced-motion` nos estilos afetados.
5. Adicionar ou atualizar testes automatizados para invariantes verificáveis sem layout real.
6. Rodar `npm run test` e `npm run typecheck`.
7. Quando a mudança depender de layout ou comportamento real do navegador, validar manualmente os breakpoints e o fluxo por teclado.

## Verificação

- `npm run test` e `npm run typecheck` sem erros.
- Fluxo principal utilizável apenas por teclado, com foco sempre visível.
- Controles com semântica e nomes acessíveis coerentes.
- Layout sem corte ou transbordamento nos breakpoints afetados.
- Movimento reduzido respeitado quando houver animação ou transição.

## Condições de parada

- Verificações automatizadas e manuais aplicáveis aprovadas.
- Limite de 3 tentativas atingido.
- Referência visual ou comportamento esperado ausente e necessário para decidir.
- Validação real de navegador indisponível; registrar o risco e o roteiro manual pendente.

## Saída

- Fluxos, breakpoints e critérios verificados.
- Resultado dos comandos executados.
- Problemas encontrados, correções aplicadas e validações manuais pendentes.
