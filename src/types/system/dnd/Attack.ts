// Arquivo: Attack.ts
// Descrição: ataques do personagem
// Tipo: interface

import type { AttributeName } from './Attribute'

export interface Attack {
  name?: string
  attackBonus?: number
  attributeKey?: AttributeName | ''
  useProficiency?: boolean
  damage?: string
  damageType?: string
  range?: string
  notes?: string
  [key: string]: unknown
}