import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'theme.css'), 'utf8')

describe('tokens do tema glass', () => {
  it('importa Inter e Cinzel', () => {
    expect(css).toMatch(/family=Cinzel/)
    expect(css).toMatch(/family=Inter|&family=Inter/)
    expect(css).not.toMatch(/Crimson\+Text/)
  })

  it('define a paleta clara em :root e a escura em [data-theme="dark"]', () => {
    expect(css).toMatch(/:root\s*\{/)
    expect(css).toMatch(/:root\[data-theme=["']dark["']\]\s*\{/)
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

  it('mantém os apelidos de compatibilidade apontando para os tokens novos', () => {
    expect(css).toMatch(/--ink:\s*var\(--text\)/)
    expect(css).toMatch(/--accent:\s*var\(--chip-violet-text\)/)
    expect(css).toMatch(/--rust:\s*var\(--danger-solid\)/)
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
