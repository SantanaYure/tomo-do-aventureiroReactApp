import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { DND_CONDITIONS } from '../../../store/campaignStore'
import styles from './ConditionsModal.module.css'

interface ConditionsModalProps {
  entityName: string
  activeConditions: string[]
  onToggleCondition: (condition: string) => void
  onClose: () => void
}

export function ConditionsModal({
  entityName,
  activeConditions,
  onToggleCondition,
  onClose,
}: ConditionsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conditions-modal-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Condições de D&D 2024</p>
            <h2 id="conditions-modal-title" className={styles.title}>
              {entityName}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.grid}>
          {DND_CONDITIONS.map((cond) => {
            const isActive = activeConditions.includes(cond)
            return (
              <button
                key={cond}
                type="button"
                className={`${styles.conditionBtn} ${isActive ? styles.conditionBtnActive : ''}`}
                onClick={() => onToggleCondition(cond)}
                aria-pressed={isActive}
              >
                <span>{cond}</span>
                {isActive && <Check size={14} strokeWidth={2} aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
