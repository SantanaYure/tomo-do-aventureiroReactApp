import type { Resource, SpellSlots } from '../types/system/dnd'
import { restoreResourceFull } from './manageableResource'

export function applyShortRest(resources: Resource[]): Resource[] {
  return resources.map((resource) =>
    resource.resetOn === 'short-rest'
      ? { ...resource, current: restoreResourceFull(resource).current }
      : resource,
  )
}

export function applyLongRestToResources(resources: Resource[]): Resource[] {
  return resources.map((resource) =>
    resource.resetOn === 'long-rest' || resource.resetOn === 'short-rest'
      ? { ...resource, current: restoreResourceFull(resource).current }
      : resource,
  )
}

export function applyLongRestToSpellSlots(spellSlots: SpellSlots): SpellSlots {
  const result: SpellSlots = {}
  for (const [key, slot] of Object.entries(spellSlots)) {
    result[Number(key)] = restoreResourceFull(slot)
  }
  return result
}
