import type { KeyboardEvent } from 'react'
import type {
  Attribute,
  Character,
  Class,
  SavingThrowProficiency,
  SavingThrows,
} from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './AttributesPanel.module.css'

export function calcModifier(value: number): number {
  return Math.floor((value - 10) / 2)
}

export function calcProficiencyBonus(classes: Class[]): number {
  const total = classes.reduce((sum, currentClass) => sum + currentClass.level, 0)
  return Math.ceil(total / 4) + 1
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function parseNumberInput(rawValue: string, fallback = 0): number {
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clampAttributeValue(value: number): number {
  return Math.min(30, Math.max(1, Math.trunc(value)))
}

function normalizeProficiencyLevel(value: number): SavingThrowProficiency {
  if (value <= 0) return 0
  return 1
}

const ATTR_TO_SAVE: Record<Attribute['name'], keyof SavingThrows> = {
  Força: 'str',
  Destreza: 'dex',
  Constituição: 'con',
  Inteligência: 'int',
  Sabedoria: 'wis',
  Carisma: 'cha',
}

const PROF_LABEL: Record<SavingThrowProficiency, string> = {
  0: '○',
  1: '●',
}

const ATTRIBUTE_DISPLAY_ORDER: Attribute['name'][] = [
  'Força',
  'Destreza',
  'Constituição',
  'Inteligência',
  'Sabedoria',
  'Carisma',
]

const ATTRIBUTE_ABBREVIATION: Record<Attribute['name'], string> = {
  Força: 'FOR',
  Destreza: 'DES',
  Constituição: 'CON',
  Inteligência: 'INT',
  Sabedoria: 'SAB',
  Carisma: 'CAR',
}

interface AttributesPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

export function AttributesPanel({
  character,
  isEditMode,
  onChangeCharacter,
}: AttributesPanelProps) {
  const profBonus = calcProficiencyBonus(character.classes)
  const orderedAttributes = ATTRIBUTE_DISPLAY_ORDER.map((attributeName) => {
    const currentIndex = character.attributes.findIndex(
      (attribute) => attribute.name === attributeName,
    )

    return {
      attribute: character.attributes[currentIndex],
      currentIndex,
    }
  }).filter(
    (
      value,
    ): value is { attribute: Attribute; currentIndex: number } => value.currentIndex >= 0,
  )

  function setAttrValue(index: number, value: number) {
    const updated = character.attributes.map<Attribute>((attribute, currentIndex) =>
      currentIndex === index
        ? { ...attribute, value: clampAttributeValue(value) }
        : attribute
    )

    onChangeCharacter({ ...character, attributes: updated })
  }

  function cycleSavingThrowProf(key: keyof SavingThrows) {
    const current = normalizeProficiencyLevel(character.savingThrows[key])

    onChangeCharacter({
      ...character,
      savingThrows: { ...character.savingThrows, [key]: ((current + 1) % 2) as SavingThrowProficiency },
    })
  }

  function handleSavingThrowKeyDown(
    event: KeyboardEvent<HTMLSpanElement>,
    key: keyof SavingThrows,
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    cycleSavingThrowProf(key)
  }

  return (
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Atributos</h2>
        <p className={panelStyles.panelSubtitle}>
          Bônus de proficiência: {formatModifier(profBonus)}
        </p>
      </div>

      <div className={styles.grid}>
        {orderedAttributes.map(({ attribute, currentIndex }) => {
          const modifier = calcModifier(attribute.value)
          const inputId = `attribute-${attribute.name}-${currentIndex}`

          return (
            <article className={styles.attrBox} key={attribute.name}>
              <strong className={styles.attrLabel}>{ATTRIBUTE_ABBREVIATION[attribute.name]}</strong>

              <div>
                {isEditMode ? (
                  <label htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="number"
                      min={1}
                      max={30}
                      aria-label={`Valor de ${attribute.name}`}
                      className={styles.attrInput}
                      value={attribute.value}
                      onChange={(event) =>
                        setAttrValue(currentIndex, parseNumberInput(event.target.value, 1))
                      }
                    />
                  </label>
                ) : (
                  <span className={styles.attrValue}>{attribute.value}</span>
                )}
              </div>

              <span className={styles.attrMod}>{formatModifier(modifier)}</span>
            </article>
          )
        })}
      </div>

      <div className={panelStyles.section}>
        <h3 className={panelStyles.sectionTitle}>Testes de Resistência</h3>

        <div className={styles.savingList}>
          {orderedAttributes.map(({ attribute }) => {
            const modifier = calcModifier(attribute.value)
            const saveKey = ATTR_TO_SAVE[attribute.name]
            const profLevel = normalizeProficiencyLevel(character.savingThrows[saveKey])
            const isProficient = profLevel > 0
            const saveTotal = modifier + profLevel * profBonus

            return (
              <div className={styles.savingRow} key={saveKey}>
                <span
                  aria-label={`Proficiência em ${attribute.name}: ${isProficient ? 'ativada' : 'desativada'}`}
                  aria-pressed={isEditMode ? isProficient : undefined}
                  className={`${styles.profIcon}${isEditMode ? ` ${styles.profIconClickable}` : ''}`}
                  role={isEditMode ? 'button' : undefined}
                  tabIndex={isEditMode ? 0 : undefined}
                  title={isEditMode ? `Clique para alternar proficiência em ${attribute.name}` : undefined}
                  onClick={isEditMode ? () => cycleSavingThrowProf(saveKey) : undefined}
                  onKeyDown={isEditMode ? (event) => handleSavingThrowKeyDown(event, saveKey) : undefined}
                >
                  {PROF_LABEL[profLevel]}
                </span>

                <span className={styles.savingName}>{attribute.name}</span>

                {isProficient ? (
                  <span className={styles.profBonus}>Prof. {formatModifier(profBonus)}</span>
                ) : null}

                <strong className={styles.savingBonus}>{formatModifier(saveTotal)}</strong>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}