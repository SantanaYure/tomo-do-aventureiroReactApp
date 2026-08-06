// Critério: fluidez na entrada do app.
//
// As páginas de ficha concentram a maior parte do código (todos os painéis).
// Enquanto todas as rotas eram importadas de uma vez, o primeiro carregamento
// baixava 960 KB antes de mostrar qualquer coisa; com as rotas pesadas sob
// demanda, o pacote inicial caiu para 690 KB.
//
// Um `import` estático descuidado em App.tsx desfaz isso em silêncio — o app
// continua funcionando e nenhum teste comportamental acusa. Por isso a
// invariante é verificada na fonte.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const appFonte = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8')

// Alcançadas por clique, e as duas primeiras carregam quase todos os painéis.
const ROTAS_SOB_DEMANDA = [
  'CharacterSheetPage',
  'MonsterSheetPage',
  'CharactersPage',
  'NewMonsterPage',
  'RegisterPage',
  'EmailVerificationPage',
  'PrivacyPolicyPage',
  'NotFound',
]

// Pontos de entrada: carregá-los sob demanda faria a primeira tela piscar.
const ROTAS_NO_PACOTE_INICIAL = ['Home', 'LoginPage']

describe('divisão de código por rota', () => {
  it('lê o App.tsx (validação do próprio teste)', () => {
    // Sem esta guarda, um caminho errado faria os testes abaixo passarem por
    // vacuidade, varrendo uma string vazia.
    expect(appFonte).toContain('BrowserRouter')
  })

  it.each(ROTAS_SOB_DEMANDA)('%s é carregada sob demanda', (pagina) => {
    // Precisa vir de `lazy(...)`, não de um import estático no topo.
    expect(appFonte).toMatch(new RegExp(`const ${pagina} = lazy\\(`))
    expect(appFonte).not.toMatch(new RegExp(`^import \\{[^}]*\\b${pagina}\\b`, 'm'))
  })

  it.each(ROTAS_NO_PACOTE_INICIAL)('%s continua no pacote inicial', (pagina) => {
    expect(appFonte).toMatch(new RegExp(`^import \\{[^}]*\\b${pagina}\\b`, 'm'))
  })

  it('há um Suspense com fallback em volta das rotas', () => {
    // Sem fallback, React lança ao suspender.
    expect(appFonte).toMatch(/<Suspense fallback=\{<RouteFallback \/>\}>/)
  })
})
