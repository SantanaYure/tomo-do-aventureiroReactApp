# Catálogo de loops

Usar como biblioteca de padrões. Personalizar nomes, etapas e verificadores ao projeto. Não selecionar todos.

## Fundação

| ID | Usar quando | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `foundation-briefing` | Projeto novo e Briefing não aprovado | `turn-based` | Campos essenciais preenchidos e aprovação humana |
| `foundation-prd` | Briefing aprovado e PRD pendente | `turn-based` | Requisitos rastreáveis ao Briefing |
| `foundation-spec` | PRD aprovado e Spec pendente | `turn-based` | Arquitetura ou operação cobre requisitos |
| `foundation-dag` | Spec aprovada e plano executável pendente | `turn-based` | Dependências, ondas e aceite completos |
| `project-scaffold` | DAG aprovado e implementação autorizada | `goal-based` | Estrutura executa e verificações mínimas passam |
| `doc-sync` | Documentação deve acompanhar mudanças | `goal-based` | Diff e fontes canônicas consistentes |

## Desenvolvimento de software

| ID | Sinais | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `feature-delivery` | Backlog, rotas, módulos ou pedidos de funcionalidades | `goal-based` | Critérios de aceite, testes e build |
| `bug-fix` | Issues, regressões ou testes falhando | `goal-based` | Reprodução antes, teste de regressão depois |
| `refactor-pass` | Dívida confirmada, duplicação ou complexidade | `goal-based` | Comportamento preservado e diff limitado |
| `test-gap` | Código sem testes ou cobertura crítica ausente | `goal-based` | Casos relevantes e suíte aprovada |
| `code-review` | PRs ou revisão manual recorrente | `turn-based` | Diff sanity e regras do projeto |
| `ci-recovery` | Pipeline existente com falhas | `goal-based` | Falha reproduzida e CI correspondente aprovado |
| `pr-triage` | Volume de PRs ou feedback de revisão | `turn-based` | Itens classificados e ações rastreáveis |
| `dependency-watch` | Dependências e rotina de atualização | `time-based` | Compatibilidade, testes e análise de risco |
| `release-readiness` | Releases, lojas, tags ou deploy formal | `goal-based` | Checklist, build e aprovação humana |

## Qualidade e risco

| ID | Sinais | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `security-review` | Auth, permissões, segredos, pagamentos ou dados sensíveis | `goal-based` | Checklist de ameaça e testes aplicáveis |
| `performance-check` | Metas de tempo, bundle, carga ou Lighthouse | `goal-based` | Métrica antes e depois |
| `accessibility-check` | Interface de usuário | `goal-based` | Teclado, semântica, contraste e ferramenta disponível |
| `diff-sanity` | Mudanças amplas ou risco de alteração incidental | `turn-based` | Escopo do diff e arquivos inesperados |
| `visual-regression` | UI com referência ou screenshots | `goal-based` | Comparação visual nos breakpoints definidos |
| `api-contract` | API pública, schema ou consumidores múltiplos | `goal-based` | Contrato, compatibilidade e testes |
| `migration-safety` | Migrações de banco ou dados | `goal-based` | Plano reversível e validação em ambiente seguro |

## Plataformas

| ID | Sinais | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `firebase-safety` | `firebase.json`, regras ou SDK Firebase | `goal-based` | Regras, emulador quando disponível e proteção de dados |
| `mobile-release` | React Native, Expo, Flutter, Android ou iOS | `goal-based` | Build alvo, permissões e checklist de loja |
| `web-deploy` | Vercel, Netlify, servidor web ou hosting | `goal-based` | Preview, navegação, console e responsividade |
| `design-sync` | Design system, Figma, tokens ou protótipo | `goal-based` | Comparação com fonte visual e tokens |
| `monorepo-impact` | Workspaces, apps ou packages | `turn-based` | Dependentes afetados e testes seletivos |

## Dados e IA

| ID | Sinais | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `data-quality` | CSV, pipelines, notebooks ou banco analítico | `goal-based` | Schema, nulos, duplicatas e invariantes |
| `experiment-run` | Notebook, hipótese ou treino de modelo | `goal-based` | Experimento reproduzível e métricas registradas |
| `model-evaluation` | Modelo, prompt ou agente em produção | `goal-based` | Dataset de avaliação e critérios definidos |
| `dataset-drift` | Dados periódicos ou produção de ML | `time-based` | Comparação estatística e limiares |
| `notebook-to-pipeline` | Notebook virou processo recorrente | `goal-based` | Execução não interativa e resultados equivalentes |

## Conteúdo, pesquisa e operação

| ID | Sinais | Tipo padrão | Verificação principal |
| --- | --- | --- | --- |
| `research-sweep` | Pesquisa recorrente com fontes | `goal-based` | Cobertura, atualidade e citações |
| `content-production` | Calendário editorial ou produção repetida | `goal-based` | Briefing, tom, revisão e aprovação |
| `fact-check` | Conteúdo factual ou sensível | `turn-based` | Fontes primárias e divergências registradas |
| `asset-production` | Imagens, apresentações ou documentos recorrentes | `goal-based` | Especificação e inspeção visual |
| `inbox-triage` | Caixa de entrada ou fila conectada | `turn-based` | Classificação e nenhuma ação externa sem aprovação |
| `decision-review` | Decisões periódicas ou governança | `time-based` | Decisões vencidas, riscos e próximos responsáveis |

## Combinações comuns

### Projeto web pequeno

`feature-delivery`, `bug-fix`, `doc-sync`, `accessibility-check`, `web-deploy`

### React Native com Firebase

`feature-delivery`, `bug-fix`, `firebase-safety`, `mobile-release`, `doc-sync`

### Projeto de dados

`data-quality`, `experiment-run`, `model-evaluation`, `doc-sync`

### Projeto editorial

`research-sweep`, `content-production`, `fact-check`, `doc-sync`

### Projeto novo

Loops de fundação registrados; somente o próximo gate permanece ativo.
