import type { Character } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import styles from './CharacterSheetSummary.module.css'

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function getAttrMod(character: Character, name: string): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function calcAC(character: Character): number {
  return Math.max(0, Math.trunc(character.armorClassBase))
}

function calcInitiative(character: Character): number {
  return getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
}

function calcEffectiveHpMax(character: Character): number {
  if (!character.hpAutoCalc) {
    return Math.max(0, Math.trunc(character.hpMax))
  }
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
  const bonusTotal = character.hpBonusEntries.reduce((sum, e) => {
    const v = Number(e.value)
    return sum + (Number.isFinite(v) ? Math.trunc(v) : 0)
  }, 0)
  return Math.max(0, total + bonusTotal)
}

function calcPassivePerception(character: Character, profBonus: number): number {
  const wisMod = getAttrMod(character, 'Sabedoria')
  const perception = character.skills.perception
  const profLevel = Math.max(0, Math.min(2, Math.trunc(perception?.proficiency ?? 0)))
  const misc = perception?.misc ?? 0
  return 10 + wisMod + profLevel * profBonus + misc + (character.passivePerceptionBonus ?? 0)
}

function totalLevel(character: Character): number {
  return character.classes.reduce((sum, cls) => sum + cls.level, 0)
}

function formatClasses(character: Character): string {
  return character.classes
    .map((cls) => `${cls.className || '—'} ${cls.level}`)
    .join(' / ')
}

interface CharacterSheetSummaryProps {
  character: Character
}

export function CharacterSheetSummary({ character }: CharacterSheetSummaryProps) {
  const profBonus = calcProficiencyBonus(character.classes)
  const ac = calcAC(character)
  const initiative = calcInitiative(character)
  const hpMax = calcEffectiveHpMax(character)
  const hpCurrent = Math.min(Math.max(0, character.hpCurrent), hpMax)
  const hpTemp = Math.max(0, character.hpTemp)
  const passivePerception = calcPassivePerception(character, profBonus)

  return (
    <div className={styles.summary} role="region" aria-label="Resumo de Mesa">
      <div className={styles.header}>
        <span className={styles.sectionLabel}>Resumo de Mesa</span>
        <div className={styles.classRow}>
          <span className={styles.classText}>{formatClasses(character)}</span>
          <span className={styles.levelBadge}>Nível {totalLevel(character)}</span>
        </div>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>CA</span>
          <strong className={styles.cardValue}>{ac}</strong>
        </div>

        <div className={`${styles.card} ${styles.cardHp}`}>
          <span className={styles.cardLabel}>PV</span>
          <strong className={styles.cardValue}>
            {hpCurrent}
            <span className={styles.cardMax}>/{hpMax}</span>
          </strong>
          {hpTemp > 0 && (
            <span className={styles.cardSub}>+{hpTemp} temp</span>
          )}
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Iniciativa</span>
          <strong className={styles.cardValue}>{formatModifier(initiative)}</strong>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Deslocamento</span>
          <strong className={styles.cardValue}>{character.speed || '—'}</strong>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Proficiência</span>
          <strong className={styles.cardValue}>{formatModifier(profBonus)}</strong>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Percep. Passiva</span>
          <strong className={styles.cardValue}>{passivePerception}</strong>
        </div>

        {character.spellcastingAbility && (
          <div className={styles.card}>
            <span className={styles.cardLabel}>Conjuração</span>
            <strong className={styles.cardValue}>{character.spellcastingAbility.slice(0, 3).toUpperCase()}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
