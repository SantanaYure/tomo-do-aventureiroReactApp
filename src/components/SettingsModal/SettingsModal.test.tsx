import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import { SettingsModal } from './SettingsModal'

function wrap(node: ReactNode) {
  return render(<ThemeProvider>{node}</ThemeProvider>)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.body.style.overflow = ''
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
})

afterEach(() => vi.unstubAllGlobals())

const baseProps = {
  displayName: 'Thorgrim Barba-de-Ferro',
  email: 'thorgrim.barba.de.ferro.aventureiro@exemplo.com.br',
  photoURL: null,
  onLogout: () => {},
  onClose: () => {},
}

describe('SettingsModal', () => {
  it('mostra o nome e o e-mail completos, sem cortar', () => {
    wrap(<SettingsModal {...baseProps} />)
    expect(screen.getByText('Thorgrim Barba-de-Ferro')).toBeInTheDocument()
    expect(
      screen.getByText('thorgrim.barba.de.ferro.aventureiro@exemplo.com.br'),
    ).toBeInTheDocument()
  })

  it('oferece os três temas no select e aplica a escolha', async () => {
    const user = userEvent.setup()
    wrap(<SettingsModal {...baseProps} />)

    const select = screen.getByRole('combobox', { name: /tema/i })
    expect(
      screen.getAllByRole('option').map((option) => (option as HTMLOptionElement).value),
    ).toEqual(['light', 'dark', 'parchment'])

    await user.selectOptions(select, 'parchment')
    expect(document.documentElement.getAttribute('data-theme')).toBe('parchment')

    await user.selectOptions(select, 'dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('o select reflete o tema salvo', () => {
    localStorage.setItem('tomo:theme', 'dark')
    wrap(<SettingsModal {...baseProps} />)
    expect(
      (screen.getByRole('combobox', { name: /tema/i }) as HTMLSelectElement).value,
    ).toBe('dark')
  })

  it('o botão Sair dispara onLogout', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    wrap(<SettingsModal {...baseProps} onLogout={onLogout} />)

    await user.click(screen.getByRole('button', { name: /sair do sistema/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('fecha com Esc, clique no overlay e botão de fechar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = wrap(<SettingsModal {...baseProps} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /fechar configurações/i }))
    expect(onClose).toHaveBeenCalledTimes(2)

    // clique no overlay (fora do dialog)
    await user.click(container.firstChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('trava a rolagem do body enquanto aberto e restaura ao desmontar', () => {
    const { unmount } = wrap(<SettingsModal {...baseProps} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
