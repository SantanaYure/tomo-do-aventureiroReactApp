# Manter a documentação operacional consistente com o projeto

## Objetivo

Garantir que CLAUDE.md, README.md e design.md continuem descrevendo com precisão a estrutura, os comandos, os fluxos e os padrões do projeto depois de uma mudança relevante.

## Gatilhos

- Pedido explícito do usuário para atualizar a documentação.
- Uma pasta/página antes vazia (listada em CLAUDE.md como "não implementada") recebeu código real.
- Scripts, testes, stack ou procedimentos de validação mudaram.
- Uma nova decisão arquitetural foi tomada durante outro loop.

## Entradas

- Diff da mudança que motivou a atualização.
- [CLAUDE.md](../../../CLAUDE.md), [README.md](../../../README.md) e [design.md](../../../design.md) atuais.

## Etapas

1. Identificar quais fontes documentam a área alterada (arquitetura e operação em CLAUDE.md, uso em README.md, critérios visuais em design.md).
2. Comparar o texto atual com o comportamento real do código após a mudança.
3. Atualizar apenas as seções afetadas — não reescrever documentos inteiros.
4. Se uma pasta/página saiu do estado "vazia" listado na seção "Diretórios e páginas vazias", mover a entrada para a seção apropriada e remover da lista de vazias.
5. Não descrever como implementada uma feature planejada enquanto não houver código correspondente.

## Verificação

- Leitura cruzada: cada afirmação alterada corresponde a um arquivo, script ou comportamento real no código.
- Nenhuma feature planejada (Sala Online, `session/`, `gameRoom/`) foi descrita como implementada.
- Nenhuma feature implementada ficou descrita como planejada/vazia.

## Condições de parada

- Seções afetadas revisadas e consistentes com o código.
- Limite de 2 tentativas atingido.
- Dúvida sobre se algo é comportamento real ou planejado — perguntar ao usuário em vez de assumir.

## Saída

- Lista de documentos e seções alterados.
- Resumo do que mudou no texto e por quê.
