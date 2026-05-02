import { resolveManagedResource, type ManagedResourceInput } from '../../utils/manageableResource'
import styles from './ResourceDots.module.css'

interface ResourceDotsProps {
  current: number
  max: number
  itemName: string
  resourceKind: string
  onSpend?: () => void
  onRestore?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const MAX_RENDERED_DOTS = 60

function getSafeName(itemName: string): string {
  const trimmedName = itemName.trim()
  return trimmedName || 'sem nome'
}

export function ResourceDots({
  current,
  max,
  itemName,
  resourceKind,
  onSpend,
  onRestore,
  disabled = false,
  size = 'md',
  className,
}: ResourceDotsProps) {
  const resource: ManagedResourceInput = { current, max }
  const resolved = resolveManagedResource(resource)
  const safeName = getSafeName(itemName)

  if (resolved.max <= 0) return null

  const renderCount = Math.min(resolved.max, MAX_RENDERED_DOTS)
  const isInteractive = !disabled && (Boolean(onSpend) || Boolean(onRestore))
  const sizeClass = size === 'sm' ? styles.dotSm : styles.dotMd
  const wrapperClasses = [
    styles.dots,
    size === 'sm' ? styles.dotsSm : styles.dotsMd,
    className,
  ].filter(Boolean).join(' ')

  function handleDotClick(dotIndex: number, isFilled: boolean) {
    if (disabled) return

    if (isFilled) {
      onSpend?.()
    } else if (dotIndex >= resolved.current) {
      onRestore?.()
    }
  }

  return (
    <span
      className={wrapperClasses}
      role="group"
      aria-label={`${resourceKind}: ${safeName} — ${resolved.current} de ${resolved.max} usos disponíveis`}
    >
      {Array.from({ length: renderCount }, (_, dotIndex) => {
        const isFilled = dotIndex < resolved.current
        const dotNumber = dotIndex + 1
        const ariaLabel = isFilled
          ? `Uso ${dotNumber} de ${resolved.max} de ${safeName} disponível — gastar`
          : `Uso ${dotNumber} de ${resolved.max} de ${safeName} gasto — restaurar`
        const dotClass = `${styles.dot} ${sizeClass} ${isFilled ? styles.dotFilled : styles.dotEmpty}`

        if (!isInteractive) {
          return (
            <span
              key={dotIndex}
              className={dotClass}
              aria-hidden="true"
            />
          )
        }

        const canHandleClick = isFilled ? Boolean(onSpend) : Boolean(onRestore)

        return (
          <button
            key={dotIndex}
            type="button"
            className={dotClass}
            aria-label={ariaLabel}
            aria-pressed={isFilled}
            disabled={!canHandleClick}
            onClick={() => handleDotClick(dotIndex, isFilled)}
          />
        )
      })}

      {resolved.max > MAX_RENDERED_DOTS && (
        <span className={styles.overflowLabel} aria-hidden="true">
          +{resolved.max - MAX_RENDERED_DOTS}
        </span>
      )}
    </span>
  )
}
