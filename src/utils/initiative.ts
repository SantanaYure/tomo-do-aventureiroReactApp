// Regras puras do rastreador de iniciativa da mesa e da numeração de
// criaturas replicadas. Sem Firestore aqui, para poder testar isoladamente.

import type {
  CampaignCombat,
  CampaignCreature,
  CampaignMember,
} from '../types/campaign/campaign'

export type CombatantKind = 'hero' | 'creature'

export interface Combatant {
  id: string
  kind: CombatantKind
  /** userId (herói) ou id da criatura. */
  refId: string
  name: string
  initiative: number | null
  initiativeBonus: number
  /** Tirado da ordem pelo mestre; continua em cena. */
  outOfCombat: boolean
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** d20 + bônus. `random` injetável para testes. */
export function rollInitiative(bonus: number, random: () => number = Math.random): number {
  const d20 = Math.floor(random() * 20) + 1
  return d20 + Math.trunc(bonus)
}

export function combatantId(kind: CombatantKind, refId: string): string {
  return `${kind}:${refId}`
}

/**
 * Heróis que entram no combate e no painel de heróis: todo jogador, e o
 * mestre só quando marcou que também joga com um PJ. Ter uma ficha vinculada
 * não basta, porque o mestre controla os monstros e NPCs, não um herói.
 */
export function isHeroInCombat(member: CampaignMember): boolean {
  return member.role !== 'dm' || member.participatesAsPlayer === true
}

export function buildCombatants(
  members: CampaignMember[],
  creatures: CampaignCreature[],
): Combatant[] {
  const heroes: Combatant[] = members.filter(isHeroInCombat).map((member) => ({
    id: combatantId('hero', member.userId),
    kind: 'hero',
    refId: member.userId,
    name: member.characterName || member.displayName,
    initiative: typeof member.initiative === 'number' ? member.initiative : null,
    initiativeBonus: member.vitals?.initiativeBonus ?? 0,
    outOfCombat: member.outOfCombat === true,
  }))

  const monsters: Combatant[] = creatures.map((creature) => ({
    id: combatantId('creature', creature.id),
    kind: 'creature',
    refId: creature.id,
    name: creature.name,
    initiative: typeof creature.initiative === 'number' ? creature.initiative : null,
    initiativeBonus: creature.initiativeBonus ?? 0,
    outOfCombat: creature.outOfCombat === true,
  }))

  return [...heroes, ...monsters]
}

/**
 * Ordem de turno: maior iniciativa primeiro; empate pelo maior bônus; depois
 * heróis antes de criaturas e, por fim, nome. Quem ainda não rolou vai para
 * o fim, na ordem original.
 */
export function sortByInitiative(combatants: Combatant[]): Combatant[] {
  const rolled = combatants.filter((c) => c.initiative !== null)
  const pending = combatants.filter((c) => c.initiative === null)
  rolled.sort((a, b) => {
    if (b.initiative! !== a.initiative!) return b.initiative! - a.initiative!
    if (b.initiativeBonus !== a.initiativeBonus) return b.initiativeBonus - a.initiativeBonus
    if (a.kind !== b.kind) return a.kind === 'hero' ? -1 : 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })
  return [...rolled, ...pending]
}

/**
 * Turno depois de tirar `removedId` da ordem: se ele estava com a vez, ela
 * passa para o próximo (somando rodada se ele era o último); senão nada muda.
 */
export function turnAfterRemoval(
  order: Combatant[],
  combat: CampaignCombat | null | undefined,
  removedId: string,
): CampaignCombat | null | undefined {
  if (!combat || combat.activeId !== removedId) return combat
  const rolled = order.filter((c) => c.initiative !== null && !c.outOfCombat)
  const index = rolled.findIndex((c) => c.id === removedId)
  const remaining = rolled.filter((c) => c.id !== removedId)
  if (remaining.length === 0) return { round: combat.round, activeId: null }
  if (index === -1 || index >= remaining.length) {
    return { round: combat.round + 1, activeId: remaining[0].id }
  }
  return { round: combat.round, activeId: remaining[index].id }
}

/** Avança para o próximo participante que já rolou; ao passar do último, soma uma rodada. */
export function advanceTurn(
  order: Combatant[],
  combat: CampaignCombat | null | undefined,
): CampaignCombat {
  const active = order.filter((c) => c.initiative !== null && !c.outOfCombat)
  if (active.length === 0) return { round: combat?.round ?? 1, activeId: null }

  const round = combat?.round ?? 1
  const index = combat?.activeId ? active.findIndex((c) => c.id === combat.activeId) : -1

  // Sem turno ativo (combate começando) ou o ativo saiu de cena: volta ao topo.
  if (index === -1) return { round: Math.max(1, round), activeId: active[0].id }
  if (index === active.length - 1) return { round: round + 1, activeId: active[0].id }
  return { round, activeId: active[index + 1].id }
}

/** Remove um número final ("Goblin 3" → "Goblin"). */
export function baseInstanceName(name: string): string {
  return name.trim().replace(/\s+\d+$/, '') || name.trim()
}

function highestInstanceNumber(base: string, existingNames: string[]): number {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${escaped}(?:\\s+(\\d+))?$`, 'i')
  let highest = 0
  for (const name of existingNames) {
    const match = name.trim().match(pattern)
    if (!match) continue
    highest = Math.max(highest, match[1] ? Number(match[1]) : 1)
  }
  return highest
}

/**
 * Gera `count` nomes livres para cópias de uma criatura, continuando a
 * numeração que já existe em cena: com "Goblin" e "Goblin 2" presentes, as
 * próximas são "Goblin 3", "Goblin 4"...
 */
export function nextInstanceNames(
  baseName: string,
  existingNames: string[],
  count: number,
): string[] {
  const base = baseInstanceName(baseName) || 'Criatura'
  const highest = highestInstanceNumber(base, existingNames)
  const names: string[] = []
  for (let i = 1; i <= count; i++) names.push(`${base} ${highest + i}`)
  return names
}

/**
 * Nomes para criaturas recém-adicionadas. Uma única criatura sem homônimo em
 * cena mantém o nome digitado; várias, ou uma que já tem homônimo, recebem
 * numeração.
 */
export function namesForNewInstances(
  name: string,
  existingNames: string[],
  count: number,
): string[] {
  const trimmed = name.trim() || 'Criatura'
  const safeCount = Math.max(1, Math.trunc(count))
  if (safeCount === 1 && highestInstanceNumber(baseInstanceName(trimmed), existingNames) === 0) {
    return [trimmed]
  }
  return nextInstanceNames(trimmed, existingNames, safeCount)
}
