import type { Resource, SpellSlots } from '../types/system/dnd'

export function applyShortRest(resources: Resource[]): Resource[] {
  return resources.map((resource) =>
    resource.resetOn === 'short-rest'
      ? { ...resource, current: Math.max(0, resource.max ?? 0) }
      : resource,
  )
}

export function applyLongRestToResources(resources: Resource[]): Resource[] {
  return resources.map((resource) =>
    resource.resetOn === 'long-rest' || resource.resetOn === 'short-rest'
      ? { ...resource, current: Math.max(0, resource.max ?? 0) }
      : resource,
  )
}

export function applyLongRestToSpellSlots(spellSlots: SpellSlots): SpellSlots {
  const result: SpellSlots = {}
  for (const [key, slot] of Object.entries(spellSlots)) {
    result[Number(key)] = { ...slot, current: Math.max(0, slot.max) }
  }
  return result
}
