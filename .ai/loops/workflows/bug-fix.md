# Corrigir bug em ficha, painel ou store

## Objetivo

Corrigir um comportamento incorreto reportado pelo usuário (ex.: cálculo errado, estado não persistindo, controle que não respeita limites) sem introduzir regressão em fluxos vizinhos.

## Gatilhos

- Pedido explícito do usuário para corrigir um bug, ou relato de comportamento inesperado.

## Entradas

- Descrição do bug e, quando possível, passos para reproduzir.
- Componente, hook ou store afetado.

## Etapas

1. Reproduzir o bug localmente (`npm run dev`) antes de alterar qualquer código.
2. Localizar a causa raiz lendo o componente, hook ou store relevante — usar `git log`/`git blame` se precisar entender uma mudança recente relacionada.
3. Criar ou ajustar um teste de regressão que falhe antes da correção, quando o comportamento puder ser isolado no Vitest.
4. Aplicar a correção mínima necessária, sem refatorar código não relacionado ao bug.
5. Confirmar que o bug não ocorre mais, repetindo os mesmos passos de reprodução.
6. Verificar rapidamente fluxos vizinhos que dependem do mesmo estado (ex.: se corrigiu `ManagedResourceControls`, conferir `SpellsPanel` e `ResourcesPanel`).
7. Rodar `npm run test` e `npm run typecheck`.

## Verificação

- Bug reproduzido antes da correção.
- Bug não reproduzido depois da correção, testado manualmente no navegador.
- Teste de regressão aprovado quando o comportamento for automatizável.
- `npm run test` e `npm run typecheck` sem erros.
- Nenhuma regressão perceptível nos fluxos vizinhos verificados no passo 5.

## Condições de parada

- Bug corrigido e verificado manualmente.
- Limite de 3 tentativas de correção atingido.
- Causa raiz não identificada com a informação disponível — reportar ao usuário em vez de aplicar uma correção especulativa.
- Correção exigiria alterar `characterSheetStore.ts`, `monsterSheetStore.ts` ou `firestore.rules` — nesse caso, encadear o loop `firebase-safety`.

## Saída

- Resumo da causa raiz e da correção aplicada.
- Passos de reprodução usados antes/depois.
- Resultado de `npm run test` e `npm run typecheck`.
- Arquivos alterados.
