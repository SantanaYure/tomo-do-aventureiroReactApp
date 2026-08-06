# Manter CLAUDE.md consistente com o estado real do projeto

## Objetivo

Garantir que CLAUDE.md continue descrevendo com precisão a estrutura, os fluxos e as decisões do projeto depois de uma mudança relevante, sem misturar estado real com a visão de produto ainda não implementada (`tomo-do-aventureiro.md`).

## Gatilhos

- Pedido explícito do usuário para atualizar a documentação.
- Uma pasta/página antes vazia (listada em CLAUDE.md como "não implementada") recebeu código real.
- Uma nova decisão arquitetural foi tomada durante outro loop.

## Entradas

- Diff da mudança que motivou a atualização.
- [CLAUDE.md](../../../CLAUDE.md) atual.

## Etapas

1. Identificar quais seções de CLAUDE.md descrevem a área alterada (estrutura do repositório, fluxos principais, modelo de dados, padrões de código).
2. Comparar o texto atual com o comportamento real do código após a mudança.
3. Atualizar apenas as seções afetadas — não reescrever CLAUDE.md inteiro.
4. Se uma pasta/página saiu do estado "vazia" listado na seção "Diretórios e páginas vazias", mover a entrada para a seção apropriada e remover da lista de vazias.
5. Não descrever como implementado nada que pertença à visão de produto em `tomo-do-aventureiro.md` (Sala Online) enquanto não houver código correspondente.

## Verificação

- Leitura cruzada: cada afirmação alterada em CLAUDE.md corresponde a um arquivo ou comportamento real no código.
- Nenhuma feature planejada (Sala Online, `session/`, `gameRoom/`) foi descrita como implementada.
- Nenhuma feature implementada ficou descrita como planejada/vazia.

## Condições de parada

- Seções afetadas revisadas e consistentes com o código.
- Limite de 2 tentativas atingido.
- Dúvida sobre se algo é comportamento real ou planejado — perguntar ao usuário em vez de assumir.

## Saída

- Lista de seções de CLAUDE.md alteradas.
- Resumo do que mudou no texto e por quê.
