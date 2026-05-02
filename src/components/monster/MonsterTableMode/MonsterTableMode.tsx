import { useState } from 'react'
import type { MonsterSheet, MonsterKind } from '../../../types/system/dnd/monsterSheet'
import type { DeepPartial } from '../shared'
import panelStyles from '../../../styles/panel.module.css'
import styles from './MonsterTableMode.module.css'

interface MonsterTableModeProps {
  sheet: MonsterSheet
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function fmt(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function calcModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

const KIND_LABELS: Record<MonsterKind, string> = {
  monster: 'Monstro',
  npc: 'NPC',
}

const ABILITIES = [
  { key: 'strength'     as const, short: 'FOR', label: 'Força' },
  { key: 'dexterity'    as const, short: 'DES', label: 'Destreza' },
  { key: 'constitution' as const, short: 'CON', label: 'Constituição' },
  { key: 'intelligence' as const, short: 'INT', label: 'Inteligência' },
  { key: 'wisdom'       as const, short: 'SAB', label: 'Sabedoria' },
  { key: 'charisma'     as const, short: 'CAR', label: 'Carisma' },
]

function getPerceptionBonus(skills: string[]): number | null {
  for (const s of skills) {
    const norm = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    if (!norm.includes('percepcao') && !norm.includes('perception')) continue
    const m = s.match(/([+-]?\d+)/)
    if (m) {
      const v = Number(m[1])
      if (Number.isFinite(v)) return v
    }
  }
  return null
}

function calcPassivePerception(sheet: MonsterSheet): number {
  const bonus = getPerceptionBonus(sheet.traits.skills)
  return bonus !== null ? 10 + bonus : 10 + calcModifier(sheet.stats.wisdom)
}

export function MonsterTableMode({ sheet, onChange }: MonsterTableModeProps) {
  const { details, stats, traits } = sheet
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

  const metaParts = [details.species, details.size, details.alignment].filter((v) => v.trim())
  const meta = metaParts.length > 0 ? metaParts.join(' · ') : null

  return (
    <>
      {/* ── Seção A: Identidade ── */}
      <section className={panelStyles.panel}>
        <div className={styles.identity}>
          <h1 className={styles.name}>{details.name || '(sem nome)'}</h1>
          <span className={styles.kindBadge}>{KIND_LABELS[details.kind]}</span>
          {meta && <p className={styles.meta}>{meta}</p>}
          {details.creatureClass.trim() && (
            <p className={styles.creatureClass}>{details.creatureClass}</p>
          )}
          <div className={styles.ratingRow}>
            {traits.challengeRating && (
              <div className={styles.ratingChip}>
                <span className={styles.ratingLabel}>ND</span>
                <strong className={styles.ratingValue}>{traits.challengeRating}</strong>
              </div>
            )}
            {traits.xp > 0 && (
              <div className={styles.ratingChip}>
                <span className={styles.ratingLabel}>XP</span>
                <strong className={styles.ratingValue}>{traits.xp.toLocaleString('pt-BR')}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Seção B: Defesa e vida ── */}
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
          <div className={styles.movementList}>
            {stats.movements.map((m, i) => (
              <span key={m.id || i} className={styles.movementChip}>
                {m.source.trim() || 'Terra'} {m.distance}m
              </span>
            ))}
          </div>
        )}

        {traits.resistances.length > 0 && (
          <div className={styles.chipList}>
            {traits.resistances.map((r) => <span key={r} className={styles.chipResist}>{r}</span>)}
          </div>
        )}
        {traits.immunities.length > 0 && (
          <div className={styles.chipList}>
            {traits.immunities.map((r) => <span key={r} className={styles.chipImmune}>{r}</span>)}
          </div>
        )}
        {traits.conditionImmunities.length > 0 && (
          <div className={styles.chipList}>
            {traits.conditionImmunities.map((r) => <span key={r} className={styles.chipCondIm}>{r}</span>)}
          </div>
        )}
      </section>

      {/* ── Seção C: Atributos e Traços ── */}
      <section className={panelStyles.panel}>
        <span className={styles.sectionTitle}>Atributos</span>
        <div className={styles.abilityGrid}>
          {ABILITIES.map((a) => {
            const score = stats[a.key]
            const mod = calcModifier(score)
            return (
              <article className={styles.abilityCard} key={a.key}>
                <span className={styles.abilityShort}>{a.short}</span>
                <strong className={styles.abilityValue}>{score}</strong>
                <span className={styles.abilityMod}>{fmt(mod)}</span>
              </article>
            )
          })}
        </div>

        {traits.savingThrows.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Testes de Resistência</span>
            <div className={styles.traitList}>
              {traits.savingThrows.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
            </div>
          </div>
        )}
        {traits.skills.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Perícias</span>
            <div className={styles.traitList}>
              {traits.skills.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
            </div>
          </div>
        )}
        {traits.languages.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Idiomas</span>
            <div className={styles.traitList}>
              {traits.languages.map((l) => <span key={l} className={styles.chip}>{l}</span>)}
            </div>
          </div>
        )}

        <div className={styles.traitBlock}>
          <span className={styles.traitTitle}>Percepção Passiva</span>
          <span className={styles.chip}>{calcPassivePerception(sheet)}</span>
        </div>
      </section>
    </>
  )
}
