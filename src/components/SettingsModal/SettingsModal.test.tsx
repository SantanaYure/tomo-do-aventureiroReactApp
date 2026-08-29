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

  it('embute o painel de aparência com os três temas', async () => {
    const user = userEvent.setup()
    wrap(<SettingsModal {...baseProps} />)

    expect(screen.getByRole('button', { name: 'Claro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pergaminho' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escuro' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Pergaminho' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('parchment')
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
