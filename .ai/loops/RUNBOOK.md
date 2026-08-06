# Runbook — Loops do Tomo do Aventureiro

## Estado atual

Projeto ativo, em produção (React 19 + Vite + Firebase, deploy na Vercel). Não há fundação pendente: CLAUDE.md documenta arquitetura e cuidados, README.md documenta uso e comandos, e design.md define os critérios visuais. Há 22 arquivos de teste Vitest e scripts de teste, typecheck, lint e build; não há CI configurado, e comportamentos que dependem de layout real ou Firebase ainda exigem validação no navegador.

## Loops ativos

| ID | Título | Tipo | Aprovação humana |
| --- | --- | --- | --- |
| `feature-delivery` | Entregar funcionalidade de ficha (PJ ou monstro) | goal-based | não (a implementação em si) |
| `bug-fix` | Corrigir bug em ficha, painel ou store | goal-based | não (a correção em si) |
| `firebase-safety` | Alterar dados, normalização ou regras do Firestore com segurança | goal-based | sim |
| `doc-sync` | Manter a documentação operacional consistente com o projeto | goal-based | não |
| `accessibility-check` | Verificar acessibilidade e responsividade da interface | goal-based | não |
| `pr-readiness` | Revisar a entrega antes de integrar na main | turn-based | sim (para commit/merge/push/PR) |
| `web-deploy` | Validar comportamento após deploy na Vercel | goal-based | sim (para promoção) |

Nenhum loop bloqueado. Não há gates de fundação ativos — este projeto não está em modo `fundar`/`planejar`.

## Exemplos de acionamento

- "Implemente esta funcionalidade usando o loop do projeto" → `feature-delivery`.
- "Corrija este bug: o contador de recursos não zera" → `bug-fix`.
- "Preciso adicionar um campo novo à ficha de monstro" → `feature-delivery` encadeando `firebase-safety`.
- "Revise antes de eu abrir a PR" → `pr-readiness`.
- "Revise foco, teclado e responsividade desta tela" → `accessibility-check`.
- "Confira se o deploy de preview ficou certo" → `web-deploy`.
- "Atualize o CLAUDE.md depois dessa mudança" → `doc-sync`.

## Como aprovar o próximo gate

Não aplicável — o projeto não está em fundação. Se uma iniciativa nova e ainda não iniciada precisar de gates formais de Briefing/PRD/Spec/DAG antes de virar código, reativar o fluxo de fundação: ler `references/foundation.md` e criar os documentos em `docs/` antes de qualquer scaffold.

## Como atualizar os loops

1. Rodar `py -3 .ai/loops/tools/analyze_project.py . --output .ai/loops/project-profile.json` no Windows ou o equivalente `python3` a partir da raiz do projeto.
2. Comparar o novo perfil com o `project-profile.json` anterior (via `git diff`).
3. Ler `references/selection-rules.md` e `references/catalog.md`.
4. Alterar somente os loops afetados em `registry.json`; preservar IDs e notas manuais.
5. Registrar a mudança em `memory/decisions.md`.
6. Validar com `py -3 .ai/loops/tools/validate_loops.py .` no Windows ou `python3` em ambientes Unix.

## Como validar

```bash
py -3 .ai/loops/tools/validate_loops.py .
```

Corrigir todos os erros antes de considerar o sistema de loops pronto. Tratar avisos relevantes.

## Limitações conhecidas

- Não há CI: os comandos `npm run test`, `npm run typecheck`, `npm run lint` e `npm run build` precisam ser executados localmente antes da integração.
- O lint atual (`eslint.config.js`) cobre apenas `.js`/`.jsx`; os arquivos `.ts`/`.tsx` são verificados pelo TypeScript e pelo Vitest, não pelo ESLint.
- O jsdom não valida layout real, media queries nem a integração autenticada com o Firebase; mudanças nessas áreas exigem roteiro manual no navegador.
- O deploy de `firestore.rules` é sempre manual (Firebase CLI); nenhum loop o executa automaticamente.
- Gatilhos são todos `manual` — não há hooks, webhooks ou agenda real configurados neste projeto. Não instalar automação sem pedido explícito do usuário.
