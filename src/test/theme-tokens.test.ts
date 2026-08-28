import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'theme.css'), 'utf8')

describe('tokens do tema', () => {
  it('importa Cinzel, Inter e Crimson Text (esta última para o modo pergaminho)', () => {
    expect(css).toMatch(/family=Cinzel/)
    expect(css).toMatch(/family=Inter|&family=Inter/)
    expect(css).toMatch(/Crimson\+Text/)
  })

  it('define os três temas: claro (:root), escuro e pergaminho', () => {
    expect(css).toMatch(/:root\s*\{/)
    expect(css).toMatch(/:root\[data-theme=["']dark["']\]\s*\{/)
    expect(css).toMatch(/:root\[data-theme=["']parchment["']\]\s*\{/)
  })

  it('define os tokens glass semânticos', () => {
    for (const t of [
      '--panel-bg',
      '--panel-border',
      '--chip-violet-text',
      '--danger-solid',
      '--heal-solid',
      '--temp-solid',
      '--on-solid',
      '--text',
      '--text-muted',
      '--text-faint',
      '--blur-panel',
      '--bg',
    ]) {
      expect(css, t).toContain(t)
    }
  })

  it('mantém --accent (usado pelo realce de foco global em index.css)', () => {
    expect(css).toMatch(/--accent:\s*var\(--chip-violet-text\)/)
  })

  it('o modo pergaminho reusa os tokens semânticos, não os nomes legados', () => {
    // A paleta sépia volta pelos VALORES sob [data-theme="parchment"], não
    // ressuscitando --ink*/--parchment*/--rust etc.
    for (const legacy of ['--ink:', '--parchment-', '--rust:', '--bronze:', '--pewter:', '--border-light:', '--border-dark:']) {
      expect(css, legacy).not.toContain(legacy)
    }
  })

  it('o modo pergaminho troca o corpo para Crimson Text e desliga o blur', () => {
    const block = css.slice(css.indexOf("[data-theme='parchment']"))
    expect(block).toMatch(/--font-body:\s*'Crimson Text'/)
    expect(block).toMatch(/--blur-panel:\s*none/)
  })

  it('preserva o bloco de prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(css).toMatch(/--transition:\s*0ms/)
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/)
  })

  it('não usa transition: all', () => {
    expect(css).not.toMatch(/transition:\s*all\b/)
  })
})
