## O que muda

<!-- Resumo curto da mudança e do porquê. -->

## Tipo

- [ ] Correção de bug
- [ ] Nova funcionalidade / alteração de comportamento
- [ ] Refatoração / ajuste de estilo
- [ ] Infra / CI / docs

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build` passam localmente
- [ ] Testes adicionados/atualizados quando o comportamento mudou
- [ ] Se mexeu em tipo de ficha / `normalize*` / `firestore.rules`: valores padrão e fallbacks conferidos (ver CLAUDE.md)
- [ ] Nenhuma credencial/secret no diff
- [ ] Preview da Vercel conferido no navegador (caminho principal, loading e erro)

## Como testar

<!-- Passos para o revisor validar no Preview. -->

---

Base: PRs de feature vão para `develop` (homologação); `develop` → `main` promove para produção.
