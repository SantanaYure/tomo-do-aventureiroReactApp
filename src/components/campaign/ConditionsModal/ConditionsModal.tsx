import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { DND_CONDITIONS } from '../../../store/campaignStore'
import styles from './ConditionsModal.module.css'

interface ConditionsModalProps {
  entityName: string
  activeConditions: string[]
  onToggleCondition: (condition: string) => void
  onClose: () => void
  /** Rodadas restantes por condição (só com combate em andamento). */
  rounds?: Record<string, number>
  /** Presente só para o mestre durante o combate: define a duração. */
  onSetRounds?: (condition: string, rounds: number | null) => void
}

/** Campo de rodadas com rascunho local: grava ao sair do campo ou com Enter. */
function RoundsInput({
  condition,
  value,
  onCommit,
}: {
  condition: string
  value: number | undefined
  onCommit: (rounds: number | null) => void
}) {
  const [draft, setDraft] = useState(value ? String(value) : '')
  useEffect(() => setDraft(value ? String(value) : ''), [value])

  function commit() {
    const parsed = Math.trunc(Number(draft))
    const next = draft.trim() === '' || !Number.isFinite(parsed) || parsed <= 0 ? null : Math.min(parsed, 100)
    if (next !== (value ?? null)) onCommit(next)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min="1"
      max="100"
      className={styles.roundsInput}
      value={draft}
      placeholder="sem limite"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      aria-label={`Rodadas de ${condition}`}
    />
  )
}

export function ConditionsModal({
  entityName,
  activeConditions,
  onToggleCondition,
  onClose,
  rounds,
  onSetRounds,
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

        {onSetRounds && activeConditions.length > 0 && (
          <div className={styles.durations}>
            <p className={styles.durationsTitle}>Duração no combate (rodadas)</p>
            <p className={styles.durationsHint}>
              Desconta uma a cada nova rodada; ao chegar a zero, a condição sai sozinha.
            </p>
            <ul className={styles.durationsList}>
              {activeConditions.map((cond) => (
                <li key={cond} className={styles.durationRow}>
                  <span>{cond}</span>
                  <RoundsInput
                    condition={cond}
                    value={rounds?.[cond]}
                    onCommit={(value) => onSetRounds(cond, value)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
