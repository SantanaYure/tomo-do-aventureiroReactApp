// Arquivo: Resource.ts
// Descrição: recursos adicionais (ki, sorcery points, etc)
// Tipo: interface/type

export type ResourceReset = 'short-rest' | 'long-rest' | 'manual'
export type ResourceOrigin = 'class' | 'lineage' | 'magic-item' | 'divine'

export interface Resource {
  name?: string
  description?: string
  range?: string
  action?: string
  current?: number
  max?: number
  resetOn?: ResourceReset
  origin?: ResourceOrigin
  customOrigin?: string
  allowCustomOrigin?: boolean
  [key: string]: unknown
}