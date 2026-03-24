// Arquivo: Attack.ts
// Descrição: ataques do personagem
// Tipo: interface/type

export type AttackAttributeKey =
  | 'str'
  | 'dex'
  | 'con'
  | 'int'
  | 'wis'
  | 'cha'
  | 'manual'

export interface Attack {
  name?: string
  attackBonus?: number
  attributeKey?: AttackAttributeKey
  useProficiency?: boolean
  damage?: string
  damageType?: string
  range?: string
  notes?: string
}