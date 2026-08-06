# Definition of Done — Tomo do Aventureiro

## Obrigatório

- O objetivo pedido pelo usuário foi atendido.
- O escopo do diff foi revisado (`git status` / `git diff`) e não contém arquivos fora do pedido.
- `npm run test` e `npm run typecheck` foram executados e aprovados.
- CLAUDE.md foi verificado quanto a impacto — atualizado via loop `doc-sync` quando necessário.
- Nenhum segredo (`.env`, `.env.local`, chave Firebase) está presente no diff.
- As evidências de verificação (o que foi testado e o resultado) foram registradas na resposta ao usuário.

## Condicional

- Testes relevantes foram adicionados ou atualizados quando o comportamento mudou.
- `npm run lint` aprovado quando a mudança tocar arquivos `.js`/`.jsx` (o lint atual não cobre `.ts`/`.tsx`).
- `npm run build` aprovado quando a mudança for validada para deploy (loop `web-deploy`).
- Teste manual no navegador do caminho principal, do loading e do erro, quando a mudança afeta UI ou dados carregados do Firestore.
- Funções `normalize*` e valores padrão atualizados quando um tipo em `src/types/system/dnd/` mudar (loop `firebase-safety`).
- `firestore.rules` sinalizado como pendente de deploy manual quando alterado — nunca deployado sem aprovação.

## Aprovação humana

Confirmar separadamente, antes de executar:

- commit, push, merge ou abertura de PR;
- deploy ou promoção de build na Vercel;
- deploy de `firestore.rules`;
- mudança de arquitetura ou de dependências em `package.json`;
- qualquer edição em `src/services/firebase.ts` ou `src/context/AuthContext.tsx`;
- remoção de pastas/páginas vazias listadas em CLAUDE.md como planejadas.

## Bloqueios

Se uma verificação não puder ser executada (ex.: não há como testar no navegador ou acessar o Firebase no ambiente atual), registrar:

- o motivo pelo qual não foi possível verificar;
- o risco que permanece sem essa verificação;
- a próxima ação recomendada (ex.: "usuário deve testar X manualmente antes de mergear").

Nunca declarar uma verificação como aprovada sem tê-la executado.
