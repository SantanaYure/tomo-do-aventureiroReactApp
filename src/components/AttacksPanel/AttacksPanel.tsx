import { useState, Fragment } from 'react'
import type { Attack, AttackAttributeKey, Character, DamagePart } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import { NumberInput } from '../NumberInput/NumberInput'
import { DamagesEditor } from '../DamagesEditor/DamagesEditor'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../utils/diceRoller'
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
    castingTime: '',
    damages: [],
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [rollResults, setRollResults] = useState<Map<number, DamageRollSummary>>(new Map())

  function toggleRow(index: number) {
    setExpandedRows((previous) => {
      const next = new Set(previous)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  function handleRollDamage(index: number, damages: DamagePart[]) {
    setRollResults((previous) => new Map(previous).set(index, rollDamages(damages)))
  }

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
                <th className={styles.actionTd} aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              {attacks.map((attack, i) => {
                const bonus = calcAttackBonus(attack, character)
                const isExpanded = expandedRows.has(i)
                const colSpan = 5
                const legacyDamageLabel = [attack.damage, attack.damageType]
                  .map((part) => part?.trim() ?? '')
                  .filter(Boolean)
                  .join(' ')
                const hasStructuredDamages = (attack.damages ?? []).length > 0
                const hasLegacyDamageFallback = legacyDamageLabel.length > 0 && !hasStructuredDamages
                const hasCastingTime = Boolean((attack.castingTime ?? '').trim())
                const hasRange = Boolean((attack.range ?? '').trim())
                const hasNotes = Boolean((attack.notes ?? '').trim())
                const hasViewDetail =
                  hasCastingTime ||
                  hasRange ||
                  hasNotes ||
                  hasStructuredDamages ||
                  hasLegacyDamageFallback

                return (
                  <Fragment key={i}>
                    <tr>
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
                          <NumberInput
                            className={styles.manualBonusInput}
                            value={attack.attackBonus ?? 0}
                            onChange={(value) => setAttack(i, { attackBonus: value })}
                          />
                        ) : (
                          <span className={styles.bonusDisplay}>{formatBonus(bonus)}</span>
                        )}
                      </td>
                      <td className={styles.actionTd} data-label="Ações">
                        <div className={styles.rowActions}>
                          {(isEditMode || hasViewDetail) && (
                            <button
                              type="button"
                              className={styles.expandBtn}
                              onClick={() => toggleRow(i)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                            >
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          )}
                          {isEditMode && (
                            <button
                              type="button"
                              className={panelStyles.removeButton}
                              aria-label={`Remover ataque ${attack.name || i + 1}`}
                              onClick={() => removeAttack(i)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={styles.detailRow}>
                        <td colSpan={colSpan}>
                          {isEditMode ? (
                            <div className={styles.detailContent}>
                              <div className={styles.detailFieldsGrid}>
                                <label className={styles.detailField}>
                                  Alcance
                                  <input
                                    type="text"
                                    value={attack.range ?? ''}
                                    placeholder="1,5m"
                                    onChange={(event) =>
                                      setAttack(i, { range: event.target.value })
                                    }
                                  />
                                </label>
                                <label className={styles.detailField}>
                                  Tempo de Ação
                                  <input
                                    type="text"
                                    value={attack.castingTime ?? ''}
                                    placeholder="1 ação, 1 ação bônus, 1 reação..."
                                    onChange={(event) =>
                                      setAttack(i, { castingTime: event.target.value })
                                    }
                                  />
                                </label>
                                <label className={`${styles.detailField} ${styles.detailFieldFull}`}>
                                  Notas
                                  <textarea
                                    value={attack.notes ?? ''}
                                    placeholder="Observações do ataque"
                                    rows={3}
                                    onChange={(event) =>
                                      setAttack(i, { notes: event.target.value })
                                    }
                                  />
                                </label>
                              </div>
                              {hasLegacyDamageFallback && (
                                <span className={styles.legacyDamage}>
                                  Dano anterior: {legacyDamageLabel}
                                </span>
                              )}
                              <div>
                                <span className={styles.detailSectionLabel}>Danos</span>
                                <DamagesEditor
                                  damages={attack.damages ?? []}
                                  onChange={(updated) => setAttack(i, { damages: updated })}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className={styles.detailContent}>
                              {(hasCastingTime || hasRange || hasLegacyDamageFallback) && (
                                <div className={styles.metaRow}>
                                  {hasCastingTime && (
                                    <span className={styles.metaChip}>
                                      Tempo: {attack.castingTime}
                                    </span>
                                  )}
                                  {hasRange && (
                                    <span className={styles.metaChip}>
                                      Alcance: {attack.range}
                                    </span>
                                  )}
                                  {hasLegacyDamageFallback && (
                                    <span className={styles.metaChip}>
                                      Dano anterior: {legacyDamageLabel}
                                    </span>
                                  )}
                                </div>
                              )}
                              {hasNotes && (
                                <p className={styles.detailNotes}>{attack.notes}</p>
                              )}
                              {hasStructuredDamages && (
                                <div className={styles.rollArea}>
                                  <button
                                    type="button"
                                    className={styles.rollBtn}
                                    onClick={() => handleRollDamage(i, attack.damages ?? [])}
                                  >
                                    Rolar dano
                                  </button>
                                  {rollResults.has(i) && (
                                    <div className={styles.rollResult}>
                                      {rollResults.get(i)!.results.map((r, ri) => (
                                        <span key={ri} className={styles.rollLine}>
                                          {formatRollLine(r)}
                                        </span>
                                      ))}
                                      <span className={styles.rollTotal}>
                                        Total: {rollResults.get(i)!.total}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {!hasViewDetail && (
                                <span className={styles.emptyDetail}>
                                  Nenhum detalhe cadastrado.
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
