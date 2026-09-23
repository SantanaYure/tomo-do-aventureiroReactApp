import { useState, useEffect, useRef } from 'react'
import { applyHpChange } from '../../../store/campaignStore'
import styles from './HpAdjustModal.module.css'

interface HpAdjustModalProps {
  entityName: string
  currentHp: number
  maxHp: number
  tempHp: number
  initialMode?: 'damage' | 'heal' | 'temp'
  onApply: (newCurrent: number, newTemp: number) => void
  onClose: () => void
}

export function HpAdjustModal({
  entityName,
  currentHp,
  maxHp,
  tempHp,
  initialMode = 'damage',
  onApply,
  onClose,
}: HpAdjustModalProps) {
  const [mode, setMode] = useState<'damage' | 'heal' | 'temp'>(initialMode)
  const [amountStr, setAmountStr] = useState('1')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const amount = Math.max(0, parseInt(amountStr, 10) || 0)
  const preview = applyHpChange(currentHp, maxHp, tempHp, amount, mode)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0) return
    onApply(preview.hpCurrent, preview.hpTemp)
    onClose()
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-modal-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Ajuste de Pontos de Vida</p>
            <h2 id="hp-modal-title" className={styles.title}>
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

        <div className={styles.previewBox}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Atual</span>
            <span className={styles.statVal}>
              {currentHp} / {maxHp}
              {tempHp > 0 && <span className={styles.tempVal}> (+{tempHp})</span>}
            </span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>➔</span>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Após {mode === 'damage' ? 'Dano' : mode === 'heal' ? 'Cura' : 'Temp'}</span>
            <span className={styles.statVal}>
              {preview.hpCurrent} / {maxHp}
              {preview.hpTemp > 0 && <span className={styles.tempVal}> (+{preview.hpTemp})</span>}
            </span>
          </div>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'damage' ? styles.tabBtnDamageActive : ''}`}
            onClick={() => setMode('damage')}
            role="tab"
            aria-selected={mode === 'damage'}
          >
            Dano
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'heal' ? styles.tabBtnHealActive : ''}`}
            onClick={() => setMode('heal')}
            role="tab"
            aria-selected={mode === 'heal'}
          >
            Cura
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === 'temp' ? styles.tabBtnTempActive : ''}`}
            onClick={() => setMode('temp')}
            role="tab"
            aria-selected={mode === 'temp'}
          >
            PV Temp
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.inputGroup}>
          <input
            ref={inputRef}
            type="number"
            min="1"
            className={styles.amountInput}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            aria-label="Valor de alteração de PV"
          />

          <div className={styles.quickRow}>
            {[1, 5, 10, 20].map((val) => (
              <button
                key={val}
                type="button"
                className={styles.quickBtn}
                onClick={() => setAmountStr(String(val))}
              >
                +{val}
              </button>
            ))}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${
                mode === 'damage'
                  ? styles.submitDamage
                  : mode === 'heal'
                  ? styles.submitHeal
                  : styles.submitTemp
              }`}
              disabled={amount <= 0}
            >
              Aplicar {mode === 'damage' ? 'Dano' : mode === 'heal' ? 'Cura' : 'Temp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
