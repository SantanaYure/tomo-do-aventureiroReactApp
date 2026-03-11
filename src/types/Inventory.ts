// Arquivo: Inventory.ts
// Descrição: itens que carrega
// Tipo: interface/type

export interface InventoryItem {
  id?: string | number
  name?: string
  quantity?: number
  description?: string
  weight?: number
  equipped?: boolean
  [key: string]: unknown
}

export type Inventory = InventoryItem[]