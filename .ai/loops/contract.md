# Contrato dos loops — Tomo do Aventureiro

## Fontes canônicas

1. Solicitação atual do usuário.
2. [CLAUDE.md](../../CLAUDE.md) — instruções e referência de arquitetura; [README.md](../../README.md) — uso e comandos; [design.md](../../design.md) — critérios visuais.
3. `.ai/loops/registry.json` e os workflows referenciados.
4. Código, testes, `package.json`, `firestore.rules`, `vercel.json` e demais configurações existentes.

Não existe pasta `docs/` com Briefing, PRD, Spec ou DAG neste projeto — ele já está em produção. `documentação.MD` é explicitamente legado (ver CLAUDE.md); nunca tratá-lo como fonte autoritativa. Arquivos locais não rastreados podem fornecer contexto, mas não se tornam fonte canônica sem inclusão deliberada no repositório.

## Limites

- Trabalhar somente no escopo solicitado.
- Preservar alterações locais não relacionadas (ver `git status` antes de editar).
- Não ler nem expor `.env`, `.env.local` ou qualquer segredo do Firebase.
- Não inventar comandos, acessos ou resultados de verificação.
- Não remover as pastas e páginas vazias listadas em CLAUDE.md ("Diretórios e páginas vazias") sem confirmação — representam trabalho futuro planejado (Sala Online).

## Aprovação obrigatória

Exigir aprovação humana explícita para:

- commit, push, merge ou abertura de PR;
- deploy ou promoção para produção na Vercel;
- alteração de `firestore.rules` e o deploy correspondente (`firebase deploy --only firestore:rules`);
- mudança de arquitetura ou de dependências (`package.json`);
- qualquer alteração em `src/services/firebase.ts` ou `src/context/AuthContext.tsx`;
- ações destrutivas (exclusão de dados, remoção de coleções, hard reset de branch).

## Orçamento

- Máximo de 3 ciclos de correção por loop, salvo regra específica no `registry.json`.
- Parar quando o mesmo erro persistir sem nova evidência.

## Conclusão

Concluir um loop somente quando os critérios do workflow e do `verifiers/definition-of-done.md` forem atendidos. Registrar limitações e verificações indisponíveis (por exemplo, dependência de validação visual ou de um serviço externo) em vez de presumir aprovação.
