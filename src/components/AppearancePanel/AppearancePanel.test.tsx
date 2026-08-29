import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppearancePanel } from './AppearancePanel'

function wrap(node: ReactNode) {
  return render(<ThemeProvider>{node}</ThemeProvider>)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
})

afterEach(() => vi.unstubAllGlobals())

describe('AppearancePanel — tema', () => {
  it('troca o tema e marca o botão ativo', async () => {
    const user = userEvent.setup()
    wrap(<AppearancePanel />)

    const escuro = screen.getByRole('button', { name: 'Escuro' })
    await user.click(escuro)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(escuro).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false')
    expect(localStorage.getItem('tomo:theme')).toBe('dark')
  })
})

describe('AppearancePanel — cor de marca', () => {
  it('aplica um preset e persiste', async () => {
    const user = userEvent.setup()
    wrap(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: 'Azul' }))

    expect(document.documentElement.style.getPropertyValue('--chip-violet-text')).toBe('#3b82f6')
    expect(localStorage.getItem('tomo:brand-color')).toBe('#3b82f6')
    expect(screen.getByRole('button', { name: 'Padrão' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('aceita cor digitada em rgb; lixo não sobrescreve a cor válida', async () => {
    const user = userEvent.setup()
    wrap(<AppearancePanel />)

    const field = screen.getByRole('textbox', { name: /cor de marca/i })
    await user.type(field, 'rgb(255, 0, 0)')
    expect(document.documentElement.style.getPropertyValue('--chip-violet-text')).toBe('rgb(255, 0, 0)')

    await user.type(field, 'xyz') // vira "rgb(255, 0, 0)xyz" — inválido
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('rgb(255, 0, 0)')
  })

  it('"Padrão" remove o override', async () => {
    const user = userEvent.setup()
    wrap(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: 'Verde' }))
    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('#22a06b')

    await user.click(screen.getByRole('button', { name: 'Padrão' }))
    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('')
    expect(localStorage.getItem('tomo:brand-color')).toBeNull()
  })
})

describe('AppearancePanel — tipografia', () => {
  it('"Moderna" aplica sans em display e corpo; "Literária" remove', async () => {
    const user = userEvent.setup()
    wrap(<AppearancePanel />)

    await user.click(screen.getByRole('button', { name: /Moderna/ }))
    expect(document.documentElement.style.getPropertyValue('--font-body')).toContain('Inter')
    expect(document.documentElement.style.getPropertyValue('--font-display')).toContain('Inter')
    expect(localStorage.getItem('tomo:font')).toBe('modern')

    await user.click(screen.getByRole('button', { name: /Literária/ }))
    expect(document.documentElement.style.getPropertyValue('--font-display')).toBe('')
    expect(localStorage.getItem('tomo:font')).toBe('literary')
  })
})
