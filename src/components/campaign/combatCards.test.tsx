import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CreatureVitalCard } from './CreatureVitalCard/CreatureVitalCard'
import { HeroVitalCard } from './HeroVitalCard/HeroVitalCard'
import { ConditionsModal } from './ConditionsModal/ConditionsModal'
import type { CampaignCreature, CampaignMember } from '../../types/campaign/campaign'

const goblin: CampaignCreature = {
  id: 'g1', name: 'Goblin', hpCurrent: 7, hpMax: 7, hpTemp: 0, armorClass: 15, conditions: ['Caído'], addedAt: 0,
}

const hero: CampaignMember = {
  userId: 'p1', displayName: 'Ana', role: 'player', joinedAt: 0, characterName: 'Lia',
  vitals: { hpCurrent: 5, hpMax: 10, hpTemp: 0, armorClass: 12, passivePerception: 11, conditions: ['Envenenado'] },
}

function renderCreature(props: Partial<Parameters<typeof CreatureVitalCard>[0]> = {}) {
  const onUpdate = vi.fn()
  render(
    <MemoryRouter>
      <CreatureVitalCard creature={goblin} isDm onUpdate={onUpdate} onRemove={vi.fn()} {...props} />
    </MemoryRouter>,
  )
  return onUpdate
}

describe('renomear criatura em cena', () => {
  it('o mestre renomeia pelo lápis e grava com Enter', async () => {
    const user = userEvent.setup()
    const onUpdate = renderCreature()
    await user.click(screen.getByRole('button', { name: 'Renomear Goblin' }))
    const input = screen.getByRole('textbox', { name: /Novo nome/ })
    await user.clear(input)
    await user.type(input, 'Goblin Arqueiro{Enter}')
    expect(onUpdate).toHaveBeenCalledWith('g1', { name: 'Goblin Arqueiro' })
  })

  it('Esc cancela e nome vazio não grava', async () => {
    const user = userEvent.setup()
    const onUpdate = renderCreature()
    await user.click(screen.getByRole('button', { name: 'Renomear Goblin' }))
    await user.keyboard('{Escape}')
    expect(onUpdate).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Renomear Goblin' }))
    await user.clear(screen.getByRole('textbox', { name: /Novo nome/ }))
    await user.tab()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('jogador não vê o lápis', () => {
    render(
      <MemoryRouter>
        <CreatureVitalCard creature={goblin} isDm={false} onUpdate={vi.fn()} onRemove={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'Renomear Goblin' })).not.toBeInTheDocument()
  })
})

describe('iniciativa nos cards', () => {
  it('destaca quem está com a vez e mostra as rodadas da condição', () => {
    renderCreature({ isActiveTurn: true, conditionRounds: { Caído: 2 } })
    const card = screen.getByRole('article', { name: 'Status de Goblin' })
    expect(card).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Vez de agir')).toBeInTheDocument()
    expect(screen.getByTitle('Rodadas restantes')).toHaveTextContent('2r')
  })

  it('herói também mostra a vez e as rodadas', () => {
    render(
      <MemoryRouter>
        <HeroVitalCard member={hero} isDm onUpdateVitals={vi.fn()} isActiveTurn conditionRounds={{ Envenenado: 1 }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Vez de agir')).toBeInTheDocument()
    expect(screen.getByTitle('Rodadas restantes')).toHaveTextContent('1r')
  })
})

describe('duração no modal de condições', () => {
  it('só aparece com onSetRounds e grava o número ao sair do campo', async () => {
    const user = userEvent.setup()
    const onSetRounds = vi.fn()
    const { rerender } = render(
      <ConditionsModal entityName="Goblin" activeConditions={['Caído']} onToggleCondition={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.queryByText(/Duração no combate/)).not.toBeInTheDocument()

    rerender(
      <ConditionsModal
        entityName="Goblin"
        activeConditions={['Caído']}
        onToggleCondition={vi.fn()}
        onClose={vi.fn()}
        rounds={{}}
        onSetRounds={onSetRounds}
      />,
    )
    await user.type(screen.getByRole('spinbutton', { name: 'Rodadas de Caído' }), '3')
    await user.tab()
    expect(onSetRounds).toHaveBeenCalledWith('Caído', 3)
  })
})
