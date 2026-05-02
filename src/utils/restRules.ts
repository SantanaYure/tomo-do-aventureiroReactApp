import type { CharacterSheet } from '../types/system/dnd/CharacterSheet'
import type { Class } from '../types/system/dnd/Class'
import type { Resource, ResourceReset } from '../types/system/dnd/Resource'
import type { SpellSlots } from '../types/system/dnd/Spell'
import type { RechargeType } from '../types/system/dnd/monsterSheet'
import { restoreResourceFull } from './manageableResource'

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

export function applyRestToCharacterSheet(
  sheet: CharacterSheet,
  restType: RestType,
): CharacterSheet {
  return {
    ...sheet,
    resources: recoverResources(sheet.resources, restType),
    spellSlots: recoverSpellSlots(sheet.spellSlots, restType, sheet.character.classes),
  }
}
