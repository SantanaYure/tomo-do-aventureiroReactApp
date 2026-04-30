// Arquivo: CharacterSheet.ts
// Descrição: documento inteiro com personagem + recursos
// Tipo: interface

import type { Attack } from './Attack'
import type { Character } from './Character'
import type { Inventory } from './Inventory'
import type { Resource } from './Resource'
import type { Spell, SpellSlots } from './Spell'

export interface CharacterSheet {
  character: Character
  resources: Resource[]
  inventory: Inventory
  spells: Spell[]
  spellSlots: SpellSlots
  attacks: Attack[]
  combatNotes: string
  isEditMode: boolean
}