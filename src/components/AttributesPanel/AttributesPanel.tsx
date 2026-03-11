import type { Attribute, Character, Class, SavingThrows } from '../../types/system/dnd'
import './AttributesPanel.css'

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

const ATTR_TO_SAVE: Record<Attribute['name'], keyof SavingThrows> = {
  Força: 'str',
  Destreza: 'dex',
  Constituição: 'con',
  Inteligência: 'int',
  Sabedoria: 'wis',
  Carisma: 'cha',
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

  function setAttrValue(index: number, value: number) {
    const updated = character.attributes.map<Attribute>((attribute, currentIndex) =>
      currentIndex === index
        ? { ...attribute, value: clampAttributeValue(value) }
        : attribute
    )

    onChangeCharacter({ ...character, attributes: updated })
  }

  function setSavingThrow(key: keyof SavingThrows, value: number) {
    onChangeCharacter({
      ...character,
      savingThrows: { ...character.savingThrows, [key]: Math.trunc(value) },
    })
  }

  return (
    <section className="attributes-panel">
      <div className="attributes-panel__header">
        <h2>Atributos</h2>
        <p className="attributes-panel__summary">
          Bônus de proficiência: {formatModifier(profBonus)}
        </p>
      </div>

      <div className="attributes-panel__grid">
        {character.attributes.map((attribute, index) => {
          const modifier = calcModifier(attribute.value)
          const saveKey = ATTR_TO_SAVE[attribute.name]
          const saveBonus = character.savingThrows[saveKey]
          const saveTotal = modifier + saveBonus
          const inputId = `attribute-${attribute.name}-${index}`
          const saveInputId = `save-bonus-${attribute.name}-${index}`

          return (
            <article className="attributes-panel__card" key={attribute.name}>
              <div className="attributes-panel__titleRow">
                <strong className="attributes-panel__name">{attribute.name}</strong>
                <span className="attributes-panel__modifier">
                  Mod {formatModifier(modifier)}
                </span>
              </div>

              <div className="attributes-panel__valueBlock">
                {isEditMode ? (
                  <label className="attributes-panel__field" htmlFor={inputId}>
                    Valor
                    <input
                      id={inputId}
                      type="number"
                      min={1}
                      max={30}
                      value={attribute.value}
                      onChange={(event) =>
                        setAttrValue(index, parseNumberInput(event.target.value, 1))
                      }
                    />
                  </label>
                ) : (
                  <span className="attributes-panel__value">{attribute.value}</span>
                )}
              </div>

              <div className="attributes-panel__saveBlock">
                <span className="attributes-panel__saveLabel">Teste de resistência</span>
                <strong className="attributes-panel__saveTotal">
                  {formatModifier(saveTotal)}
                </strong>

                {isEditMode && (
                  <label className="attributes-panel__field" htmlFor={saveInputId}>
                    Bônus extra
                    <input
                      id={saveInputId}
                      type="number"
                      value={saveBonus}
                      onChange={(event) =>
                        setSavingThrow(saveKey, parseNumberInput(event.target.value))
                      }
                    />
                  </label>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}