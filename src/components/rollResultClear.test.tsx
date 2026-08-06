// Critério do dono: "as rolagens não têm uma opção de limpar. Uma vez feita,
// ela fica lá até ser rolada de novo." A decisão foi um controle manual de
// limpar em cada resultado exibido — não um sumiço por tempo.
//
// A tradução falsificável: em cada um dos seis pontos que guardam resultado de
// rolagem, depois de rolar precisa existir um <button> acessível por rótulo em
// pt-BR que, ao ser clicado, remove **aquele** resultado da tela.
//
// Os dados de cada cenário saem dos normalizadores de produção
// (`normalizeCharacterSheet` / `normalizeMonsterSheet`) — os mesmos por onde
// passa todo documento lido do Firestore — em vez de objetos montados à mão.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacterSheet } from '../store/defaultCharacterSheet'
import { normalizeCharacterSheet } from '../store/characterSheetStore'
import { createDefaultMonsterSheet, normalizeMonsterSheet } from '../store/monsterSheetStore'
import type { CharacterSheet, DamagePart } from '../types/system/dnd'
import type { MonsterSheet } from '../types/system/dnd/monsterSheet'
import { AttacksPanel } from './AttacksPanel/AttacksPanel'
import { ResourcesPanel } from './ResourcesPanel/ResourcesPanel'
import { CharacterTableMode } from './CharacterTableMode/CharacterTableMode'
import { MonsterActionsPanel } from './monster/MonsterActionsPanel/MonsterActionsPanel'
import { MonsterFeaturesPanel } from './monster/MonsterFeaturesPanel/MonsterFeaturesPanel'
import { MonsterTableMode } from './monster/MonsterTableMode/MonsterTableMode'

const DAMAGES: DamagePart[] = [{ dice: '1d6', type: 'Fogo', bonus: '' }]

const CLEAR_LABEL = /^Limpar resultado da rolagem/

beforeEach(() => {
  // Rolagem determinística: 1d6 sempre 4, então o total exibido é "Total: 4".
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function characterSheetWith(patch: Partial<CharacterSheet>): CharacterSheet {
  return normalizeCharacterSheet({ ...createDefaultCharacterSheet(), ...patch })
}

function monsterSheetWith(patch: Partial<MonsterSheet>): MonsterSheet {
  return normalizeMonsterSheet({ ...createDefaultMonsterSheet(), ...patch })
}

/**
 * Roteiro comum aos seis pontos: o resultado aparece ao rolar, some ao limpar,
 * e volta a aparecer numa nova rolagem (o limpar não pode desativar o botão).
 */
async function expectRollIsClearable(revealRollButton?: () => Promise<void>) {
  const user = userEvent.setup()

  if (revealRollButton) await revealRollButton()

  await user.click(screen.getByRole('button', { name: /Rolar dano/ }))

  // Guarda: sem isso, a asserção de ausência lá embaixo já estaria satisfeita
  // antes do clique de limpar e não provaria nada.
  expect(screen.getByText('Total: 4')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: CLEAR_LABEL }))

  expect(screen.queryByText('Total: 4')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: CLEAR_LABEL })).not.toBeInTheDocument()

  // O botão desmonta a si mesmo. Sem reposicionar o foco ele cai no <body> e
  // quem navega por teclado volta ao topo do documento.
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /Rolar dano/ }))

  await user.click(screen.getByRole('button', { name: /Rolar dano/ }))
  expect(screen.getByText('Total: 4')).toBeInTheDocument()
}

describe('limpar resultado de rolagem — AttacksPanel', () => {
  it('limpa o resultado do ataque', async () => {
    const sheet = characterSheetWith({
      attacks: [{ name: 'Espada Longa', attributeKey: 'str', damages: DAMAGES }],
    })

    render(
      <AttacksPanel
        attacks={sheet.attacks}
        character={sheet.character}
        isEditMode={false}
        onChangeAttacks={() => {}}
      />,
    )

    await expectRollIsClearable(async () => {
      await userEvent.setup().click(screen.getByRole('button', { name: 'Expandir detalhes' }))
    })
  })
})

describe('limpar resultado de rolagem — ResourcesPanel', () => {
  it('limpa o resultado da habilidade', async () => {
    const sheet = characterSheetWith({
      resources: [{ name: 'Fúria', max: 2, current: 2, resetOn: 'manual', damages: DAMAGES }],
    })

    render(
      <ResourcesPanel
        resources={sheet.resources}
        isEditMode={false}
        onChangeResources={() => {}}
      />,
    )

    await expectRollIsClearable()
  })
})

