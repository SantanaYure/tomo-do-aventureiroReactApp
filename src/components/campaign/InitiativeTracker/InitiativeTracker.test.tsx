import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CampaignCreature, CampaignMember } from '../../../types/campaign/campaign'
import { InitiativeTracker } from './InitiativeTracker'

const members: CampaignMember[] = [
  // Mestre com ficha vinculada, mas sem marcar que joga: não entra na iniciativa.
  { userId: 'dm', displayName: 'Mestre', role: 'dm', joinedAt: 0, characterSheetId: 's-dm', characterName: 'Aria' },
  { userId: 'p1', displayName: 'Ana', role: 'player', joinedAt: 1, characterName: 'Lia', initiative: 12 },
  { userId: 'p2', displayName: 'Bruno', role: 'player', joinedAt: 2, characterName: 'Torvin' },
]

const creatures: CampaignCreature[] = [
  { id: 'g1', name: 'Goblin', hpCurrent: 7, hpMax: 7, hpTemp: 0, armorClass: 15, conditions: [], addedAt: 0, initiative: 18, initiativeBonus: 2 },
]

const benchedWolf: CampaignCreature = {
  id: 'w1', name: 'Lobo', hpCurrent: 11, hpMax: 11, hpTemp: 0, armorClass: 13, conditions: [], addedAt: 1, initiative: 9, outOfCombat: true,
}

function setup(overrides: Partial<Parameters<typeof InitiativeTracker>[0]> = {}) {
  const props = {
    members,
    creatures,
    combat: null,
    isDm: true,
    currentUserId: 'dm',
    onRollMissing: vi.fn(),
    onRerollAll: vi.fn(),
    onRollHero: vi.fn(),
    onRollCreature: vi.fn(),
    onSetInitiative: vi.fn(),
    onNextTurn: vi.fn(),
    onEndCombat: vi.fn(),
    onToggleOutOfCombat: vi.fn(),
    ...overrides,
  }
  render(<InitiativeTracker {...props} />)
  return props
}

describe('InitiativeTracker', () => {
  it('ordena pela iniciativa e deixa de fora o mestre que não joga', () => {
    setup()
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toContain('Goblin')
    expect(rows[1]).toContain('Lia')
    expect(rows[2]).toContain('Torvin')
  })

  it('marca o turno ativo', () => {
    setup({ combat: { round: 2, activeId: 'hero:p1' } })
    const active = screen.getAllByRole('listitem').find((li) => li.getAttribute('aria-current') === 'true')
    expect(active?.textContent).toContain('Lia')
    expect(screen.getByText('Rodada 2')).toBeInTheDocument()
  })

  it('jogador só edita e rola a própria iniciativa', () => {
    setup({ isDm: false, currentUserId: 'p2' })
    expect(screen.queryByRole('button', { name: 'Rolar iniciativa' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Rolar iniciativa de Torvin' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rolar iniciativa de Goblin' })).not.toBeInTheDocument()
  })

  it('grava o valor digitado ao sair do campo', async () => {
    const user = userEvent.setup()
    const props = setup()
    const torvinRow = screen.getAllByRole('listitem').find((li) => li.textContent?.includes('Torvin'))!
    const input = within(torvinRow).getByRole('spinbutton')

    await user.type(input, '9')
    expect(props.onSetInitiative).not.toHaveBeenCalled()
    await user.tab()

    expect(props.onSetInitiative).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'hero', refId: 'p2' }),
      9,
    )
  })

  it('mestre avança turno com a ordem atual', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByRole('button', { name: /Iniciar combate/ }))
    const order = (props.onNextTurn as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(order.map((c: { id: string }) => c.id)).toEqual(['creature:g1', 'hero:p1', 'hero:p2'])
  })

  it('mestre tira alguém da ordem, que vai para "Fora do combate"', async () => {
    const user = userEvent.setup()
    const props = setup()
    await user.click(screen.getByRole('button', { name: 'Tirar Goblin da iniciativa' }))
    expect(props.onToggleOutOfCombat).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'creature:g1' }),
      true,
      expect.any(Array),
    )
  })

  it('quem está fora do combate sai da ordem e pode voltar', async () => {
    const user = userEvent.setup()
    const props = setup({ creatures: [...creatures, benchedWolf] })
    const rows = screen.getAllByRole('listitem').filter((li) => li.closest('ol'))
    expect(rows.map((r) => r.textContent).join()).not.toContain('Lobo')
    expect(screen.getByText('Fora do combate (1)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Devolver Lobo à iniciativa' }))
    expect(props.onToggleOutOfCombat).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'creature:w1' }),
      false,
      expect.any(Array),
    )
  })

  it('jogador não vê o botão de tirar da iniciativa', () => {
    setup({ isDm: false, currentUserId: 'p2' })
    expect(screen.queryByRole('button', { name: /Tirar .* da iniciativa/ })).not.toBeInTheDocument()
  })
})
