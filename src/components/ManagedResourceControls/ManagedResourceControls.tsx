import type { ReactNode } from 'react'
import {
  canRestore,
  resolveManagedResource,
} from '../../utils/manageableResource'
import { ResourceDots } from '../ResourceDots/ResourceDots'
import styles from './ManagedResourceControls.module.css'

interface ManagedResourceControlsProps {
  current: number
  max: number
  itemName: string
  resourceKind: string
  onSpend?: () => void
  onRestore?: () => void
  onRestoreFull?: () => void
  spendAmount?: number
  restoreAmount?: number
  spendAriaLabel?: string
  restoreAriaLabel?: string
  restoreFullAriaLabel?: string
  restoreFullText?: string
  meta?: ReactNode
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

function getSafeName(itemName: string): string {
  const trimmedName = itemName.trim()
  return trimmedName || 'sem nome'
}

export function ManagedResourceControls({
  current,
  max,
  itemName,
  resourceKind,
  onSpend,
  onRestore,
  onRestoreFull,
  spendAriaLabel: _spendAriaLabel,
  restoreAriaLabel: _restoreAriaLabel,
  restoreFullAriaLabel,
  restoreFullText = 'Restaurar',
  meta,
  className,
  disabled = false,
  size = 'md',
}: ManagedResourceControlsProps) {
  const resource = resolveManagedResource({ current, max })
  const safeName = getSafeName(itemName)
  const restoreFullDisabled = disabled || !onRestoreFull || !canRestore(resource)
  const classes = className ? `${styles.controls} ${className}` : styles.controls

  if (resource.max <= 0) {
    return null
  }

  return (
    <span className={classes}>
      <ResourceDots
        current={resource.current}
        max={resource.max}
        itemName={itemName}
        resourceKind={resourceKind}
        onSpend={onSpend}
        onRestore={onRestore}
        disabled={disabled}
        size={size}
      />

      <span className={styles.counterText} aria-hidden="true">
        {resource.current}/{resource.max}
      </span>

      {onRestoreFull && (
        <button
          type="button"
          className={styles.restoreButton}
          disabled={restoreFullDisabled}
          aria-label={
            restoreFullAriaLabel ?? `Restaurar todos os usos de ${resourceKind}: ${safeName}`
          }
          onClick={onRestoreFull}
        >
          {restoreFullText}
        </button>
      )}

      {meta && <span className={styles.meta}>{meta}</span>}
    </span>
  )
}
