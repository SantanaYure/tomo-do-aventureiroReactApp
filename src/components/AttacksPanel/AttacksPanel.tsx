import type { Attack, AttackAttributeKey, Character } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import panelStyles from '../../styles/panel.module.css'
import styles from './AttacksPanel.module.css'

const ATTACK_ATTRIBUTE_KEYS: AttackAttributeKey[] = [
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
  'manual',
]

const ATTR_KEY_LABEL: Record<AttackAttributeKey, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
  manual: 'Manual',
}

const ATTR_NAME_BY_KEY: Record<Exclude<AttackAttributeKey, 'manual'>, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
}

function calcAttackBonus(attack: Attack, character: Character): number {
  const profBonus = calcProficiencyBonus(character.classes)

  if (attack.attributeKey === 'manual' || !attack.attributeKey) {
    return attack.attackBonus ?? 0
  }

  const attrName = ATTR_NAME_BY_KEY[attack.attributeKey as Exclude<AttackAttributeKey, 'manual'>]
  const attr = character.attributes.find((attribute) => attribute.name === attrName)

  return (attr ? calcModifier(attr.value) : 0) + (attack.useProficiency ? profBonus : 0)
}

function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

function createAttack(): Attack {
  return {
    name: '',
    attributeKey: 'str',
    useProficiency: false,
    attackBonus: 0,
    damage: '',
    damageType: '',
    range: '',
    notes: '',
  }
}

interface AttacksPanelProps {
  attacks: Attack[]
  character: Character
  isEditMode: boolean
  onChangeAttacks: (updated: Attack[]) => void
}

export function AttacksPanel({
  attacks,
  character,
  isEditMode,
  onChangeAttacks,
}: AttacksPanelProps) {
  function setAttack(index: number, partial: Partial<Attack>) {
    onChangeAttacks(attacks.map((attack, currentIndex) => (
      currentIndex === index ? { ...attack, ...partial } : attack
    )))
  }

  function addAttack() {
    onChangeAttacks([...attacks, createAttack()])
  }

  function removeAttack(index: number) {
    onChangeAttacks(attacks.filter((_, currentIndex) => currentIndex !== index))
  }

  if (attacks.length === 0 && !isEditMode) return null

  return (
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Ataques</h2>
      </div>

      {attacks.length === 0 ? (
        <p className={panelStyles.emptyState}>Nenhum ataque cadastrado.</p>
      ) : (
        <div className={`${panelStyles.tableWrap} ${styles.tableWrapper}`}>
          <table className={styles.attackTable}>
            <thead>
              <tr>
                <th className={styles.nameTd}>Nome</th>
                <th className={styles.attrTd}>Atributo</th>
                <th className={styles.profTd}>Prof.</th>
                <th className={styles.bonusTd}>Bônus</th>
                <th className={styles.damageTd}>Dano</th>
                <th className={styles.typeTd}>Tipo</th>
                <th className={styles.rangeTd}>Alcance</th>
                {isEditMode && <th className={styles.notesTd}>Notas</th>}
                {isEditMode && <th className={styles.actionTd}></th>}
              </tr>
            </thead>
            <tbody>
              {attacks.map((attack, i) => {
                const bonus = calcAttackBonus(attack, character)

                return (
                  <tr key={i}>
                    <td className={styles.nameTd} data-label="Nome">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={attack.name ?? ''}
                          placeholder="Nome"
                          onChange={(event) => setAttack(i, { name: event.target.value })}
                        />
                      ) : (
                        attack.name || '—'
                      )}
                    </td>
                    <td className={styles.attrTd} data-label="Atributo">
                      {isEditMode ? (
                        <select
                          value={attack.attributeKey ?? 'manual'}
                          onChange={(event) =>
                            setAttack(i, {
                              attributeKey: event.target.value as AttackAttributeKey,
                            })
                          }
                        >
                          {ATTACK_ATTRIBUTE_KEYS.map((attributeKey) => (
                            <option key={attributeKey} value={attributeKey}>
                              {ATTR_KEY_LABEL[attributeKey]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ATTR_KEY_LABEL[attack.attributeKey ?? 'manual']
                      )}
                    </td>
                    <td className={styles.profTd} data-label="Prof.">
                      <input
                        className={styles.profCheckbox}
                        type="checkbox"
                        checked={attack.useProficiency ?? false}
                        disabled={!isEditMode}
                        onChange={(event) =>
                          setAttack(i, { useProficiency: event.target.checked })
                        }
                      />
                    </td>
                    <td className={styles.bonusTd} data-label="Bônus">
                      {attack.attributeKey === 'manual' && isEditMode ? (
                        <input
                          className={styles.manualBonusInput}
                          type="number"
                          value={attack.attackBonus ?? 0}
                          onChange={(event) =>
                            setAttack(i, { attackBonus: Number(event.target.value) })
                          }
                        />
                      ) : (
                        <span className={styles.bonusDisplay}>{formatBonus(bonus)}</span>
                      )}
                    </td>
                    <td className={styles.damageTd} data-label="Dano">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={attack.damage ?? ''}
                          placeholder="1d8+3"
                          onChange={(event) => setAttack(i, { damage: event.target.value })}
                        />
                      ) : (
                        attack.damage || '—'
                      )}
                    </td>
                    <td className={styles.typeTd} data-label="Tipo">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={attack.damageType ?? ''}
                          placeholder="Cortante"
                          onChange={(event) =>
                            setAttack(i, { damageType: event.target.value })
                          }
                        />
                      ) : (
                        attack.damageType || '—'
                      )}
                    </td>
                    <td className={styles.rangeTd} data-label="Alcance">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={attack.range ?? ''}
                          placeholder="1,5m"
                          onChange={(event) => setAttack(i, { range: event.target.value })}
                        />
                      ) : (
                        attack.range || '—'
                      )}
                    </td>
                    {isEditMode && (
                      <td className={styles.notesTd} data-label="Notas">
                        <input
                          type="text"
                          value={attack.notes ?? ''}
                          placeholder="Observações"
                          onChange={(event) => setAttack(i, { notes: event.target.value })}
                        />
                      </td>
                    )}
                    {isEditMode && (
                      <td className={styles.actionTd} data-label="Ações">
                        <button
                          type="button"
                          className={panelStyles.removeButton}
                          aria-label={`Remover ataque ${attack.name || i + 1}`}
                          onClick={() => removeAttack(i)}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isEditMode && (
        <button type="button" className={panelStyles.addButton} onClick={addAttack}>
          + Ataque
        </button>
      )}
    </section>
  )
}