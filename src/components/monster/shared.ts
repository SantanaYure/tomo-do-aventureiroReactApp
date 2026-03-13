import type { MonsterSheet } from '../../types/system/dnd/monsterSheet'

export type DeepPartial<T> = T extends Array<infer Item>
  ? Array<DeepPartial<Item>>
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T

export interface MonsterComponentProps {
  sheet: MonsterSheet
  isEditing: boolean
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}