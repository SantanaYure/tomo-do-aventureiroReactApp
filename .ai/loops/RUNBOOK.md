# Runbook — Loops do Tomo do Aventureiro

## Estado atual

Projeto ativo, em produção (React 19 + Vite + Firebase, deploy na Vercel). Não há fundação pendente: CLAUDE.md já é a documentação aprovada e faz o papel de fonte canônica de arquitetura, fluxos e cuidados. Não há testes automatizados nem CI configurados — toda verificação de comportamento é manual, no navegador.

## Loops ativos

| ID | Título | Tipo | Aprovação humana |
| --- | --- | --- | --- |
| `feature-delivery` | Entregar funcionalidade de ficha (PJ ou monstro) | goal-based | não (a implementação em si) |
| `bug-fix` | Corrigir bug em ficha, painel ou store | goal-based | não (a correção em si) |
| `firebase-safety` | Alterar dados, normalização ou regras do Firestore com segurança | goal-based | sim |
| `doc-sync` | Manter CLAUDE.md consistente com o estado real do projeto | goal-based | não |
| `pr-readiness` | Revisar diff antes de abrir PR de dev para main | turn-based | sim (para commit/push/PR) |
| `web-deploy` | Validar comportamento após deploy na Vercel | goal-based | sim (para promoção) |

Nenhum loop bloqueado. Não há gates de fundação ativos — este projeto não está em modo `fundar`/`planejar`.

## Exemplos de acionamento

- "Implemente esta funcionalidade usando o loop do projeto" → `feature-delivery`.
- "Corrija este bug: o contador de recursos não zera" → `bug-fix`.
- "Preciso adicionar um campo novo à ficha de monstro" → `feature-delivery` encadeando `firebase-safety`.
- "Revise antes de eu abrir a PR" → `pr-readiness`.
- "Confira se o deploy de preview ficou certo" → `web-deploy`.
- "Atualize o CLAUDE.md depois dessa mudança" → `doc-sync`.

## Como aprovar o próximo gate

Não aplicável — o projeto não está em fundação. Se uma iniciativa nova e ainda não iniciada (ex.: a Sala Online descrita em `tomo-do-aventureiro.md`) precisar de gates formais de Briefing/PRD/Spec/DAG antes de virar código, reativar o fluxo de fundação: ler `references/foundation.md` e criar os documentos em `docs/` antes de qualquer scaffold.

## Como atualizar os loops

1. Rodar `python3 .ai/loops/tools/analyze_project.py . --output .ai/loops/project-profile.json` a partir da raiz do projeto.
2. Comparar o novo perfil com o `project-profile.json` anterior (via `git diff`).
3. Ler `references/selection-rules.md` e `references/catalog.md`.
4. Alterar somente os loops afetados em `registry.json`; preservar IDs e notas manuais.
5. Registrar a mudança em `memory/decisions.md`.
6. Validar com `python3 .ai/loops/tools/validate_loops.py .`.

## Como validar

```bash
python3 .ai/loops/tools/validate_loops.py .
```

Corrigir todos os erros antes de considerar o sistema de loops pronto. Tratar avisos relevantes.

## Limitações conhecidas

- Não há testes automatizados nem CI: todas as verificações de comportamento dependem de execução manual (`npm run dev`, navegação manual, `npx tsc --noEmit`, `npm run lint`).
- O lint atual (`eslint.config.js`) cobre apenas `.js`/`.jsx`; erros de tipo em `.ts`/`.tsx` só aparecem via `npx tsc --noEmit`.
- O deploy de `firestore.rules` é sempre manual (Firebase CLI); nenhum loop o executa automaticamente.
- Gatilhos são todos `manual` — não há hooks, webhooks ou agenda real configurados neste projeto. Não instalar automação sem pedido explícito do usuário.
