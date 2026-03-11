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
  prepared?: boolean
  description?: string
  [key: string]: unknown
}
