// Arquivo: Attack.ts
// Descrição: ataques do personagem
// Tipo: interface/type

import type { DamagePart } from './DamagePart'

export type AttackAttributeKey =
  | 'str'
  | 'dex'
  | 'con'
  | 'int'
  | 'wis'
  | 'cha'
  | 'manual'

export interface Attack {
  /**
   * Identificador estável do ataque dentro da ficha.
   *
   * Opcional porque documentos antigos do Firestore não têm o campo —
   * `normalizeAttack` preenche um id determinístico por posição para eles, no
   * mesmo padrão que `normalizeMonsterFeature` já usava. Serve para chavear
   * estado de UI (resultado de rolagem, linha expandida) sem depender do
   * índice do array, que muda ao remover ou reordenar itens.
   */
  id?: string
  name?: string
  attackBonus?: number
  attributeKey?: AttackAttributeKey
  useProficiency?: boolean
  damage?: string
  damageType?: string
  range?: string
  notes?: string
  castingTime?: string
  damages?: DamagePart[]
}