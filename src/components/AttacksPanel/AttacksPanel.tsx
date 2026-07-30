import { memo, useCallback, useRef, useState, Fragment } from 'react'
import type { Attack, AttackAttributeKey, Character, DamagePart } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import { NumberInput } from '../NumberInput/NumberInput'
import { DamagesEditor } from '../DamagesEditor/DamagesEditor'
import { rollDamages, type DamageRollSummary } from '../../utils/diceRoller'
import { RollResultBlock } from '../RollResultBlock/RollResultBlock'
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
    // Id de verdade já na criação, como `createAction()` faz do lado do
    // monstro. O fallback posicional do normalizador é só para ficha antiga.
    id: globalThis.crypto.randomUUID(),
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

function AttacksPanelImpl({
  attacks,
  character,
  isEditMode,
  onChangeAttacks,
}: AttacksPanelProps) {
  // Chaveados pelo id do ataque, não pelo índice: remover ou reordenar um
  // ataque não pode fazer o resultado de rolagem migrar para o vizinho.
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

  // Os handlers abaixo são props das linhas memoizadas, então precisam ser
  // estáveis entre renders — um handler novo a cada render invalidaria o memo
  // de todas as linhas. Leem `attacks` de uma ref para não depender da
  // identidade do array.
  const attacksRef = useRef(attacks)
  attacksRef.current = attacks

  const toggleRow = useCallback((attackId: string) => {
    setExpandedRows((previous) => {
      const next = new Set(previous)
      if (next.has(attackId)) {
        next.delete(attackId)
      } else {
        next.add(attackId)
      }
      return next
    })
  }, [])

  const handleRollDamage = useCallback((attackId: string, damages: DamagePart[]) => {
    setRollResults((previous) => new Map(previous).set(attackId, rollDamages(damages)))
  }, [])

  const clearRollResult = useCallback((attackId: string) => {
    setRollResults((previous) => {
      if (!previous.has(attackId)) return previous
      const next = new Map(previous)
      next.delete(attackId)
      return next
    })
  }, [])

  const setAttack = useCallback((index: number, partial: Partial<Attack>) => {
    onChangeAttacks(attacksRef.current.map((attack, currentIndex) => (
      currentIndex === index ? { ...attack, ...partial } : attack
    )))
  }, [onChangeAttacks])

  function addAttack() {
    onChangeAttacks([...attacks, createAttack()])
  }

  const removeAttack = useCallback((index: number) => {
    onChangeAttacks(attacksRef.current.filter((_, currentIndex) => currentIndex !== index))
  }, [onChangeAttacks])

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
              {attacks.map((attack, i) => (
                <AttackRow
                  key={attack.id || `attack-${i}`}
                  attack={attack}
                  index={i}
                  character={character}
                  isEditMode={isEditMode}
                  expandedRows={expandedRows}
                  rollResults={rollResults}
                  onToggleRow={toggleRow}
                  onChangeAttack={setAttack}
                  onRemoveAttack={removeAttack}
                  onRollDamage={handleRollDamage}
                  onClearRoll={clearRollResult}
                />
              ))}
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

interface AttackRowProps {
  attack: Attack
  index: number
  character: Character
  isEditMode: boolean
  expandedRows: Set<string>
  rollResults: Map<string, DamageRollSummary>
  onToggleRow: (attackId: string) => void
  onChangeAttack: (index: number, partial: Partial<Attack>) => void
  onRemoveAttack: (index: number) => void
  onRollDamage: (attackId: string, damages: DamagePart[]) => void
  onClearRoll: (attackId: string) => void
}

// Cada ataque é memoizado: sem isso, digitar em um ataque re-renderiza todos —
// medido em 11 renders para uma tecla numa lista de 10.
const AttackRow = memo(function AttackRow({
  attack,
  index: i,
  character,
  isEditMode,
  expandedRows,
  rollResults,
  onToggleRow,
  onChangeAttack,
  onRemoveAttack,
  onRollDamage,
  onClearRoll,
}: AttackRowProps) {
  const attackId = attack.id || `attack-${i}`
  const bonus = calcAttackBonus(attack, character)
  const isExpanded = expandedRows.has(attackId)
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
    <Fragment key={attackId}>
      <tr>
        <td className={styles.nameTd} data-label="Nome">
          {isEditMode ? (
            <input
              type="text"
              value={attack.name ?? ''}
              placeholder="Nome"
              onChange={(event) => onChangeAttack(i, { name: event.target.value })}
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
                onChangeAttack(i, {
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
              onChangeAttack(i, { useProficiency: event.target.checked })
            }
          />
        </td>
        <td className={styles.bonusTd} data-label="Bônus">
          {attack.attributeKey === 'manual' && isEditMode ? (
            <NumberInput
              className={styles.manualBonusInput}
              value={attack.attackBonus ?? 0}
              onChange={(value) => onChangeAttack(i, { attackBonus: value })}
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
                onClick={() => onToggleRow(attackId)}
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
                onClick={() => onRemoveAttack(i)}
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
                        onChangeAttack(i, { range: event.target.value })
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
                        onChangeAttack(i, { castingTime: event.target.value })
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
                        onChangeAttack(i, { notes: event.target.value })
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
                    onChange={(updated) => onChangeAttack(i, { damages: updated })}
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
                      onClick={() => onRollDamage(attackId, attack.damages ?? [])}
                    >
                      Rolar dano
                    </button>
                    {rollResults.has(attackId) && (
                      <RollResultBlock
                        summary={rollResults.get(attackId)!}
                        itemName={attack.name}
                        onClear={() => onClearRoll(attackId)}
                      />
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
})

// Memoizado: os painéis recebem props estreitas e handlers estáveis da
// página, então a comparação rasa aborta o render quando a edição foi em
// outra parte da ficha.
export const AttacksPanel = memo(AttacksPanelImpl)
