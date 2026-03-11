// Arquivo: AttunementItem.ts
// Descrição: item mágico relacionado a sintonia
// Tipo: interface/type

export type ItemRarity = 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário' | 'Artefato'

export interface AttunementItem {
  name: string
  rarity: ItemRarity | ''
  requiresAttunement: boolean
  description: string
}