import { useEffect, useState } from 'react'
import type { MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import { NumberInput } from '../../NumberInput/NumberInput'
import panelStyles from '../../../styles/panel.module.css'
import type { DeepPartial, MonsterComponentProps } from '../shared'
import styles from './MonsterTraitsPanel.module.css'

const XP_FORMATTER = new Intl.NumberFormat('pt-BR')

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function getPerceptionSkillBonus(skills: string[]): number | null {
  for (const skill of skills) {
    const normalizedSkill = normalizeText(skill)

    if (!normalizedSkill.includes('percepcao') && !normalizedSkill.includes('perception')) {
      continue
    }

    const match = skill.match(/([+-]?\d+)/)

    if (match) {
      const parsed = Number(match[1])

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function calculatePassivePerception(sheet: MonsterSheet): number {
  const perceptionBonus = getPerceptionSkillBonus(sheet.traits.skills)

  if (perceptionBonus !== null) {
    return 10 + perceptionBonus
  }

  return 10 + calculateModifier(sheet.stats.wisdom)
}

function parseLines(value: string): string[] {
  const entries = value
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return entries.filter((entry, index) => entries.indexOf(entry) === index)
}

function formatLines(values: string[]): string {
  return values.join('\n')
}

function areLinesEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function hasTextItems(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0)
}

function renderTextList(title: string, values: string[]) {
  if (!hasTextItems(values)) {
    return null
  }

  return (
    <section className={styles.block}>
      <h3 className={styles.blockTitle}>{title}</h3>
      <ul className={styles.textList}>
        {values.map((value) => (
          <li className={styles.textItem} key={value}>
            {value}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function MonsterTraitsPanel({
  sheet,
  isEditing,
  onChange,
}: MonsterComponentProps) {
  const { traits } = sheet
  const passivePerception = calculatePassivePerception(sheet)
  const [savingThrowsDraft, setSavingThrowsDraft] = useState(formatLines(sheet.traits.savingThrows))
  const [skillsDraft, setSkillsDraft] = useState(formatLines(sheet.traits.skills))
  const [languagesDraft, setLanguagesDraft] = useState(formatLines(sheet.traits.languages))
  const [resistancesDraft, setResistancesDraft] = useState(formatLines(sheet.traits.resistances))
  const [immunitiesDraft, setImmunitiesDraft] = useState(formatLines(sheet.traits.immunities))
  const [conditionImmunitiesDraft, setConditionImmunitiesDraft] = useState(
    formatLines(sheet.traits.conditionImmunities),
  )

  function updateTraits(patch: DeepPartial<MonsterSheet['traits']>) {
    onChange({ traits: patch })
  }

  useEffect(() => {
    if (!areLinesEqual(traits.savingThrows, parseLines(savingThrowsDraft))) {
      setSavingThrowsDraft(formatLines(traits.savingThrows))
    }
  }, [savingThrowsDraft, traits.savingThrows])

  useEffect(() => {
    if (!areLinesEqual(traits.skills, parseLines(skillsDraft))) {
      setSkillsDraft(formatLines(traits.skills))
    }
  }, [skillsDraft, traits.skills])

  useEffect(() => {
    if (!areLinesEqual(traits.languages, parseLines(languagesDraft))) {
      setLanguagesDraft(formatLines(traits.languages))
    }
  }, [languagesDraft, traits.languages])

  useEffect(() => {
    if (!areLinesEqual(traits.resistances, parseLines(resistancesDraft))) {
      setResistancesDraft(formatLines(traits.resistances))
    }
  }, [resistancesDraft, traits.resistances])

  useEffect(() => {
    if (!areLinesEqual(traits.immunities, parseLines(immunitiesDraft))) {
      setImmunitiesDraft(formatLines(traits.immunities))
    }
  }, [immunitiesDraft, traits.immunities])

  useEffect(() => {
    if (!areLinesEqual(traits.conditionImmunities, parseLines(conditionImmunitiesDraft))) {
      setConditionImmunitiesDraft(formatLines(traits.conditionImmunities))
    }
  }, [conditionImmunitiesDraft, traits.conditionImmunities])

  const hasVisibleContent =
    hasTextItems(traits.savingThrows) ||
    hasTextItems(traits.skills) ||
    hasTextItems(traits.languages) ||
    hasTextItems(traits.resistances) ||
    hasTextItems(traits.immunities) ||
    hasTextItems(traits.conditionImmunities)

  return (
    <section className={`${panelStyles.panel} ${styles.panel}`}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Caracteristicas</h2>
        <p className={panelStyles.panelSubtitle}>Pericias, idiomas e defesas especiais</p>
      </div>

      {isEditing ? (
        <div className={styles.editLayout}>
          <div className={styles.textGrid}>
            <label className={styles.field}>
              Testes de Resistencia
              <textarea
                value={savingThrowsDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSavingThrowsDraft(nextValue)
                  updateTraits({ savingThrows: parseLines(nextValue) })
                }}
                placeholder="Um por linha. Ex.: Forca +5"
              />
            </label>

            <label className={styles.field}>
              Pericias
              <textarea
                value={skillsDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSkillsDraft(nextValue)
                  updateTraits({ skills: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Percepcao +5"
              />
            </label>

            <label className={styles.field}>
              Idiomas
              <textarea
                value={languagesDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setLanguagesDraft(nextValue)
                  updateTraits({ languages: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Comum, Draconico"
              />
            </label>
          </div>

          <div className={styles.selectionGrid}>
            <label className={styles.field}>
              Resistencias a Dano
              <textarea
                value={resistancesDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setResistancesDraft(nextValue)
                  updateTraits({ resistances: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Fogo"
              />
            </label>

            <label className={styles.field}>
              Imunidades a Dano
              <textarea
                value={immunitiesDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setImmunitiesDraft(nextValue)
                  updateTraits({ immunities: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Veneno"
              />
            </label>

            <label className={styles.field}>
              Imunidades a Condicoes
              <textarea
                value={conditionImmunitiesDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setConditionImmunitiesDraft(nextValue)
                  updateTraits({ conditionImmunities: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Enfeiticado"
              />
            </label>
          </div>

          <div className={styles.ratingRow}>
            <label className={`${styles.field} ${styles.ratingCard}`}>
              ND
              <input
                type="text"
                value={traits.challengeRating}
                onChange={(event) => updateTraits({ challengeRating: event.target.value })}
                placeholder="5"
              />
            </label>

            <label className={`${styles.field} ${styles.ratingCard}`}>
              XP
              <NumberInput
                min={0}
                value={traits.xp}
                onChange={(value) => updateTraits({ xp: value })}
              />
            </label>

            <div className={`${styles.field} ${styles.ratingCard}`}>
              Percepcao Passiva
              <strong className={styles.ratingValue}>{passivePerception}</strong>
            </div>
          </div>
        </div>
      ) : hasVisibleContent ? (
        <div className={styles.viewLayout}>
          {renderTextList('Testes de Resistencia', traits.savingThrows)}
          {renderTextList('Pericias', traits.skills)}
          {renderTextList('Idiomas', traits.languages)}
          {renderTextList('Resistencias a Dano', traits.resistances)}
          {renderTextList('Imunidades a Dano', traits.immunities)}
          {renderTextList('Imunidades a Condicoes', traits.conditionImmunities)}

          <div className={styles.ratingRow}>
            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>ND</span>
              <strong className={styles.ratingValue}>{traits.challengeRating || '-'}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>XP</span>
              <strong className={styles.ratingValue}>{XP_FORMATTER.format(traits.xp)}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>Percepcao Passiva</span>
              <strong className={styles.ratingValue}>{passivePerception}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.viewLayout}>
          <p className={panelStyles.emptyState}>Nenhuma caracteristica preenchida.</p>
          <div className={styles.ratingRow}>
            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>ND</span>
              <strong className={styles.ratingValue}>{traits.challengeRating || '-'}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>XP</span>
              <strong className={styles.ratingValue}>{XP_FORMATTER.format(traits.xp)}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>Percepcao Passiva</span>
              <strong className={styles.ratingValue}>{passivePerception}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
