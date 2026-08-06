# Alterar dados, normalização ou regras do Firestore com segurança

## Objetivo

Alterar o modelo de dados de fichas (tipos em `src/types/system/dnd/`), as funções `normalize*` dos stores, os valores padrão, ou `firestore.rules`, sem corromper fichas já salvas nem abrir uma brecha de acesso.

## Gatilhos

- Adição, remoção ou renomeação de campo em `CharacterSheet`, `MonsterSheet` ou tipos relacionados.
- Alteração em `characterSheetStore.ts`, `monsterSheetStore.ts`, `defaultCharacterSheet.ts` ou `firestore.rules`.

## Entradas

- Descrição da mudança de modelo pedida pelo usuário.
- [CLAUDE.md](../../../CLAUDE.md), seções "Modelo de dados e persistência", "Arquivos sensíveis" e "Riscos comuns".

## Etapas

1. Ler a função `normalize*` relevante (`normalizeCharacterSheet` ou `normalizeMonsterSheet`) antes de alterar o tipo.
2. Alterar o tipo em `src/types/system/dnd/`.
3. Atualizar a função `normalize*` correspondente para inicializar o campo novo com um valor padrão seguro (retrocompatibilidade com documentos antigos no Firestore).
4. Se o campo for parte de uma ficha nova, atualizar `defaultCharacterSheet.ts` ou `createDefaultMonsterSheet()`.
5. Confirmar que `name_lower` continua sendo gerado em toda operação de criação e salvamento.
6. Se a mudança envolve `firestore.rules`, editar o arquivo e sinalizar claramente que o deploy é manual (`firebase deploy --only firestore:rules`) — **não executar o deploy sem aprovação humana explícita**.
7. Adicionar ou atualizar testes de store/normalização para o dado novo e para documentos legados.
8. Rodar `npm run test` e `npm run typecheck`.
9. Testar manualmente no navegador: criar uma ficha nova e abrir uma ficha existente (dado antigo) para confirmar que o campo novo aparece com fallback correto.

## Verificação

- `npm run test` e `npm run typecheck` sem erros.
- Ficha nova salva corretamente com o campo novo.
- Ficha antiga (sem o campo novo) continua abrindo sem erro, com fallback aplicado pela normalização.
- `name_lower` presente após salvar.
- Nenhuma chave, token ou segredo do Firebase exposto no diff.
- Se `firestore.rules` foi alterado: mudança sinalizada como pendente de deploy manual, aprovação humana solicitada.

## Condições de parada

- Todos os itens de verificação atendidos.
- Limite de 3 tentativas atingido.
- Aprovação humana necessária antes de aplicar a mudança (este loop tem `approval_required: true`).
- Risco de corromper fichas existentes identificado e não resolvido — parar e reportar em vez de prosseguir.

## Saída

- Resumo do campo/mudança de modelo.
- Confirmação de que `normalize*` e o valor padrão foram atualizados.
- Resultado de `npm run test` e `npm run typecheck`.
- Indicação explícita se `firestore.rules` precisa de deploy manual (e que ele não foi executado sem aprovação).
