# Decisões

Registrar somente decisões reais. Não usar este arquivo como lista de ideias.

## Modelo

### AAAA-MM-DD - Título

- Contexto:
- Decisão:
- Evidência:
- Alternativas descartadas:
- Consequências:
- Aprovação necessária:

## Histórico

### 2026-07-30 - Criação do sistema de loops

- Contexto: projeto já em produção (React 19 + Vite + Firebase, deploy na Vercel), sem testes automatizados nem CI, com CLAUDE.md detalhado e histórico de git com fluxo `dev` → `main` via PR.
- Decisão: criar o sistema de loops em modo `criar` (não `fundar`/`planejar`), já que há base técnica e documentação aprovada (CLAUDE.md) suficiente para operar. Selecionados 6 loops: `feature-delivery`, `bug-fix`, `firebase-safety`, `doc-sync`, `pr-readiness`, `web-deploy`. Todos com gatilho `manual`, pois não há hooks, CI ou agenda real configurados no projeto.
- Evidência: `package.json` (scripts `dev`, `build`, `lint`, `preview`, sem `test`), 126 commits `feat:` e 8 commits `fix:` no histórico, `firebase.json`/`firestore.rules`/`vercel.json` presentes, CLAUDE.md seções "Arquivos sensíveis", "Riscos comuns" e "Checklist antes de finalizar uma tarefa", merge commits confirmando PRs de `dev` para `main`.
- Alternativas descartadas: `security-review` e `migration-safety` como loops separados — descartados por duplicar o que `firebase-safety` já cobre (regras do Firestore, segredos, normalização defensiva) sem ferramenta dedicada adicional. `accessibility-check` — descartado por evidência insuficiente (apenas uma menção em commit, sem ferramenta ou critério verificável no projeto). `code-review` como loop de PR externo — descartado em favor de `pr-readiness`, que usa o checklist já existente em CLAUDE.md em vez de duplicar processo.
- Consequências: qualquer novo risco (ex.: introdução de testes automatizados, CI, ou início da feature "Sala Online" descrita em `tomo-do-aventureiro.md`) deve disparar uma reavaliação do registro (`analyze_project.py` + `selection-rules.md`) para considerar novos loops (`test-gap`, `ci-recovery`, loops de fundação para a Sala Online).
- Aprovação necessária: nenhuma ação externa foi executada na criação deste sistema (apenas arquivos locais em `.ai/`, `.agents/` e `.claude/`).

### 2026-08-06 - Reavaliação após a entrega de fluidez e testes

- Contexto: a branch `feat/ux-fluidez` introduziu Vitest, Testing Library, 22 arquivos de teste, scripts `test`, `test:watch` e `typecheck`, além de mudanças relevantes de autosave, desempenho, teclado, foco e responsividade.
- Decisão: manter os IDs dos 6 loops existentes, atualizar seus verificadores para usar `npm run test` e `npm run typecheck`, retirar premissas antigas de ausência de testes e adicionar o loop `accessibility-check`. Todos permanecem com gatilho manual porque ainda não existe CI, hook ou agenda no repositório.
- Evidência: `package.json`, `vite.config.js`, arquivos `src/**/*.{test,spec}.{ts,tsx}`, em especial `src/test/acessibilidade.test.ts` e `src/test/motion.test.ts`; perfil factual regenerado por `.ai/loops/tools/analyze_project.py`.
- Alternativas descartadas: criar `test-gap` como loop independente, porque teste já é verificador transversal de `feature-delivery`, `bug-fix` e `firebase-safety`; criar `performance-check`, porque os testes atuais de render e divisão de rotas podem permanecer dentro do loop de entrega até existir uma rotina ou métrica de desempenho própria.
- Consequências: toda entrega deve rodar testes e typecheck; mudanças visuais com layout real continuam exigindo validação manual, pois jsdom não resolve layout nem media queries. O arquivo local não rastreado `tomo-do-aventureiro.md` foi preservado, mas não foi promovido a fonte canônica dos loops.
- Aprovação necessária: o usuário autorizou explicitamente a execução do processo e o merge na `main`; push e deploy não foram autorizados por esse pedido.
