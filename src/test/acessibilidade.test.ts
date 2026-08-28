// Critérios: "toda a navegação principal funciona só com teclado" e "o app
// funciona bem tanto em tela de celular quanto em desktop".
//
// A parte visual do foco vive em CSS, que jsdom não avalia (não faz layout nem
// resolve media query). Em vez de fingir verificação comportamental, verifico a
// fonte — é honesto sobre o que checa e falha se o problema voltar.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(process.cwd(), 'src')

function listCssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return listCssFiles(full)
    return full.endsWith('.css') ? [full] : []
  })
}

const cssFiles = listCssFiles(SRC)
const indexCss = readFileSync(join(SRC, 'index.css'), 'utf8')
const monsterActionsCss = readFileSync(
  join(SRC, 'components', 'monster', 'MonsterActionsPanel', 'MonsterActionsPanel.module.css'),
  'utf8',
)
const monsterActionsTsx = readFileSync(
  join(SRC, 'components', 'monster', 'MonsterActionsPanel', 'MonsterActionsPanel.tsx'),
  'utf8',
)

describe('foco visível por teclado', () => {
  it('encontra os arquivos CSS do projeto (validação do próprio teste)', () => {
    expect(cssFiles.length).toBeGreaterThan(30)
  })

  it('nenhum CSS apaga o realce de foco com `outline: none`', () => {
    // Eram 6 ocorrências, duas delas dentro do próprio `:focus` — quem navegava
    // por teclado não via realce algum no seletor de mesa, na busca de fichas
    // nem nos campos de login e cadastro.
    const ofensores = cssFiles.filter((file) => {
      const conteudo = readFileSync(file, 'utf8')
      // Ignora comentários, que citam a regra ao explicá-la.
      const semComentarios = conteudo.replace(/\/\*[\s\S]*?\*\//g, '')
      return /outline:\s*none/.test(semComentarios)
    })

    expect(ofensores.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it('existe um realce global de foco para todo elemento interativo', () => {
    // `:focus-visible`, não `:focus`: clicar com o mouse não deixa anel,
    // navegar por Tab deixa.
    expect(indexCss).toMatch(/:focus-visible\s*\{/)
    expect(indexCss).toMatch(/outline:\s*2px solid var\(--accent\)/)
    expect(indexCss).toMatch(/outline-offset/)

    // Precisa cobrir os elementos interativos usados no app.
    const regraGlobal = indexCss.slice(indexCss.indexOf(':where('))
    for (const elemento of ['a', 'button', 'input', 'select', 'textarea']) {
      expect(regraGlobal).toMatch(new RegExp(`\\b${elemento}\\b`))
    }
  })
})

describe('responsividade', () => {
  it('a barra de ações das fichas quebra linha em tela estreita', () => {
    // Ela acumula indicador de salvamento, histórico e menu de ações. Sem
    // `flex-wrap`, os itens eram espremidos ou transbordavam no celular.
    for (const pagina of ['CharacterSheetPage', 'MonsterSheetPage']) {
      const css = readFileSync(join(SRC, 'pages', pagina, `${pagina}.module.css`), 'utf8')
      const bloco = css.slice(css.indexOf('.topBarActions'))
      const ateFecharChave = bloco.slice(0, bloco.indexOf('}'))

      expect(ateFecharChave, `${pagina}: .topBarActions`).toMatch(/flex-wrap:\s*wrap/)
      // `flex-shrink: 0` com os itens todos numa linha era o que forçava o
      // transbordo; não pode voltar junto com o wrap.
      expect(ateFecharChave, `${pagina}: .topBarActions`).not.toMatch(/flex-shrink:\s*0/)
    }
  })

  it('mantém a remoção de ações compacta e ao lado do nome em telas estreitas', () => {
    const cabecalho = monsterActionsCss.slice(monsterActionsCss.indexOf('.cardHeader'))
    const blocoCabecalho = cabecalho.slice(0, cabecalho.indexOf('}'))
    const remocao = monsterActionsCss.slice(monsterActionsCss.indexOf('.removeAction'))
    const blocoRemocao = remocao.slice(0, remocao.indexOf('}'))

    expect(blocoCabecalho).toMatch(/display:\s*grid/)
    expect(blocoCabecalho).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/)
    expect(blocoRemocao).toMatch(/width:\s*2\.25rem/)
    expect(blocoRemocao).toMatch(/height:\s*2\.25rem/)
    expect(monsterActionsCss).not.toMatch(
      /\.cardHeader\s+:global\(button\)\s*\{[^}]*width:\s*100%/,
    )
  })

  it('não deixa rolagem horizontal na viewport do celular', () => {
    // Um filho teimoso (tabela larga, palavra sem quebra) não pode arrastar a
    // página inteira. Duas camadas: rede de segurança em #root e grids de
    // empilhamento vertical que encolhem abaixo do min-content.
    const semComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

    const rootBloco = semComentarios(indexCss).match(/#root\s*\{[^}]*\}/)?.[0] ?? ''
    expect(rootBloco).toMatch(/overflow-x:\s*clip/)

    const painelCss = semComentarios(
      readFileSync(join(SRC, 'styles', 'panel.module.css'), 'utf8'),
    )
    const painelBloco = painelCss.slice(painelCss.indexOf('.panel {'))
    expect(painelBloco.slice(0, painelBloco.indexOf('}'))).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    )

    for (const pagina of ['CharacterSheetPage', 'MonsterSheetPage']) {
      const css = semComentarios(
        readFileSync(join(SRC, 'pages', pagina, `${pagina}.module.css`), 'utf8'),
      )
      for (const seletor of ['.tabContent', '.combatSummary']) {
        const bloco = css.slice(css.indexOf(seletor))
        expect(bloco.slice(0, bloco.indexOf('}')), `${pagina}: ${seletor}`).toMatch(
          /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        )
      }
    }
  })

  it('preserva nomes acessíveis nos controles compactos de remoção', () => {
    expect(monsterActionsTsx).toContain(
      'aria-label={`Remover ação ${action.name.trim() || index + 1}`}',
    )
    expect(monsterActionsTsx).toContain(
      'aria-label={`Remover reação ${reaction.name.trim() || index + 1}`}',
    )
  })
})
