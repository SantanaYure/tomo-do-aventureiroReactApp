export interface DamagePart {
  dice: string   // "2d6", "1d8", "3d10" — notação XdY
  type: string   // "Cortante", "Fogo", "Radiante", etc.
  bonus: string  // "+4", "-1", "" — vazio tratado como 0
}
