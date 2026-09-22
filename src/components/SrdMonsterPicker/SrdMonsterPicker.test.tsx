import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RulesetProvider } from '../../context/RulesetContext'
import { RULESET_KEY } from '../../utils/ruleset'
import { SrdMonsterPicker } from './SrdMonsterPicker'

function wrap(node: ReactNode) {
  return render(<RulesetProvider>{node}</RulesetProvider>)
}

beforeEach(() => {
  localStorage.clear()
})

describe('SrdMonsterPicker', () => {
  it('lista os dois rulesets quando a preferência é "Ambos"', () => {
    wrap(<SrdMonsterPicker onSelect={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getAllByText('Goblin')).toHaveLength(1)
    expect(screen.getAllByText('Esqueleto')).toHaveLength(2)
    expect(screen.getAllByText('Lobo')).toHaveLength(2)
  })

  it('filtra pela preferência de regras salva', () => {
    localStorage.setItem(RULESET_KEY, '2024')
    wrap(<SrdMonsterPicker onSelect={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByText('Goblin')).not.toBeInTheDocument()
    expect(screen.getAllByText('Esqueleto')).toHaveLength(1)
    expect(screen.getAllByText('Lobo')).toHaveLength(1)
  })

  it('filtra pelo texto de busca', async () => {
    const user = userEvent.setup()
    wrap(<SrdMonsterPicker onSelect={vi.fn()} onClose={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('Buscar monstro...'), 'lobo')

    expect(screen.queryByText('Goblin')).not.toBeInTheDocument()
    expect(screen.queryByText('Esqueleto')).not.toBeInTheDocument()
    expect(screen.getAllByText('Lobo')).toHaveLength(2)
  })

  it('chama onSelect com o template escolhido', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn().mockResolvedValue(undefined)
    localStorage.setItem(RULESET_KEY, '2014')
    wrap(<SrdMonsterPicker onSelect={onSelect} onClose={vi.fn()} />)

    const goblinRow = screen.getByText('Goblin').closest('div')!
    await user.click(within(goblinRow.parentElement as HTMLElement).getByRole('button', { name: 'Usar' }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatchObject({ id: 'srd-2014-goblin', name: 'Goblin' })
  })

  it('fecha ao clicar no overlay', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    wrap(<SrdMonsterPicker onSelect={vi.fn()} onClose={onClose} />)

    await user.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
