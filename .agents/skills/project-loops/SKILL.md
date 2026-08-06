---
name: project-loops
description: Roteia e executa os fluxos de IA definidos para tomo-do-aventureiro. Usar quando o usuário pedir para trabalhar neste projeto, executar um loop, validar uma entrega ou atualizar os fluxos conforme o projeto evolui.
---

# Loops do projeto

Usar `.ai/loops/` como fonte canônica dos fluxos deste projeto.

## Antes de trabalhar

1. Ler `.ai/loops/contract.md`.
2. Ler `.ai/loops/registry.json`.
3. Ler o workflow selecionado em `.ai/loops/workflows/`.
4. Ler `.ai/loops/verifiers/definition-of-done.md`.
5. Conferir `CLAUDE.md` na raiz do repositório — é a documentação aprovada e a fonte canônica de arquitetura e padrões deste projeto (não há pasta `docs/` com Briefing/PRD/Spec/DAG; o projeto já está em produção).

## Roteamento

1. Comparar o pedido com `trigger.examples`, evidências e estágio no `registry.json`.
2. Escolher um único loop principal:
   - `feature-delivery` — nova funcionalidade ou alteração de comportamento.
   - `bug-fix` — corrigir um comportamento incorreto.
   - `firebase-safety` — mudar tipos de ficha, funções `normalize*` ou `firestore.rules`.
   - `doc-sync` — manter CLAUDE.md, README.md e design.md consistentes após uma mudança.
   - `accessibility-check` — revisar teclado, foco, semântica e responsividade.
   - `pr-readiness` — revisar o diff antes de commit/push/PR.
   - `web-deploy` — validar um deploy de preview/produção na Vercel.
3. Combinar outro loop apenas quando houver dependência explícita (ex.: `feature-delivery` que altera o modelo de dados encadeia `firebase-safety`).
4. Informar em uma frase qual loop será usado.
5. Respeitar orçamento, aprovações e condições de parada definidos em cada loop.

Se nenhum loop corresponder, não improvisar um processo permanente. Executar uma tarefa simples dentro das regras do projeto (CLAUDE.md + `contract.md`) ou atualizar os loops quando o usuário pedir.

## Fundação (não ativa hoje)

Este projeto não está em modo de fundação: já existe base técnica e documentação aprovada (CLAUDE.md). Não há gates de Briefing/PRD/Spec/DAG registrados no `registry.json`.

Se uma iniciativa nova e ainda não iniciada precisar desse rigor, ler `.ai/loops/references/foundation.md` antes de escrever qualquer código para essa iniciativa e seguir a sequência:

```text
Briefing aprovado
→ PRD aprovado
→ Spec aprovada
→ DAG aprovado
→ Scaffold autorizado
→ Implementação
```

Não aprovar documentos em nome do usuário. Não instalar dependências nem implementar antes do gate correspondente.

## Atualização dos loops

Quando o usuário pedir para ampliar, atualizar ou reavaliar:

1. Executar `.ai/loops/tools/analyze_project.py`.
2. Comparar o novo perfil com `.ai/loops/project-profile.json`.
3. Ler `.ai/loops/references/selection-rules.md`.
4. Ler `.ai/loops/references/foundation.md` somente se a mudança envolver uma iniciativa nova ainda não iniciada.
5. Consultar `.ai/loops/references/catalog.md`.
6. Alterar somente os loops afetados.
7. Preservar decisões e aprovações já registradas.
8. Executar `.ai/loops/tools/validate_loops.py`.
9. Atualizar `.ai/loops/RUNBOOK.md` e `.ai/loops/memory/decisions.md`.

## Limites

Pedir aprovação antes de commit, merge, push, PR, deploy, publicação, instalação de dependências, mudança de arquitetura, acesso a segredos, alteração de dados/schema (Firestore), integração externa ou ação destrutiva — ver `.ai/loops/contract.md`.
