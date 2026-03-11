// Arquivo: Attack.ts
// Descrição: ataques do personagem
// Tipo: interface

export interface Attack {
  name?: string
  attackBonus?: number
  damage?: string
  damageType?: string
  range?: string
  notes?: string
  [key: string]: unknown
}