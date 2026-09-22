import { describe, expect, it } from 'vitest'
import type { CampaignCreature, CampaignMember } from '../types/campaign/campaign'
import {
  abilityModifier,
  advanceTurn,
  buildCombatants,
  combatantId,
  namesForNewInstances,
  nextInstanceNames,
  rollInitiative,
  sortByInitiative,
  type Combatant,
} from './initiative'

function member(partial: Partial<CampaignMember>): CampaignMember {
  return {
    userId: 'u',
    displayName: 'Jogador',
    role: 'player',
    joinedAt: 0,
    ...partial,
  }
}

function creature(partial: Partial<CampaignCreature>): CampaignCreature {
  return {
    id: 'c',
    name: 'Goblin',
    hpCurrent: 7,
    hpMax: 7,
    hpTemp: 0,
    armorClass: 15,
    conditions: [],
    addedAt: 0,
    ...partial,
  }
}

function combatant(partial: Partial<Combatant>): Combatant {
  return {
    id: 'x',
    kind: 'creature',
    refId: 'x',
    name: 'X',
    initiative: null,
    initiativeBonus: 0,
    ...partial,
  }
}

describe('rollInitiative', () => {
  it('soma d20 e bônus nos extremos do dado', () => {
    expect(rollInitiative(2, () => 0)).toBe(3)
    expect(rollInitiative(2, () => 0.9999)).toBe(22)
    expect(rollInitiative(-1, () => 0.5)).toBe(10)
  })

  it('abilityModifier segue a tabela de D&D', () => {
    expect(abilityModifier(10)).toBe(0)
    expect(abilityModifier(14)).toBe(2)
    expect(abilityModifier(8)).toBe(-1)
    expect(abilityModifier(3)).toBe(-4)
  })
})

describe('buildCombatants', () => {
  it('deixa o mestre de fora mesmo com ficha vinculada, a menos que ele também jogue', () => {
    const dmWithSheet = member({ userId: 'dm', role: 'dm', characterSheetId: 's-1', characterName: 'Aria' })
    expect(buildCombatants([dmWithSheet], [])).toHaveLength(0)
    expect(buildCombatants([{ ...dmWithSheet, participatesAsPlayer: true }], [])).toEqual([
      expect.objectContaining({ id: combatantId('hero', 'dm'), name: 'Aria' }),
    ])
  })

  it('inclui jogadores e criaturas, e não o mestre que só narra', () => {
    const list = buildCombatants(
      [
        member({ userId: 'dm', role: 'dm', displayName: 'Mestre' }),
        member({ userId: 'p1', characterName: 'Lia', vitals: { hpCurrent: 1, hpMax: 1, hpTemp: 0, armorClass: 10, passivePerception: 10, initiativeBonus: 3 }, initiative: 15 }),
      ],
      [creature({ id: 'g1', initiativeBonus: 2 })],
    )
    expect(list.map((c) => c.id)).toEqual([combatantId('hero', 'p1'), combatantId('creature', 'g1')])
    expect(list[0]).toMatchObject({ name: 'Lia', initiative: 15, initiativeBonus: 3 })
    expect(list[1]).toMatchObject({ initiative: null, initiativeBonus: 2 })
  })
})

describe('sortByInitiative', () => {
  it('ordena por valor, desempata por bônus e deixa quem não rolou no fim', () => {
    const order = sortByInitiative([
      combatant({ id: 'a', name: 'A', initiative: 12, initiativeBonus: 1 }),
      combatant({ id: 'b', name: 'B', initiative: null }),
      combatant({ id: 'c', name: 'C', initiative: 18 }),
      combatant({ id: 'd', name: 'D', initiative: 12, initiativeBonus: 3 }),
    ])
    expect(order.map((c) => c.id)).toEqual(['c', 'd', 'a', 'b'])
  })

  it('em empate total, heróis vêm antes de criaturas', () => {
    const order = sortByInitiative([
      combatant({ id: 'm', kind: 'creature', name: 'Aranha', initiative: 10 }),
      combatant({ id: 'h', kind: 'hero', name: 'Zed', initiative: 10 }),
    ])
    expect(order.map((c) => c.id)).toEqual(['h', 'm'])
  })
})

describe('advanceTurn', () => {
  const order = sortByInitiative([
    combatant({ id: 'a', initiative: 20 }),
    combatant({ id: 'b', initiative: 10 }),
    combatant({ id: 'c', initiative: null }),
  ])

  it('começa no topo na rodada 1', () => {
    expect(advanceTurn(order, null)).toEqual({ round: 1, activeId: 'a' })
  })

  it('avança e pula quem não rolou, somando rodada ao voltar ao topo', () => {
    expect(advanceTurn(order, { round: 1, activeId: 'a' })).toEqual({ round: 1, activeId: 'b' })
    expect(advanceTurn(order, { round: 1, activeId: 'b' })).toEqual({ round: 2, activeId: 'a' })
  })

  it('volta ao topo se o participante ativo saiu de cena', () => {
    expect(advanceTurn(order, { round: 3, activeId: 'sumiu' })).toEqual({ round: 3, activeId: 'a' })
  })

  it('sem ninguém rolado, não há turno ativo', () => {
    expect(advanceTurn([combatant({ initiative: null })], null)).toEqual({ round: 1, activeId: null })
  })
})

describe('numeração de réplicas', () => {
  it('continua a partir do maior número em cena', () => {
    expect(nextInstanceNames('Goblin', ['Goblin', 'Goblin 2', 'Lobo'], 2)).toEqual([
      'Goblin 3',
      'Goblin 4',
    ])
  })

  it('replicar "Goblin 3" usa o nome base', () => {
    expect(nextInstanceNames('Goblin 3', ['Goblin', 'Goblin 3'], 1)).toEqual(['Goblin 4'])
  })

  it('uma criatura nova sem homônimo mantém o nome digitado', () => {
    expect(namesForNewInstances('Orc Chefe', ['Goblin'], 1)).toEqual(['Orc Chefe'])
  })

  it('várias criaturas novas saem numeradas desde o 1', () => {
    expect(namesForNewInstances('Lobo', [], 3)).toEqual(['Lobo 1', 'Lobo 2', 'Lobo 3'])
  })

  it('uma criatura nova com homônimo em cena recebe o próximo número', () => {
    expect(namesForNewInstances('Lobo', ['Lobo'], 1)).toEqual(['Lobo 2'])
  })

  it('não confunde nomes que só começam igual', () => {
    expect(nextInstanceNames('Lobo', ['Lobo Atroz 5'], 1)).toEqual(['Lobo 1'])
  })
})
