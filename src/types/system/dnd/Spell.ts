// Arquivo: Spell.ts
// Descrição: magia do personagem
// Tipo: interface

export interface Spell {
  name?: string
  level?: number
  school?: string
  castingTime?: string
  range?: string
  duration?: string
  components?: string[]
  concentration?: boolean
  prepared?: boolean
  description?: string
}

export interface SpellSlot {
  current: number
  max: number
}

export type SpellSlots = Record<number, SpellSlot>
