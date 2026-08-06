# Revisar a entrega antes de integrar na main

## Objetivo

Revisar o trabalho concluído antes de commit, merge, push ou PR, usando o checklist definido em CLAUDE.md e os comandos confirmados no `package.json`.

## Gatilhos

- O usuário sinaliza que a tarefa está pronta e quer revisar antes de commitar ou abrir PR.

## Entradas

- `git status` e `git diff` do estado atual.
- [CLAUDE.md](../../../CLAUDE.md), seção "Checklist antes de finalizar uma tarefa".

## Etapas

1. Rodar `git status` e conferir se todos os arquivos alterados/novos pertencem ao escopo da tarefa.
2. Confirmar que nenhum arquivo sensível (`.env`, `.env.local`, credenciais) aparece staged ou seria incluído em um `git add`.
3. Percorrer o checklist de CLAUDE.md item a item:
   - Testou o caminho principal da feature no navegador?
   - Testou loading e erro?
   - Tipo alterado em `src/types/` — funções `normalize*` atualizadas?
   - Campo novo no modelo — valor padrão adicionado?
   - Lógica de salvamento alterada — `name_lower` ainda gerado corretamente?
   - `npm run test` e `npm run typecheck` rodados e sem erros?
   - Nenhuma chave/segredo do Firebase no código?
   - Estilos usam variáveis de `theme.css` em vez de valores hardcoded?
4. Revisar `git diff` em busca de mudanças incidentais (arquivos tocados sem relação com a tarefa).
5. Rodar `npm run test` e `npm run typecheck`; rodar `npm run build` quando a entrega for destinada a deploy.
6. Reportar o resultado ao usuário e obter aprovação explícita antes de qualquer commit, merge, push ou abertura de PR.

## Verificação

- Checklist de CLAUDE.md percorrido e reportado item a item.
- `git status` revisado, sem arquivos sensíveis.
- Escopo do diff corresponde à tarefa.
- `npm run test` e `npm run typecheck` aprovados.

## Condições de parada

- Checklist completo e aprovado pelo usuário.
- Item do checklist reprovado — reportar e não prosseguir para commit/push/PR até ser resolvido.
- Aprovação humana obtida antes de qualquer ação de commit, merge, push ou PR.

## Saída

- Checklist preenchido com o resultado de cada item.
- Lista de arquivos no diff e observação sobre qualquer um fora de escopo.
- Confirmação explícita da autorização para a ação externa solicitada.
