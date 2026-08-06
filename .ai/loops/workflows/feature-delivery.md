# Entregar funcionalidade de ficha (PJ ou monstro)

## Objetivo

Implementar uma funcionalidade nova ou uma alteração de comportamento em uma ficha (personagem, monstro ou NPC), painel ou fluxo de salvamento, seguindo os padrões já estabelecidos em CLAUDE.md.

## Gatilhos

- Pedido explícito do usuário para implementar, adicionar ou alterar uma funcionalidade.

## Entradas

- Descrição da funcionalidade pedida pelo usuário.
- [CLAUDE.md](../../../CLAUDE.md), seções "Estrutura do repositório", "Padrões de código" e "Modelo de dados e persistência".

## Etapas

1. Ler CLAUDE.md e localizar o componente, painel, hook ou store relevante antes de editar.
2. Confirmar se a mudança afeta um tipo em `src/types/system/dnd/` — se afetar, este loop deve encadear `firebase-safety` para tratar normalização e valores padrão.
3. Implementar a menor mudança necessária, seguindo os padrões de nomenclatura, CSS Modules e tokens de `theme.css` já em uso.
4. Adicionar ou atualizar testes Vitest para os critérios verificáveis da mudança.
5. Rodar `npm run test` e corrigir regressões introduzidas.
6. Rodar `npm run typecheck` e corrigir erros de tipo introduzidos.
7. Rodar `npm run lint` (cobre apenas `.js`/`.jsx`; não substitui os testes nem a checagem de tipos).
8. Se a mudança envolve UI ou integração com o Firestore, iniciar `npm run dev` e testar manualmente o caminho principal no navegador.
9. Registrar resultado, arquivos alterados e qualquer pendência.

## Verificação

- Testes Vitest relevantes aprovados.
- Teste manual no navegador do caminho principal da funcionalidade quando a mudança depender de UI ou serviço externo.
- Teste manual dos estados de loading e erro, quando aplicável.
- `npm run typecheck` sem erros novos.
- `npm run lint` sem erros novos (apenas `.js`/`.jsx`).
- Revisão do checklist "Checklist antes de finalizar uma tarefa" em CLAUDE.md.

## Condições de parada

- Funcionalidade validada manualmente e verificadores acima aprovados.
- Limite de 3 tentativas de correção atingido.
- Falta informação sobre o comportamento esperado (perguntar ao usuário em vez de assumir).
- Conflito com uma decisão arquitetural já assumida em CLAUDE.md (ex.: introduzir uma lib de estilo além de CSS Modules).

## Saída

- Resumo do que foi implementado.
- Evidências de verificação (testes automatizados, validação manual aplicável, typecheck e lint).
- Lista de arquivos alterados.
- Pendências: por exemplo, necessidade de atualizar CLAUDE.md (loop `doc-sync`) ou de rodar `pr-readiness` antes de abrir PR.
