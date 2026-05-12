import type { ChangeEvent } from 'react'
import type { SheetGroup } from '../../types/system/dnd/SheetGroup'
import styles from './GroupSelector.module.css'

interface GroupSelectorProps {
  groups: SheetGroup[]
  value: string
  onChange: (groupId: string) => void
  onManage?: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
  id?: string
}

const MANAGE_VALUE = '__manage__'

export function GroupSelector({
  groups,
  value,
  onChange,
  onManage,
  disabled,
  loading,
  label = 'Mesa',
  id,
}: GroupSelectorProps) {
  const currentValue = value && groups.some((group) => group.id === value) ? value : ''

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextValue = event.target.value
    if (nextValue === MANAGE_VALUE) {
      if (onManage) onManage()
      return
    }
    onChange(nextValue)
  }

  return (
    <label className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <select
        id={id}
        className={styles.select}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled || loading}
        aria-label={label}
      >
        <option value="">Sem mesa</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
        {onManage && <option value={MANAGE_VALUE}>Gerenciar mesas...</option>}
      </select>
    </label>
  )
}
