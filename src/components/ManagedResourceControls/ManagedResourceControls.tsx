import type { ReactNode } from 'react'
import {
  canRestore,
  canSpend,
  getResourceStatus,
  resolveManagedResource,
} from '../../utils/manageableResource'
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
}

function getSafeName(itemName: string): string {
  const trimmedName = itemName.trim()
  return trimmedName || 'sem nome'
}

function formatDelta(prefix: string, amount: number): string {
  return amount > 1 ? `${prefix}${amount}` : prefix
}

export function ManagedResourceControls({
  current,
  max,
  itemName,
  resourceKind,
  onSpend,
  onRestore,
  onRestoreFull,
  spendAmount = 1,
  restoreAmount = 1,
  spendAriaLabel,
  restoreAriaLabel,
  restoreFullAriaLabel,
  restoreFullText = 'Restaurar',
  meta,
  className,
}: ManagedResourceControlsProps) {
  const resource = resolveManagedResource({ current, max })
  const status = getResourceStatus(resource)
  const safeName = getSafeName(itemName)
  const normalizedSpendAmount = Math.max(1, Math.trunc(spendAmount))
  const normalizedRestoreAmount = Math.max(1, Math.trunc(restoreAmount))
  const spendDisabled = !onSpend || !canSpend(resource, normalizedSpendAmount)
  const restoreDisabled = !onRestore || !canRestore(resource)
  const restoreFullDisabled = !onRestoreFull || !canRestore(resource)
  const classes = className ? `${styles.controls} ${className}` : styles.controls

  if (resource.max <= 0) {
    return null
  }

  return (
    <div className={classes} data-resource-status={status}>
      <button
        type="button"
        className={styles.stepButton}
        disabled={spendDisabled}
        aria-label={spendAriaLabel ?? `Usar ${resourceKind}: ${safeName}`}
        onClick={onSpend}
      >
        {formatDelta('-', normalizedSpendAmount)}
      </button>

      <span
        className={styles.counter}
        aria-label={`${resource.current} de ${resource.max} usos disponiveis`}
      >
        {resource.current}
        <span className={styles.counterMax}> / {resource.max}</span>
      </span>

      <button
        type="button"
        className={styles.stepButton}
        disabled={restoreDisabled}
        aria-label={restoreAriaLabel ?? `Restaurar ${resourceKind}: ${safeName}`}
        onClick={onRestore}
      >
        {formatDelta('+', normalizedRestoreAmount)}
      </button>

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
    </div>
  )
}
