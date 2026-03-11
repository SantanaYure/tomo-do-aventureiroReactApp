// Arquivo: Resource.ts
// Descrição: recursos adicionais (ki, sorcery points, etc)
// Tipo: interface/type

export type ResourceReset = 'short-rest' | 'long-rest' | 'manual'

export interface Resource {
  name?: string
  current?: number
  max?: number
  resetOn?: ResourceReset
  [key: string]: unknown
}