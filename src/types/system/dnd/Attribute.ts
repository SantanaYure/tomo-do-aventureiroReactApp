// Arquivo: Attribute.ts
// Descrição: nome e valor dos atributos
// Tipo: interface/type

export type AttributeName =
  | 'Força'
  | 'Destreza'
  | 'Constituição'
  | 'Inteligência'
  | 'Sabedoria'
  | 'Carisma'

export type SpellcastingAbility = AttributeName | ''

export interface Attribute {
  name: AttributeName
  value: number
}