import { useState } from 'react'
import type { MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import type { DeepPartial } from '../shared'
import panelStyles from '../../../styles/panel.module.css'
import styles from './MonsterCombatSummary.module.css'

interface MonsterCombatSummaryProps {
  sheet: MonsterSheet
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function MonsterCombatSummary({ sheet, onChange }: MonsterCombatSummaryProps) {
  const { stats, traits } = sheet
  const [actionValue, setActionValue] = useState('')
  const effectiveHpMax = Math.max(0, Math.trunc(stats.maxHp))
  const displayedCurrentHp = clamp(stats.hpCurrent, 0, effectiveHpMax)
  const displayedTempHp = Math.max(0, Math.trunc(stats.hpTemp))

  function applyHpAction(type: 'damage' | 'heal' | 'temp') {
    const value = Math.trunc(Number(actionValue))
    if (!Number.isFinite(value) || value <= 0) return
    let nextCurrent = displayedCurrentHp
    let nextTemp = displayedTempHp
    if (type === 'damage') {
      const absorbed = Math.min(nextTemp, value)
      nextTemp -= absorbed
      nextCurrent = Math.max(0, nextCurrent - (value - absorbed))
    } else if (type === 'heal') {
      nextCurrent = Math.min(effectiveHpMax, nextCurrent + value)
    } else {
      nextTemp = value > nextTemp ? value : nextTemp
    }
    onChange({ stats: { hpCurrent: nextCurrent, hpTemp: nextTemp } })
    setActionValue('')
  }

  return (
    <section className={panelStyles.panel}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>CA</span>
          <strong className={styles.statValue}>{stats.ac}</strong>
        </div>
        <div className={`${styles.statCard} ${styles.statCardHp}`}>
          <span className={styles.statLabel}>PV</span>
          <strong className={styles.statValue}>
            {displayedCurrentHp}<span className={styles.statMax}>/{effectiveHpMax}</span>
          </strong>
          {displayedTempHp > 0 && <span className={styles.statSub}>+{displayedTempHp} temp</span>}
        </div>
      </div>

      <div className={styles.hpControls}>
        <input
          className={styles.hpInput}
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Valor"
          aria-label="Valor para dano, cura ou PV temporário"
          value={actionValue}
          onChange={(e) => setActionValue(e.target.value.replace(/[^\d]/g, ''))}
        />
        <button type="button" className={styles.btnDamage} onClick={() => applyHpAction('damage')}>Dano</button>
        <button type="button" className={styles.btnHeal} onClick={() => applyHpAction('heal')}>Cura</button>
        <button type="button" className={styles.btnTemp} onClick={() => applyHpAction('temp')}>Temp</button>
      </div>

      {stats.movements.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Deslocamento</span>
          <div className={styles.chipList}>
            {stats.movements.map((m, i) => (
              <span key={m.id || i} className={styles.movementChip}>
                {m.source.trim() || 'Terra'} {m.distance}m
              </span>
            ))}
          </div>
        </div>
      )}

      {traits.resistances.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Resistências a Dano</span>
          <div className={styles.chipList}>
            {traits.resistances.map((r) => <span key={r} className={styles.chipResist}>{r}</span>)}
          </div>
        </div>
      )}

      {traits.immunities.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Imunidades a Dano</span>
          <div className={styles.chipList}>
            {traits.immunities.map((r) => <span key={r} className={styles.chipImmune}>{r}</span>)}
          </div>
        </div>
      )}

      {traits.conditionImmunities.length > 0 && (
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Imunidades a Condições</span>
          <div className={styles.chipList}>
            {traits.conditionImmunities.map((r) => <span key={r} className={styles.chipCondIm}>{r}</span>)}
          </div>
        </div>
      )}
    </section>
  )
}
