import type { Character } from '../types/system/dnd/Character'
import type { CharacterSheet } from '../types/system/dnd/CharacterSheet'
import type { Class } from '../types/system/dnd/Class'
import type { Resource, ResourceReset } from '../types/system/dnd/Resource'
import type { SpellSlots } from '../types/system/dnd/Spell'
import type { LimitedUseResource, MonsterSheet, RechargeType } from '../types/system/dnd/monsterSheet'
import { restoreResourceFull } from './manageableResource'

// ── HP max calculation (mirrors CombatPanel, kept here to avoid component→util dependency) ──

function parseHitDieForRest(hitDice: string): number {
  const match = /d(\d+)/i.exec(hitDice)
  const parsed = match ? Number(match[1]) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

export function calcEffectiveHpMaxForRest(character: Character): number {
  if (!character.hpAutoCalc) {
    return Math.max(0, Math.trunc(character.hpMax))
  }
  const conAttr = character.attributes.find((a) => a.name === 'Constituição')
  const conMod = conAttr ? Math.floor((conAttr.value - 10) / 2) : 0
  let total = 0
  let consumedFirstLevel = false
  for (const cls of character.classes) {
    const levels = Math.max(0, Math.trunc(cls.level))
    const hitDie = parseHitDieForRest(cls.hitDice)
    const avgHitDie = hitDie > 0 ? Math.floor(hitDie / 2) + 1 : 0
    if (levels === 0 || hitDie === 0) continue
    for (let lvl = 0; lvl < levels; lvl++) {
      const base = consumedFirstLevel ? avgHitDie : hitDie
      total += Math.max(1, base + conMod)
      consumedFirstLevel = true
    }
  }
  const bonusTotal = character.hpBonusEntries.reduce((sum, e) => {
    const v = Number(e.value)
    return sum + (Number.isFinite(v) ? Math.trunc(v) : 0)
  }, 0)
  return Math.max(0, total + bonusTotal)
}

export type RestType = 'short' | 'long'

/** Retorna true quando o recurso de personagem só recupera via botão de descanso */
export function isRestBasedReset(resetOn: ResourceReset | undefined): boolean {
  return resetOn === 'short-rest' || resetOn === 'long-rest'
}

/** Retorna true quando o recurso de monstro/NPC só recupera via botão de descanso */
export function isRestBasedRecharge(recharge: RechargeType): boolean {
  return recharge === 'short' || recharge === 'long'
}

const WARLOCK_NAMES = ['bruxo', 'warlock']

export function isWarlockClass(currentClass: Pick<Class, 'className'>): boolean {
  const normalizedName = currentClass.className.trim().toLowerCase()
  return WARLOCK_NAMES.some((name) => normalizedName.includes(name))
}

export function hasWarlockClass(classes: Class[]): boolean {
  return classes.some(isWarlockClass)
}

export function shouldRecoverOnRest(resetOn: ResourceReset | undefined, restType: RestType): boolean {
  if (resetOn === 'short-rest') {
    return true
  }

  if (resetOn === 'long-rest') {
    return restType === 'long'
  }

  return false
}

export function recoverResources(resources: Resource[], restType: RestType): Resource[] {
  return resources.map((resource) =>
    shouldRecoverOnRest(resource.resetOn, restType)
      ? { ...resource, current: restoreResourceFull(resource).current }
      : resource,
  )
}

export function recoverSpellSlots(
  spellSlots: SpellSlots,
  restType: RestType,
  classes: Class[],
): SpellSlots {
  const isWarlock = hasWarlockClass(classes)
  const shouldRecover = restType === 'long' || isWarlock

  if (!shouldRecover) {
    return spellSlots
  }

  const result: SpellSlots = {}
  for (const [key, slot] of Object.entries(spellSlots)) {
    result[Number(key)] = restoreResourceFull(slot)
  }
  return result
}

/** Retorna true quando um recurso de monstro/NPC recupera no descanso indicado */
export function shouldMonsterResourceRecoverOnRest(recharge: RechargeType, restType: RestType): boolean {
  if (recharge === 'short') return true  // short recupera em ambos (curto e longo)
  if (recharge === 'long') return restType === 'long'
  return false
}

function recoverLimitedUseItem<T extends LimitedUseResource>(item: T, restType: RestType): T {
  if (!item.hasLimitedUses) return item
  if (!shouldMonsterResourceRecoverOnRest(item.recharge, restType)) return item
  return { ...item, currentUses: item.maxUses }
}

export function applyRestToMonsterSheet(sheet: MonsterSheet, restType: RestType): MonsterSheet {
  return {
    ...sheet,
    features: sheet.features.map((f) => recoverLimitedUseItem(f, restType)),
    actions: sheet.actions.map((a) => recoverLimitedUseItem(a, restType)),
    reactions: sheet.reactions.map((r) => recoverLimitedUseItem(r, restType)),
  }
}

export function applyRestToCharacterSheet(
  sheet: CharacterSheet,
  restType: RestType,
): CharacterSheet {
  const recovered: CharacterSheet = {
    ...sheet,
    resources: recoverResources(sheet.resources, restType),
    spellSlots: recoverSpellSlots(sheet.spellSlots, restType, sheet.character.classes),
  }

  if (restType === 'long') {
    const hpMax = calcEffectiveHpMaxForRest(recovered.character)
    return {
      ...recovered,
      character: {
        ...recovered.character,
        hpCurrent: hpMax,
        hitDiceSpent: 0,
      },
    }
  }

  return recovered
}