describe('limpar resultado de rolagem — CharacterTableMode', () => {
  it('limpa o resultado de uma habilidade no modo mesa', async () => {
    const sheet = characterSheetWith({
      resources: [{ name: 'Fúria', max: 2, current: 2, resetOn: 'manual', damages: DAMAGES }],
    })

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    await expectRollIsClearable(async () => {
      await userEvent.setup().click(screen.getByRole('button', { name: 'Ver detalhes' }))
    })
  })

  it('limpa o resultado de um ataque no modo mesa', async () => {
    const sheet = characterSheetWith({
      attacks: [{ name: 'Espada Longa', attributeKey: 'str', damages: DAMAGES }],
    })

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    await expectRollIsClearable(async () => {
      await userEvent.setup().click(screen.getByRole('button', { name: /Espada Longa/ }))
    })
  })

  it('limpar um resultado não apaga o resultado do outro item', async () => {
    const user = userEvent.setup()
    const sheet = characterSheetWith({
      attacks: [
        { name: 'Espada Longa', attributeKey: 'str', damages: DAMAGES },
        { name: 'Adaga', attributeKey: 'dex', damages: DAMAGES },
      ],
    })

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Espada Longa/ }))
    await user.click(screen.getByRole('button', { name: /Adaga/ }))

    const rollButtons = screen.getAllByRole('button', { name: /Rolar dano/ })
    expect(rollButtons).toHaveLength(2)
    await user.click(rollButtons[0])
    await user.click(rollButtons[1])
    expect(screen.getAllByText('Total: 4')).toHaveLength(2)

    const clearButtons = screen.getAllByRole('button', { name: CLEAR_LABEL })
    expect(clearButtons).toHaveLength(2)
    await user.click(clearButtons[0])

    // Só o primeiro sumiu.
    expect(screen.getAllByText('Total: 4')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: CLEAR_LABEL })).toHaveLength(1)
  })
})

describe('limpar resultado de rolagem — MonsterActionsPanel', () => {
  it('limpa o resultado de uma ação', async () => {
    const sheet = monsterSheetWith({
      actions: [
        {
          id: '',
          name: 'Mordida',
          description: 'Morde o alvo.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          isAttack: true,
          isMultiattack: false,
          attackCount: 1,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+5',
          damage: '',
          damageType: '',
          reach: '1,5 m',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    render(<MonsterActionsPanel sheet={sheet} isEditing={false} onChange={() => {}} />)

    await expectRollIsClearable()
  })

  it('limpa o resultado de uma reação', async () => {
    const sheet = monsterSheetWith({
      reactions: [
        {
          id: '',
          name: 'Aparar',
          description: 'Apara o golpe.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          duration: '',
          range: '',
          requirements: '',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    render(<MonsterActionsPanel sheet={sheet} isEditing={false} onChange={() => {}} />)

    await expectRollIsClearable()
  })
})

describe('limpar resultado de rolagem — MonsterFeaturesPanel', () => {
  it('limpa o resultado da habilidade especial', async () => {
    const sheet = monsterSheetWith({
      features: [
        {
          id: '',
          name: 'Aura Ardente',
          description: 'Queima quem se aproxima.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          duration: '',
          range: '',
          requirements: '',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    render(<MonsterFeaturesPanel sheet={sheet} isEditing={false} onChange={() => {}} />)

    await expectRollIsClearable()
  })
})

describe('limpar resultado de rolagem — MonsterTableMode', () => {
  it('limpa o resultado de uma habilidade especial no modo mesa', async () => {
    const sheet = monsterSheetWith({
      features: [
        {
          id: '',
          name: 'Aura Ardente',
          description: 'Queima quem se aproxima.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          duration: '',
          range: '',
          requirements: '',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    const { container } = render(<MonsterTableMode sheet={sheet} onChange={() => {}} />)
    const section = within(container)
    expect(section.getByText('Habilidades Especiais')).toBeInTheDocument()

    await expectRollIsClearable()
  })

  it('limpa o resultado de uma ação no modo mesa', async () => {
    const sheet = monsterSheetWith({
      actions: [
        {
          id: '',
          name: 'Mordida',
          description: 'Morde o alvo.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          isAttack: true,
          isMultiattack: false,
          attackCount: 1,
          attackType: 'Corpo-a-corpo',
          attackBonus: '+5',
          damage: '',
          damageType: '',
          reach: '1,5 m',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    const { container } = render(<MonsterTableMode sheet={sheet} onChange={() => {}} />)
    expect(within(container).getByText('Ações')).toBeInTheDocument()

    await expectRollIsClearable()
  })

  it('limpa o resultado de uma reação no modo mesa', async () => {
    const sheet = monsterSheetWith({
      reactions: [
        {
          id: '',
          name: 'Aparar',
          description: 'Apara o golpe.',
          hasLimitedUses: false,
          maxUses: 1,
          currentUses: 1,
          recharge: 'none',
          duration: '',
          range: '',
          requirements: '',
          castingTime: '',
          damages: DAMAGES,
        },
      ],
    })

    const { container } = render(<MonsterTableMode sheet={sheet} onChange={() => {}} />)
    expect(within(container).getByText('Reações')).toBeInTheDocument()

    await expectRollIsClearable()
  })
})
