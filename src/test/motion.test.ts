// Critérios: "nenhuma tela pisca ou pula durante transições" e movimento
// respeitando a preferência do sistema.
//
// Estes dois invariantes vivem em CSS, que jsdom não consegue avaliar de forma
// útil (não faz layout nem resolve media queries). Então em vez de fingir um
// teste comportamental, verifico a fonte diretamente — é honesto sobre o que
// está sendo checado e falha se alguém reintroduzir o problema.

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

describe('movimento e transições', () => {
  it('encontra os arquivos CSS do projeto (validação do próprio teste)', () => {
    // Sem esta guarda, uma mudança de estrutura de pastas faria os testes
    // abaixo passarem por vacuidade, varrendo uma lista vazia.
    expect(cssFiles.length).toBeGreaterThan(30)
  })

  it('nenhum CSS usa `transition: all`', () => {
    // `all` anima também propriedades de layout (width, padding, height), o
    // que dispara reflow a cada quadro e é fonte de engasgo. Cada regra deve
    // listar explicitamente as propriedades de pintura que muda.
    const ofensores = cssFiles.filter((file) =>
      /transition:\s*all\b/.test(readFileSync(file, 'utf8')),
    )

    expect(ofensores.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it('o tema desliga o movimento em prefers-reduced-motion', () => {
    const tema = readFileSync(join(SRC, 'styles', 'theme.css'), 'utf8')

    expect(tema).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    // Zerar o token cobre todos os módulos que transicionam via var(--transition).
    expect(tema).toMatch(/--transition:\s*0ms/)
    // E a rede de segurança cobre durações escritas à mão e rolagem suave.
    expect(tema).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(tema).toMatch(/scroll-behavior:\s*auto\s*!important/)
  })
})
