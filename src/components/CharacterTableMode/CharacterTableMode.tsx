import { useState } from 'react'
import type { CharacterSheet } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterTableMode.module.css'

export interface CharacterTableModeProps {
  sheet: CharacterSheet
  onUpdate: (updated: CharacterSheet) => void
}

function fmt(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function getAttrMod(character: CharacterSheet['character'], name: string): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function calcEffectiveHpMax(character: CharacterSheet['character']): number {
  if (!character.hpAutoCalc) return Math.max(0, Math.trunc(character.hpMax))
  const conMod = getAttrMod(character, 'Constituição')
  let total = 0
  let firstLevel = false
  for (const cls of character.classes) {
    const levels = Math.max(0, Math.trunc(cls.level))
    const match = /d(\d+)/i.exec(cls.hitDice)
    const sides = match ? Number(match[1]) : 0
    if (levels === 0 || sides === 0) continue
    const avg = Math.floor(sides / 2) + 1
    for (let i = 0; i < levels; i++) {
      total += Math.max(1, (firstLevel ? avg : sides) + conMod)
      firstLevel = true
    }
  }
  const bonus = character.hpBonusEntries.reduce((sum, e) => {
    const v = Number(e.value)
    return sum + (Number.isFinite(v) ? Math.trunc(v) : 0)
  }, 0)
  return Math.max(0, total + bonus)
}

function calcPassivePerception(character: CharacterSheet['character'], profBonus: number): number {
  const wisMod = getAttrMod(character, 'Sabedoria')
  const perc = character.skills.perception
  const profLevel = Math.max(0, Math.min(2, Math.trunc(perc?.proficiency ?? 0)))
  return 10 + wisMod + profLevel * profBonus + (perc?.misc ?? 0) + (character.passivePerceptionBonus ?? 0)
}

export function CharacterTableMode({ sheet, onUpdate }: CharacterTableModeProps) {
  const { character } = sheet
  const [actionValue, setActionValue] = useState('')

  const profBonus = calcProficiencyBonus(character.classes)
  const hpMax = calcEffectiveHpMax(character)
  const hpCurrent = Math.min(Math.max(0, character.hpCurrent), hpMax)
  const hpTemp = Math.max(0, character.hpTemp)
  const ac = Math.max(0, Math.trunc(character.armorClassBase))
  const initiative = getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
  const passivePerception = calcPassivePerception(character, profBonus)

  function updateCharacter(patch: Partial<CharacterSheet['character']>) {
    onUpdate({ ...sheet, character: { ...character, ...patch } })
  }

  function applyHpAction(type: 'damage' | 'heal' | 'temp') {
    const value = Math.trunc(Number(actionValue))
    if (!Number.isFinite(value) || value <= 0) return
    let nextCurrent = hpCurrent
    let nextTemp = hpTemp
    if (type === 'damage') {
      const absorbed = Math.min(nextTemp, value)
      nextTemp -= absorbed
      nextCurrent = Math.max(0, nextCurrent - (value - absorbed))
    } else if (type === 'heal') {
      nextCurrent = Math.min(hpMax, nextCurrent + value)
    } else {
      nextTemp = value > nextTemp ? value : nextTemp
    }
    updateCharacter({ hpCurrent: nextCurrent, hpTemp: nextTemp })
    setActionValue('')
  }

  return (
    <>
      {/* ── Seção A: Stats rápidos ── */}
      <section className={panelStyles.panel}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>CA</span>
            <strong className={styles.statValue}>{ac}</strong>
          </div>
          <div className={`${styles.statCard} ${styles.statCardHp}`}>
            <span className={styles.statLabel}>PV</span>
            <strong className={styles.statValue}>
              {hpCurrent}<span className={styles.statMax}>/{hpMax}</span>
            </strong>
            {hpTemp > 0 && <span className={styles.statSub}>+{hpTemp} temp</span>}
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Iniciativa</span>
            <strong className={styles.statValue}>{fmt(initiative)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Deslocamento</span>
            <strong className={styles.statValue}>{character.speed || '—'}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Proficiência</span>
            <strong className={styles.statValue}>{fmt(profBonus)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Percep. Passiva</span>
            <strong className={styles.statValue}>{passivePerception}</strong>
          </div>
          {character.spellcastingAbility && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Conjuração</span>
              <strong className={styles.statValue}>
                {character.spellcastingAbility.slice(0, 3).toUpperCase()}
              </strong>
            </div>
          )}
        </div>
        <div className={styles.hpControls}>
          <input
            className={styles.hpInput}
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Valor"
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value.replace(/[^\d]/g, ''))}
          />
          <button type="button" className={styles.btnDamage} onClick={() => applyHpAction('damage')}>Dano</button>
          <button type="button" className={styles.btnHeal} onClick={() => applyHpAction('heal')}>Cura</button>
          <button type="button" className={styles.btnTemp} onClick={() => applyHpAction('temp')}>Temp</button>
        </div>
      </section>
    </>
  )
}
