import type { MonsterSheet, RechargeType } from '../../types/system/dnd/monsterSheet'

export const MAX_TRACKER_DOTS = 6

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
  { value: 'day', label: '1x por dia' },
]

const RECHARGE_LABELS: Record<RechargeType, string> = Object.fromEntries(
  RECHARGE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<RechargeType, string>

export function getRechargeLabel(recharge: RechargeType): string {
  return RECHARGE_LABELS[recharge]
}

export function clampTrackerValue(value: number, maximum: number): number {
  const normalizedMaximum = Math.max(0, Math.trunc(maximum))
  const normalizedValue = Math.trunc(value)
  return Math.min(Math.max(0, normalizedValue), normalizedMaximum)
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