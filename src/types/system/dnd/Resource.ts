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
  /**
   * Identificador estável da habilidade dentro da ficha.
   *
   * Opcional porque documentos antigos do Firestore não têm o campo —
   * `normalizeResource` preenche um id determinístico por posição para eles.
   * Serve para chavear estado de UI (resultado de rolagem, card expandido) sem
   * depender do índice do array, que muda ao remover ou reordenar itens.
   */
  id?: string
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