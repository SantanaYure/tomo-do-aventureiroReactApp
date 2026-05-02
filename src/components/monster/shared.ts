import type { MonsterSheet, RechargeType } from '../../types/system/dnd/monsterSheet'

// 'day' excluído das opções selecionáveis — tipo mantido no RechargeType para compatibilidade com dados antigos
export const RECHARGE_OPTIONS: ReadonlyArray<{
  value: RechargeType
  label: string
}> = [
  { value: 'none', label: 'Sem recarga' },
  { value: 'turn', label: 'A cada turno' },
  { value: 'recharge56', label: 'Recarrega em 5-6' },
  { value: 'recharge46', label: 'Recarrega em 4-6' },
  { value: 'short', label: 'Descanso curto' },
  { value: 'long', label: 'Descanso longo' },
]

const RECHARGE_LABELS: Record<RechargeType, string> = {
  none: 'Sem recarga',
  turn: 'A cada turno',
  recharge56: 'Recarrega em 5-6',
  recharge46: 'Recarrega em 4-6',
  short: 'Descanso curto',
  long: 'Descanso longo',
  day: '1x por dia',
}

export function getRechargeLabel(recharge: RechargeType): string {
  return RECHARGE_LABELS[recharge] ?? 'Sem recarga'
}

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
