# Validar comportamento após deploy na Vercel

## Objetivo

Confirmar que uma build de produção/preview na Vercel se comporta como esperado, respeitando o fallback de SPA e sem erros de console, antes de considerar o deploy validado.

## Gatilhos

- O usuário pede para validar um deploy (preview ou produção) na Vercel.

## Entradas

- URL de preview ou produção fornecida pelo usuário.
- [vercel.json](../../../vercel.json) e [CLAUDE.md](../../../CLAUDE.md), seção "Fluxos principais"/"Observações".

## Etapas

1. Rodar `npm run build` localmente e confirmar que termina sem erros.
2. Abrir a URL de preview/produção fornecida pelo usuário.
3. Navegar para uma rota conhecida (ex.: `/personagens`, uma ficha existente) e confirmar carregamento correto.
4. Acessar diretamente uma rota profunda (ex.: recarregar a página em `/ficha/<id>`) para confirmar que o fallback de SPA do `vercel.json` funciona (não deve retornar 404).
5. Verificar o console do navegador em busca de erros novos.
6. Conferir que a autenticação (login) e o carregamento de fichas via Firestore funcionam na URL testada.

## Verificação

- `npm run build` concluído sem erros.
- Rotas conhecidas carregam corretamente.
- Rota profunda recarregada não retorna 404 (fallback SPA funcionando).
- Console do navegador sem erros novos.
- Login e carregamento de ficha funcionam na URL testada.

## Condições de parada

- Todos os itens de verificação aprovados.
- Limite de 2 tentativas atingido.
- Erro encontrado que exige mudança de código — encerrar este loop e abrir `bug-fix`.
- Promoção para produção pendente de aprovação humana explícita (este loop não promove deploys sozinho).

## Saída

- Resultado de `npm run build`.
- Lista de rotas testadas e resultado de cada uma.
- Erros de console encontrados, se houver.
- Confirmação explícita de que a promoção para produção (se aplicável) aguarda aprovação do usuário.
