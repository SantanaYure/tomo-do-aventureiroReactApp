// Arquivo: Resource.ts
// Descrição: recursos adicionais (ki, sorcery points, etc)
// Tipo: interface/type

import type { DamagePart } from './DamagePart'

export type ResourceReset = 'short-rest' | 'long-rest' | 'manual' | 'na'
export type ResourceOrigin =
  | 'class'
  | 'subclass'
  | 'species'
  | 'background'
  | 'feat'
  | 'magic-item'
  | 'homebrew'

export interface Resource {
  name?: string
  description?: string
  duration?: string
  level?: number
  range?: string
  action?: string
  current?: number
  max?: number
  resetOn?: ResourceReset
  origin?: ResourceOrigin
  customOrigin?: string
  allowCustomOrigin?: boolean
  castingTime?: string
  damages?: DamagePart[]
}