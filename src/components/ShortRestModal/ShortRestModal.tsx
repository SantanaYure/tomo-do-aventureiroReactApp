import { useState, useEffect } from 'react'
import type { Character } from '../../types/system/dnd'
import { calcModifier } from '../AttributesPanel/AttributesPanel'
import styles from './ShortRestModal.module.css'

function parseHitDie(hitDice: string): number {
  const match = /d(\d+)/i.exec(hitDice)
  if (!match) return 0
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : 0
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

type Phase = 'select' | 'result'

interface DieTypeRow {
  dieLabel: string
  sides: number
  classTotal: number
}

interface RollResult {
  dieLabel: string
  roll: number
}

interface ShortRestModalProps {
  character: Character
  hpMax: number
  onConfirm: (hpHealed: number, diceSpent: number) => void
  onCancel: () => void
}

function buildDieRows(character: Character): DieTypeRow[] {
  const map = new Map<string, { sides: number; classTotal: number }>()
  for (const cls of character.classes) {
    const sides = parseHitDie(cls.hitDice)
    if (sides === 0) continue
    const key = `1d${sides}`
    const prev = map.get(key) ?? { sides, classTotal: 0 }
    map.set(key, { sides, classTotal: prev.classTotal + cls.level })
  }
  return Array.from(map.entries())
    .map(([dieLabel, { sides, classTotal }]) => ({ dieLabel, sides, classTotal }))
    .sort((a, b) => b.sides - a.sides)
}

export function ShortRestModal({ character, hpMax, onConfirm, onCancel }: ShortRestModalProps) {
  const totalAvailable = character.classes.reduce((sum, cls) => sum + cls.level, 0)
  const remaining = Math.max(0, totalAvailable - (character.hitDiceSpent ?? 0))

  const conMod = (() => {
    const attr = character.attributes.find((a) => a.name === 'Constituição')
    return attr ? calcModifier(attr.value) : 0
  })()

  const dieRows = buildDieRows(character)

  const [spend, setSpend] = useState<Record<string, number>>(
    () => Object.fromEntries(dieRows.map(({ dieLabel }) => [dieLabel, 0])),
  )
  const [phase, setPhase] = useState<Phase>('select')
  const [rollResults, setRollResults] = useState<RollResult[]>([])
  const [totalRolled, setTotalRolled] = useState(0)

  const totalPending = Object.values(spend).reduce((sum, n) => sum + n, 0)
  const canSpendMore = totalPending < remaining

  function adjustSpend(dieLabel: string, delta: number) {
    setSpend((prev) => {
      const current = prev[dieLabel] ?? 0
      const totalNow = Object.values(prev).reduce((sum, n) => sum + n, 0)
      const row = dieRows.find((r) => r.dieLabel === dieLabel)
      if (!row) return prev
      const otherTotal = totalNow - current
      const maxThisType = Math.min(row.classTotal, remaining - otherTotal)
      const next = Math.max(0, Math.min(maxThisType, current + delta))
      return { ...prev, [dieLabel]: next }
    })
  }

  function handleRoll() {
    const results: RollResult[] = []
    let rawTotal = 0
    for (const row of dieRows) {
      const count = spend[row.dieLabel] ?? 0
      for (let i = 0; i < count; i++) {
        const roll = rollDie(row.sides)
        results.push({ dieLabel: row.dieLabel, roll })
        rawTotal += roll
      }
    }
    setRollResults(results)
    setTotalRolled(rawTotal)
    setPhase('result')
  }

  function handleApply() {
    const hpHealed = Math.max(0, totalRolled + conMod * totalPending)
    onConfirm(hpHealed, totalPending)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  const totalHealed = Math.max(0, totalRolled + conMod * totalPending)
  const hpAfter = Math.min(hpMax, character.hpCurrent + totalHealed)

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="presentation">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="short-rest-title"
      >
        <div className={styles.header}>
          <h2 id="short-rest-title" className={styles.title}>Descanso Curto</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Cancelar descanso curto"
          >
            ✕
          </button>
        </div>

        {phase === 'select' && (
          <div className={styles.body}>
            <p className={styles.hint}>
              Gaste Dados de Vida para recuperar PV. Você cura o resultado
              {conMod !== 0 && <> <strong>{formatMod(conMod)} CON</strong> no total</>}.
            </p>

            <div className={styles.remainingBar}>
              <span className={styles.remainingLabel}>Dados de vida restantes</span>
              <span className={styles.remainingCount}>
                <strong>{remaining - totalPending}</strong>
                <span className={styles.remainingTotal}> / {totalAvailable}</span>
              </span>
            </div>

            {dieRows.length === 0 ? (
              <p className={styles.noDice}>
                Nenhum dado de vida configurado. Defina a classe e o dado de vida no cabeçalho da ficha.
              </p>
            ) : (
              <div className={styles.diceList}>
                {dieRows.map((row) => {
                  const count = spend[row.dieLabel] ?? 0
                  const totalNow = totalPending
                  const otherTotal = totalNow - count
                  const maxThisType = Math.min(row.classTotal, remaining - otherTotal)

                  return (
                    <div className={styles.dieRow} key={row.dieLabel}>
                      <div className={styles.dieMeta}>
                        <span className={styles.dieLabel}>{row.dieLabel}</span>
                        <span className={styles.diePool}>{row.classTotal} dado{row.classTotal !== 1 ? 's' : ''}</span>
                      </div>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => adjustSpend(row.dieLabel, -1)}
                          disabled={count === 0}
                          aria-label={`Reduzir ${row.dieLabel}`}
                        >
                          −
                        </button>
                        <span className={styles.stepCount}>{count}</span>
                        <button
                          type="button"
                          className={styles.stepBtn}
                          onClick={() => adjustSpend(row.dieLabel, 1)}
                          disabled={count >= maxThisType || !canSpendMore}
                          aria-label={`Adicionar ${row.dieLabel}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className={styles.body}>
            <div className={styles.resultList}>
              {rollResults.map((r, i) => (
                <div key={i} className={styles.resultRow}>
                  <span className={styles.resultDieLabel}>{r.dieLabel}</span>
                  <span className={styles.resultRollValue}>{r.roll}</span>
                </div>
              ))}
              {conMod !== 0 && (
                <>
                  <div className={styles.resultDivider} />
                  <div className={styles.resultRow}>
                    <span className={styles.resultDieLabel}>CON</span>
                    <span className={styles.resultRollValue}>{formatMod(conMod * totalPending)}</span>
                  </div>
                </>
              )}
              <div className={styles.resultDivider} />
              <div className={styles.resultTotalRow}>
                <span className={styles.resultTotalLabel}>Total</span>
                <span className={styles.resultTotalValue}>{totalHealed} PV</span>
              </div>
            </div>

            <div className={styles.resultHpPreview}>
              <span className={styles.resultHpLabel}>PV após cura</span>
              <span className={styles.resultHpValue}>{character.hpCurrent} → {hpAfter}</span>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
          {phase === 'select' && (
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleRoll}
              disabled={totalPending === 0}
            >
              Rolar
            </button>
          )}
          {phase === 'result' && (
            <button type="button" className={styles.confirmButton} onClick={handleApply}>
              Aplicar cura
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
