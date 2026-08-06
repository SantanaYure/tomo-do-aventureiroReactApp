# Fundação progressiva

Usar este guia quando o projeto estiver em `not-started`, `foundation` ou quando o usuário pedir para começar do zero.

## Princípio

Fundar o projeto antes de implementar. Criar contexto, decisões, gates e loops suficientes para a fase atual. Ampliar a estrutura somente quando novas necessidades forem confirmadas.

## Estados

| Estado | Evidência | Próxima ação |
| --- | --- | --- |
| `not-started` | Diretório vazio ou somente arquivos administrativos | Criar fundação e redigir Briefing |
| `foundation` | Documentos existem, sem base técnica | Continuar o próximo gate documental |
| `scaffold` | Manifest ou estrutura técnica inicial, pouco código | Validar aprovações e completar base técnica |
| `active` | Código ou conteúdo operacional em uso | Selecionar loops operacionais |

## Sequência obrigatória

```text
Briefing aprovado
→ PRD aprovado
→ Spec aprovada
→ DAG aprovado
→ Scaffold autorizado
→ Implementação
```

Não pular gates. Não interpretar silêncio ou continuidade da conversa como aprovação.

## Perguntas mínimas

Reaproveitar o que já estiver na solicitação e perguntar somente o que faltar:

1. Qual é o nome provisório?
2. Que problema deve resolver?
3. Para quem?
4. Qual resultado define sucesso na primeira versão?
5. O que entra e o que não entra agora?
6. Quais restrições já são conhecidas?

Perguntar sobre stack, banco, hospedagem ou design apenas quando a resposta for necessária para a fase atual. Registrar opções futuras sem instalá-las ou tratá-las como decisão aprovada.

## Estrutura mínima inicial

```text
AGENTS.md
README.md
docs/
├── briefing.md
├── prd.md
├── spec.md
└── decisoes.md
.ai/
└── loops/
    ├── registry.json
    ├── project-profile.json
    ├── contract.md
    ├── RUNBOOK.md
    ├── workflows/
    ├── verifiers/
    ├── memory/
    ├── references/
    └── tools/
.agents/
└── skills/
    └── project-loops/
        └── SKILL.md
```

Criar `.claude/skills/project-loops/SKILL.md` como adaptador quando Claude Code estiver no escopo.

## Status dos documentos

Usar frontmatter:

```yaml
---
status: blocked
version: 0.1
depends_on:
  - briefing
---
```

Status permitidos:

- `draft`: conteúdo em construção.
- `awaiting-approval`: pronto para decisão do usuário.
- `approved`: aprovado explicitamente pelo usuário.
- `blocked`: depende de documento ou decisão anterior.
- `superseded`: substituído, mantido para histórico.

Somente o usuário pode promover um documento para `approved`. Registrar a aprovação em `docs/decisoes.md`.

## Conteúdo por gate

### Briefing

Definir:

- contexto;
- problema;
- público;
- objetivo;
- proposta inicial;
- escopo e fora de escopo;
- restrições;
- critérios de sucesso;
- dúvidas em aberto.

Ao concluir, usar `status: awaiting-approval` e parar.

### PRD

Começar somente com Briefing aprovado. Definir:

- objetivos do produto;
- usuários e necessidades;
- jornadas;
- requisitos funcionais;
- requisitos não funcionais;
- regras de negócio;
- critérios de aceitação;
- métricas;
- riscos;
- fases futuras claramente separadas.

Ao concluir, usar `status: awaiting-approval` e parar.

### Spec

Começar somente com PRD aprovado. Em software, definir arquitetura, stack, componentes, dados, integrações, segurança, testes, deploy e observabilidade. Em projetos não técnicos, usar Spec como especificação operacional: processo, papéis, artefatos, ferramentas, controles e verificação.

Não instalar dependências nem criar scaffold durante esta etapa.

Ao concluir, usar `status: awaiting-approval` e parar.

### DAG

Começar somente com Spec aprovada. Criar `docs/execucao/dag.md` com:

- tarefas pequenas e verificáveis;
- `blockedBy`;
- `blocks`;
- ondas de execução;
- critério de aceite;
- verificador;
- arquivos ou áreas previstas;
- condição de parada.

Mostrar o DAG completo antes de criar tickets externos. Ao concluir, usar `status: awaiting-approval` e parar.

### Scaffold

Começar somente com DAG aprovado e pedido explícito de implementação. Criar apenas a base aprovada:

- manifests;
- pastas;
- configurações;
- scripts;
- componentes ou módulos iniciais;
- testes mínimos;
- instruções de execução.

Não adicionar banco, dependências, serviços ou arquitetura futura somente porque foram mencionados no Briefing.

## Documentos condicionais

Adicionar quando houver evidência:

| Documento | Criar quando |
| --- | --- |
| `docs/regras-de-negocio.md` | Regras numerosas, críticas ou compartilhadas |
| `docs/design.md` | O projeto tiver interface ou linguagem visual |
| `docs/design-system.md` | Tokens, componentes e padrões precisarem de fonte própria |
| `docs/arquitetura.md` | A arquitetura superar o nível adequado para `spec.md` |
| `docs/dados.md` | Houver modelo de dados, métricas ou pipelines |
| `docs/seguranca.md` | Autenticação, dados sensíveis, pagamentos ou permissões |
| `docs/execucao/ondas/` | O DAG aprovado exigir detalhamento por onda |

Evitar documentos vazios criados apenas para completar uma árvore.

## Loops iniciais de fundação

Criar:

1. `foundation-briefing`
2. `foundation-prd`
3. `foundation-spec`
4. `foundation-dag`
5. `project-scaffold`
6. `doc-sync`

Ativar somente o loop do próximo gate. Manter os posteriores registrados como desativados ou bloqueados.

## Ampliação progressiva

Reavaliar os loops quando ocorrer pelo menos um destes eventos:

- aprovação de um gate;
- criação do scaffold;
- entrada de nova plataforma, integração ou tipo de entrega;
- inclusão de autenticação, pagamentos, dados sensíveis ou migrações;
- criação de CI, release ou deploy;
- repetição da mesma tarefa manual em duas ocasiões;
- falha recorrente que justifique um verificador próprio.

Atualizar apenas o necessário. Preservar decisões aprovadas e registrar qualquer mudança de arquitetura.
