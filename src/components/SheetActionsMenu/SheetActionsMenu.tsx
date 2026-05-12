import { useEffect, useRef, useState } from 'react'
import styles from './SheetActionsMenu.module.css'

interface SheetActionsMenuProps {
  onExport: () => void
  onDelete: () => void
  exportLabel?: string
  deleteLabel?: string
  ariaLabel?: string
  disabled?: boolean
}

export function SheetActionsMenu({
  onExport,
  onDelete,
  exportLabel = 'Exportar',
  deleteLabel = 'Excluir',
  ariaLabel = 'Mais ações',
  disabled,
}: SheetActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className={styles.container} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
      >
        ⋮
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => { setOpen(false); onExport() }}
          >
            {exportLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.item} ${styles.itemDanger}`}
            onClick={() => { setOpen(false); onDelete() }}
          >
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  )
}
