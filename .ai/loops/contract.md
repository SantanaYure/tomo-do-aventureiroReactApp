# Contrato dos loops — Tomo do Aventureiro

## Fontes canônicas

1. Solicitação atual do usuário.
2. [CLAUDE.md](../../CLAUDE.md) — instruções do projeto, referência autoritativa sobre arquitetura, fluxos e cuidados.
3. `.ai/loops/registry.json` e os workflows referenciados.
4. Código, `firestore.rules`, `vercel.json` e demais configurações existentes.

Não existe pasta `docs/` com Briefing, PRD, Spec ou DAG neste projeto — ele já está em produção. `documentação.MD` é explicitamente legado (ver CLAUDE.md); nunca tratá-lo como fonte autoritativa. `tomo-do-aventureiro.md` é uma visão de produto para a futura Sala Online — descreve funcionalidade **ainda não implementada**; não usar como descrição do estado atual do código.

## Limites

- Trabalhar somente no escopo solicitado.
- Preservar alterações locais não relacionadas (ver `git status` antes de editar).
- Não ler nem expor `.env`, `.env.local` ou qualquer segredo do Firebase.
- Não inventar comandos, acessos ou resultados de verificação.
- Não remover as pastas e páginas vazias listadas em CLAUDE.md ("Diretórios e páginas vazias") sem confirmação — representam trabalho futuro planejado (Sala Online).

## Aprovação obrigatória

Exigir aprovação humana explícita para:

- commit, push, merge ou abertura de PR (o fluxo do projeto é `dev` → `main` via PR);
- deploy ou promoção para produção na Vercel;
- alteração de `firestore.rules` e o deploy correspondente (`firebase deploy --only firestore:rules`);
- mudança de arquitetura ou de dependências (`package.json`);
- qualquer alteração em `src/services/firebase.ts` ou `src/context/AuthContext.tsx`;
- ações destrutivas (exclusão de dados, remoção de coleções, hard reset de branch).

## Orçamento

- Máximo de 3 ciclos de correção por loop, salvo regra específica no `registry.json`.
- Parar quando o mesmo erro persistir sem nova evidência.

## Conclusão

Concluir um loop somente quando os critérios do workflow e do `verifiers/definition-of-done.md` forem atendidos. Registrar limitações e verificações indisponíveis (por exemplo, ausência de testes automatizados) em vez de presumir aprovação.
