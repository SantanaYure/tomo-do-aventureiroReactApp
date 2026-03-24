import { useEffect, useState } from 'react'
import type {
  ConditionType,
  DamageType,
  MonsterSheet,
} from '../../../types/system/dnd/monsterSheet'
import panelStyles from '../../../styles/panel.module.css'
import type { DeepPartial, MonsterComponentProps } from '../shared'
import styles from './MonsterTraitsPanel.module.css'

const RESISTANCE_OPTIONS: readonly DamageType[] = [
  'Ácido',
  'Frio',
  'Fogo',
  'Elétrico',
  'Trovão',
  'Veneno',
  'Necrótico',
  'Radiante',
  'Psíquico',
  'Força',
  'Concussão',
  'Perfuração',
  'Corte',
]

const IMMUNITY_OPTIONS: readonly DamageType[] = [
  'Ácido',
  'Frio',
  'Fogo',
  'Elétrico',
  'Trovão',
  'Veneno',
  'Necrótico',
  'Radiante',
  'Psíquico',
  'Força',
  'Concussão',
  'Perfuração',
  'Corte',
  'Doenças',
]

const CONDITION_OPTIONS: readonly ConditionType[] = [
  'Cego',
  'Surdo',
  'Enfeitiçado',
  'Amedrontado',
  'Agarrado',
  'Incapacitado',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Envenenado',
  'Caído',
  'Restrito',
  'Atordoado',
  'Inconsciente',
]

const XP_FORMATTER = new Intl.NumberFormat('pt-BR')

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

function hasTypedItems(values: readonly string[]): boolean {
  return values.length > 0
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

function renderTagList(title: string, values: readonly string[]) {
  if (!hasTypedItems(values)) {
    return null
  }

  return (
    <section className={styles.block}>
      <h3 className={styles.blockTitle}>{title}</h3>
      <div className={styles.tagGrid}>
        {values.map((value) => (
          <span className={`${styles.tag} ${styles.tagReadOnly}`} key={value}>
            {value}
          </span>
        ))}
      </div>
    </section>
  )
}

export function MonsterTraitsPanel({
  sheet,
  isEditing,
  onChange,
}: MonsterComponentProps) {
  const { traits } = sheet
  const [savingThrowsDraft, setSavingThrowsDraft] = useState(formatLines(sheet.traits.savingThrows))
  const [skillsDraft, setSkillsDraft] = useState(formatLines(sheet.traits.skills))
  const [languagesDraft, setLanguagesDraft] = useState(formatLines(sheet.traits.languages))

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

  function toggleDamageList(key: 'resistances' | 'immunities', value: DamageType) {
    const currentList = traits[key]
    const nextList = currentList.includes(value)
      ? currentList.filter((entry) => entry !== value)
      : [...currentList, value]

    updateTraits({ [key]: nextList })
  }

  function toggleConditionImmunity(value: ConditionType) {
    const nextList = traits.conditionImmunities.includes(value)
      ? traits.conditionImmunities.filter((entry) => entry !== value)
      : [...traits.conditionImmunities, value]

    updateTraits({ conditionImmunities: nextList })
  }

  const hasVisibleContent =
    hasTextItems(traits.savingThrows) ||
    hasTextItems(traits.skills) ||
    hasTextItems(traits.languages) ||
    hasTypedItems(traits.resistances) ||
    hasTypedItems(traits.immunities) ||
    hasTypedItems(traits.conditionImmunities)

  return (
    <section className={`${panelStyles.panel} ${styles.panel}`}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Características</h2>
        <p className={panelStyles.panelSubtitle}>Perícias, idiomas e defesas especiais</p>
      </div>

      {isEditing ? (
        <div className={styles.editLayout}>
          <div className={styles.textGrid}>
            <label className={styles.field}>
              Testes de Resistência
              <textarea
                value={savingThrowsDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSavingThrowsDraft(nextValue)
                  updateTraits({ savingThrows: parseLines(nextValue) })
                }}
                placeholder="Um por linha. Ex.: Força +5"
              />
            </label>

            <label className={styles.field}>
              Perícias
              <textarea
                value={skillsDraft}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSkillsDraft(nextValue)
                  updateTraits({ skills: parseLines(nextValue) })
                }}
                placeholder="Uma por linha. Ex.: Percepção +5"
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
                placeholder="Uma por linha. Ex.: Comum, Dracônico"
              />
            </label>
          </div>

          <div className={styles.selectionGrid}>
            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Resistências a Dano</h3>
              <div className={styles.tagGrid}>
                {RESISTANCE_OPTIONS.map((damageType) => {
                  const checked = traits.resistances.includes(damageType)

                  return (
                    <label
                      className={`${styles.tag} ${checked ? styles.tagSelected : ''}`}
                      key={damageType}
                    >
                      <input
                        className={styles.tagInput}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDamageList('resistances', damageType)}
                      />
                      <span>{damageType}</span>
                    </label>
                  )
                })}
              </div>
            </section>

            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Imunidades a Dano</h3>
              <div className={styles.tagGrid}>
                {IMMUNITY_OPTIONS.map((damageType) => {
                  const checked = traits.immunities.includes(damageType)

                  return (
                    <label
                      className={`${styles.tag} ${checked ? styles.tagSelected : ''}`}
                      key={damageType}
                    >
                      <input
                        className={styles.tagInput}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDamageList('immunities', damageType)}
                      />
                      <span>{damageType}</span>
                    </label>
                  )
                })}
              </div>
            </section>

            <section className={styles.block}>
              <h3 className={styles.blockTitle}>Imunidades a Condições</h3>
              <div className={styles.tagGrid}>
                {CONDITION_OPTIONS.map((condition) => {
                  const checked = traits.conditionImmunities.includes(condition)

                  return (
                    <label
                      className={`${styles.tag} ${checked ? styles.tagSelected : ''}`}
                      key={condition}
                    >
                      <input
                        className={styles.tagInput}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleConditionImmunity(condition)}
                      />
                      <span>{condition}</span>
                    </label>
                  )
                })}
              </div>
            </section>
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
              <input
                type="number"
                min={0}
                value={traits.xp}
                onChange={(event) => updateTraits({ xp: Number(event.target.value) || 0 })}
              />
            </label>
          </div>
        </div>
      ) : hasVisibleContent ? (
        <div className={styles.viewLayout}>
          {renderTextList('Testes de Resistência', traits.savingThrows)}
          {renderTextList('Perícias', traits.skills)}
          {renderTextList('Idiomas', traits.languages)}
          {renderTagList('Resistências a Dano', traits.resistances)}
          {renderTagList('Imunidades a Dano', traits.immunities)}
          {renderTagList('Imunidades a Condições', traits.conditionImmunities)}

          <div className={styles.ratingRow}>
            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>ND</span>
              <strong className={styles.ratingValue}>{traits.challengeRating || '-'}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>XP</span>
              <strong className={styles.ratingValue}>{XP_FORMATTER.format(traits.xp)}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.viewLayout}>
          <p className={panelStyles.emptyState}>Nenhuma característica preenchida.</p>
          <div className={styles.ratingRow}>
            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>ND</span>
              <strong className={styles.ratingValue}>{traits.challengeRating || '-'}</strong>
            </div>

            <div className={styles.ratingCard}>
              <span className={styles.ratingLabel}>XP</span>
              <strong className={styles.ratingValue}>{XP_FORMATTER.format(traits.xp)}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
