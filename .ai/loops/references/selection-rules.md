# Regras de seleção

## Objetivo

Converter evidências do projeto em um conjunto pequeno de loops úteis. Evitar tanto ausência de controle quanto excesso de processo.

## Ordem de decisão

1. Ler `project.stage` no perfil.
2. Se o estágio for `not-started` ou `foundation`, aplicar `foundation.md`.
3. Identificar os objetivos expressos pelo usuário.
4. Mapear riscos e tarefas recorrentes.
5. Consultar `catalog.md`.
6. Pontuar cada candidato.
7. Selecionar normalmente entre 3 e 7 loops.
8. Definir verificadores, limites e condições de parada.

## Pontuação

Somar:

- `+3`: o usuário pediu explicitamente o fluxo.
- `+3`: existe comando, arquivo ou infraestrutura diretamente relacionado.
- `+2`: existe risco relevante que o fluxo reduz.
- `+2`: a tarefa já é recorrente ou há artefato que prova recorrência.
- `+1`: o fluxo protege documentação ou decisões aprovadas.

Subtrair:

- `-3`: depende de ferramenta ou serviço que não existe no projeto.
- `-2`: duplica outro loop ou uma verificação determinística existente.
- `-2`: o fluxo pertence apenas a uma possibilidade futura.
- `-1`: não existe critério verificável de conclusão.

Selecionar por padrão candidatos com 3 pontos ou mais. Documentar exceções.

## Quantidade

- Projeto novo: usar os loops de fundação, com apenas o próximo gate ativo.
- Projeto pequeno: 3 a 5 loops ativos.
- Projeto médio: 4 a 7 loops ativos.
- Monorepo ou sistema crítico: criar primeiro loops compartilhados; adicionar variações por pacote somente quando houver regras diferentes.

Nunca reproduzir a árvore completa de loop engineering sem necessidade.

## Tipos

- `turn-based`: uma passagem com retorno ao usuário.
- `goal-based`: continuar até um estado verificável.
- `time-based`: executar em agenda já autorizada.
- `proactive`: reagir a evento disponível.
- `auto-mode`: executar sem nova orientação dentro de limites muito claros.

Preferir `turn-based` para descoberta e gates. Preferir `goal-based` para implementação e correção com verificadores. Não usar `time-based`, `proactive` ou `auto-mode` sem infraestrutura e autorização correspondentes.

## Gatilhos

Gatilhos permitidos no registro:

- `manual`
- `file-change`
- `pr-open`
- `ci-fail`
- `new-issue`
- `schedule`

Registrar um gatilho não instala automação. Se não houver hook, CI ou agenda real, usar `manual`.

## Verificadores

Todo loop precisa de pelo menos um:

- critério documental;
- teste;
- lint;
- verificação de tipos;
- build;
- comparação de diff;
- revisão adversarial;
- validação visual;
- validação de dados;
- aprovação humana.

Comandos devem vir do perfil ou de documentação do projeto. Não inventar um comando para satisfazer o formato.

## Aprovação humana

Definir `approval_required: true` quando o loop puder:

- instalar ou remover dependências;
- mudar arquitetura;
- alterar dados ou schemas;
- acessar segredos;
- fazer commit, push ou abrir PR;
- fazer deploy ou publicar;
- modificar permissões;
- enviar mensagens ou criar itens em serviço externo;
- excluir ou sobrescrever conteúdo relevante.

## Orçamento

Usar como padrão:

- `max_iterations: 3`
- `max_files_changed: 20`
- `timeout_minutes: 30`

Ajustar para a realidade do projeto. Orçamento limita o ciclo, não autoriza ações.

## Condições de parada

Incluir sempre:

- objetivo atendido e verificadores aprovados;
- limite de tentativas atingido;
- ausência de informação necessária;
- conflito com documento aprovado;
- necessidade de nova permissão;
- risco de ação destrutiva;
- verificador indisponível.

## Ampliação

Adicionar um loop quando houver nova evidência. Desativar, em vez de apagar, quando a evidência deixar de existir. Registrar o motivo em `memory/decisions.md`.
