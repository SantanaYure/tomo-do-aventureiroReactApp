// src/components/CombatPanel/CombatPanel.tsx
// CA, iniciativa, HP (máx/atual/temp), velocidade, dados de vida e death saves

import { useEffect, useState } from 'react'
import type { Character, HpBonusEntry } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './CombatPanel.module.css'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'

const DAMAGE_TYPES = [
  'Ácido',
  'Concussão',
  'Cortante',
  'Fogo',
  'Frio',
  'Força',
  'Fulgurante',
  'Necrótico',
  'Perfurante',
  'Psíquico',
  'Radiante',
  'Trovão',
  'Veneno',
] as const

type HpActionType = 'damage' | 'heal' | 'temp'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function getAttrMod(character: Character, name: string): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function parseHitDie(hitDice: string): number {
  const match = /d(\d+)/i.exec(hitDice)
  if (!match) return 0

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : 0
}

function calcHitDieAverage(hitDice: string): number {
  const sides = parseHitDie(hitDice)
  return sides > 0 ? Math.floor(sides / 2) + 1 : 0
}

function calcNaturalHpMax(character: Character): number {
  const constitutionModifier = getAttrMod(character, 'Constituição')
  let total = 0
  let consumedFirstLevel = false

  character.classes.forEach((currentClass) => {
    const levels = Math.max(0, Math.trunc(currentClass.level))
    const fullHitDie = parseHitDie(currentClass.hitDice)
    const averageHitDie = calcHitDieAverage(currentClass.hitDice)

    if (levels === 0 || fullHitDie === 0) {
      return
    }

    for (let level = 0; level < levels; level += 1) {
      const baseGain = consumedFirstLevel ? averageHitDie : fullHitDie
      total += Math.max(1, baseGain + constitutionModifier)
      consumedFirstLevel = true
    }
  })

  return Math.max(0, total)
}

function calcHpBonusTotal(character: Character): number {
  return character.hpBonusEntries.reduce((sum, entry) => {
    const value = Number(entry.value)
    return sum + (Number.isFinite(value) ? Math.trunc(value) : 0)
  }, 0)
}

function calcEffectiveHpMax(character: Character): number {
  if (!character.hpAutoCalc) {
    return Math.max(0, Math.trunc(character.hpMax))
  }

  return Math.max(0, calcNaturalHpMax(character) + calcHpBonusTotal(character))
}

function calcAC(character: Character): number {
  return Math.max(0, Math.trunc(character.armorClassBase))
}

function calcInitiative(character: Character): number {
  return getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
}

function totalHitDice(character: Character): string {
  const hitDiceSummary = character.classes
    .map((currentClass) => {
      const hitDieSuffix = currentClass.hitDice.replace(/^\d+/, '')
      return hitDieSuffix ? `${currentClass.level}${hitDieSuffix}` : ''
    })
    .filter(Boolean)

  return hitDiceSummary.join(' + ') || '—'
}

function createHpBonusEntry(): HpBonusEntry {
  return {
    value: 0,
    source: '',
  }
}

function normalizeNonNegativeInt(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

// ─── props ───────────────────────────────────────────────────────────────────

interface CombatPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

// ─── componente ──────────────────────────────────────────────────────────────

export function CombatPanel({
  character,
  isEditMode,
  onChangeCharacter,
}: CombatPanelProps) {
  const [actionValue, setActionValue] = useState('')
  const [damageType, setDamageType] = useState<(typeof DAMAGE_TYPES)[number]>('Concussão')
  const ac = calcAC(character)
  const initiative = calcInitiative(character)
  const profBonus = calcProficiencyBonus(character.classes)
  const naturalHpMax = calcNaturalHpMax(character)
  const extraHpTotal = calcHpBonusTotal(character)
  const effectiveHpMax = calcEffectiveHpMax(character)
  const suggestedHpMax = Math.max(0, naturalHpMax + extraHpTotal)
  const totalHitDiceAvailable = character.classes.reduce(
    (sum, currentClass) => sum + Math.max(0, Math.trunc(currentClass.level)),
    0,
  )

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }

  function setHpCurrent(value: number) {
    set('hpCurrent', clamp(value, 0, effectiveHpMax))
  }

  function setQuickHpCurrent(value: number) {
    set('hpCurrent', clamp(value, 0, effectiveHpMax))
  }

  function setQuickHpTemp(value: number) {
    set('hpTemp', normalizeNonNegativeInt(value))
  }

  function setDeathSave(field: 'success' | 'failure', value: number) {
    onChangeCharacter({
      ...character,
      deathSaves: {
        ...character.deathSaves,
        [field]: clamp(value, 0, 3),
      },
    })
  }

  function setHpBonusEntry(index: number, partial: Partial<HpBonusEntry>) {
    set(
      'hpBonusEntries',
      character.hpBonusEntries.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, ...partial } : entry,
      ),
    )
  }

  function addHpBonusEntry() {
    set('hpBonusEntries', [...character.hpBonusEntries, createHpBonusEntry()])
  }

  function removeHpBonusEntry(index: number) {
    set(
      'hpBonusEntries',
      character.hpBonusEntries.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  function applyAction(type: HpActionType) {
    const value = Math.trunc(Number(actionValue))

    if (!Number.isFinite(value) || value <= 0) {
      return
    }

    const currentHp = clamp(character.hpCurrent, 0, effectiveHpMax)
    const currentTempHp = normalizeNonNegativeInt(character.hpTemp)
    let nextCurrentHp = currentHp
    let nextTempHp = currentTempHp

    if (type === 'damage') {
      const absorbed = Math.min(nextTempHp, value)
      nextTempHp -= absorbed
      nextCurrentHp = Math.max(0, nextCurrentHp - (value - absorbed))
    }

    if (type === 'heal') {
      nextCurrentHp = Math.min(effectiveHpMax, nextCurrentHp + value)
    }

    if (type === 'temp') {
      nextTempHp = value > currentTempHp ? value : currentTempHp
    }

    onChangeCharacter({
      ...character,
      hpCurrent: nextCurrentHp,
      hpTemp: nextTempHp,
    })

    setActionValue('')
  }

  useEffect(() => {
    const clampedCurrentHp = clamp(character.hpCurrent, 0, effectiveHpMax)

    if (clampedCurrentHp !== character.hpCurrent) {
      onChangeCharacter({ ...character, hpCurrent: clampedCurrentHp })
    }
  }, [character, effectiveHpMax, onChangeCharacter])

  const displayedCurrentHp = clamp(character.hpCurrent, 0, effectiveHpMax)
  const quickCurrentHp = clamp(character.hpCurrent, 0, effectiveHpMax)
  const quickTempHp = normalizeNonNegativeInt(character.hpTemp)
  const isDowned = displayedCurrentHp === 0
  const remainingHitDice = Math.max(0, totalHitDiceAvailable - character.hitDiceSpent)

  function renderDeathDots(field: 'success' | 'failure', label: string) {
    const currentValue = character.deathSaves[field]

    return (
      <div className={styles.deathRow}>
        <span className={styles.deathLabel}>{label}</span>

        <div className={styles.deathDots}>
          {[0, 1, 2].map((index) => {
            const isFilled = currentValue > index

            return (
              <button
                key={index}
                type="button"
                className={isFilled ? `${styles.deathDot} ${styles.deathDotFilled}` : styles.deathDot}
                aria-label={`${label} ${index + 1}`}
                aria-pressed={isFilled}
                onClick={() => setDeathSave(field, isFilled ? index : index + 1)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Combate</h2>
        <p className={styles.summary}>CA, iniciativa, pontos de vida e recuperação.</p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>CA</span>
          <strong className={styles.statValue}>{ac}</strong>

          {isEditMode ? (
            <label className={styles.editField}>
              Valor base
              <input
                className={`${panelStyles.compactInput} ${styles.statInput}`}
                type="number"
                value={character.armorClassBase}
                onChange={(e) => set('armorClassBase', Number(e.target.value))}
              />
            </label>
          ) : (
            <span className={styles.statNote}>Base da defesa atual</span>
          )}
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Iniciativa</span>
          <strong className={styles.statValue}>{formatModifier(initiative)}</strong>

          {isEditMode ? (
            <label className={styles.editField}>
              Bônus extra
              <input
                className={`${panelStyles.compactInput} ${styles.statInput}`}
                type="number"
                value={character.initiativeBonusExtra}
                onChange={(e) => set('initiativeBonusExtra', Number(e.target.value))}
              />
            </label>
          ) : (
            <span className={styles.statNote}>Destreza + ajustes</span>
          )}
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Velocidade</span>

          {isEditMode ? (
            <label className={styles.editField}>
              Deslocamento
              <input
                className={`${panelStyles.mediumInput} ${styles.textInput}`}
                type="text"
                value={character.speed}
                onChange={(e) => set('speed', e.target.value)}
              />
            </label>
          ) : (
            <>
              <strong className={styles.statValue}>{character.speed}</strong>
              <span className={styles.statNote}>Deslocamento atual</span>
            </>
          )}
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Proficiência</span>
          <strong className={styles.statValue}>{formatModifier(profBonus)}</strong>
          <span className={styles.statNote}>Derivada do nível total</span>
        </div>
      </div>

      <div className={styles.hpSection}>
        <div className={styles.hpHeader}>
          <h3 className={styles.hpTitle}>Pontos de Vida</h3>

          {isEditMode && (
            <label className={`${panelStyles.checkboxLabel} ${styles.hpToggle}`}>
              <input
                type="checkbox"
                checked={character.hpAutoCalc}
                onChange={(e) => set('hpAutoCalc', e.target.checked)}
              />
              HP automático
            </label>
          )}
        </div>

        {isEditMode ? (
          <div className={styles.hpRow}>
            <div className={styles.hpBlock}>
              <span className={styles.hpBlockLabel}>Máximo</span>

              {isEditMode && !character.hpAutoCalc ? (
                <input
                  className={`${panelStyles.compactInput} ${styles.hpInput}`}
                  type="number"
                  min={0}
                  value={character.hpMax}
                  onChange={(e) => set('hpMax', Number(e.target.value))}
                />
              ) : (
                <strong className={styles.hpValue}>{effectiveHpMax}</strong>
              )}

              {character.hpAutoCalc ? (
                <span className={styles.hpMaxAuto}>
                  Base: {naturalHpMax} · Extra: {formatModifier(extraHpTotal)}
                </span>
              ) : (
                isEditMode && (
                  <span className={styles.hpMaxAuto}>Sugestão pelas regras: {suggestedHpMax}</span>
                )
              )}
            </div>

            <div className={styles.hpBlock}>
              <span className={styles.hpBlockLabel}>Atual</span>

              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Reduzir HP atual"
                  onClick={() => setHpCurrent(displayedCurrentHp - 1)}
                >
                  −
                </button>

                <input
                  className={`${panelStyles.compactInput} ${styles.hpInput}`}
                  type="number"
                  min={0}
                  max={effectiveHpMax}
                  value={displayedCurrentHp}
                  onChange={(e) => setHpCurrent(Number(e.target.value))}
                />

                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Aumentar HP atual"
                  onClick={() => setHpCurrent(displayedCurrentHp + 1)}
                >
                  +
                </button>
              </div>

              <span className={styles.hpMaxAuto}>Limite: {effectiveHpMax}</span>
            </div>

            <div className={styles.hpBlock}>
              <span className={styles.hpBlockLabel}>Temporário</span>

              <div className={styles.stepper}>
                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Reduzir HP temporário"
                  onClick={() => set('hpTemp', Math.max(0, quickTempHp - 1))}
                >
                  −
                </button>

                <input
                  className={`${panelStyles.compactInput} ${styles.hpInput}`}
                  type="number"
                  min={0}
                  value={quickTempHp}
                  onChange={(e) => set('hpTemp', normalizeNonNegativeInt(Number(e.target.value)))}
                />

                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Aumentar HP temporário"
                  onClick={() => set('hpTemp', quickTempHp + 1)}
                >
                  +
                </button>
              </div>

              <span className={styles.hpMaxAuto}>Absorve dano antes do HP atual</span>
            </div>
          </div>
        ) : (
          <div className={styles.hpManager}>
            <div className={styles.hpDisplay}>
              <span className={styles.hpBlockLabel}>HP Atual:</span>
              <input
                className={styles.hpCurrent}
                type="number"
                min={0}
                max={effectiveHpMax}
                value={quickCurrentHp}
                onChange={(event) => setQuickHpCurrent(Number(event.target.value))}
              />
              <span className={styles.hpSeparator}>/</span>
              <span className={styles.hpMax}>{effectiveHpMax}</span>
            </div>

            <div className={styles.hpTemp}>
              <span>Vida Temporária:</span>
              <input
                className={styles.hpTempInput}
                type="number"
                min={0}
                value={quickTempHp}
                onChange={(event) => setQuickHpTemp(Number(event.target.value))}
              />
            </div>

            <div className={styles.actionForm}>
              <div className={styles.actionInputRow}>
                <input
                  className={styles.actionValueInput}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="Valor"
                  value={actionValue}
                  onChange={(event) =>
                    setActionValue(event.target.value.replace(/[^\d]/g, ''))
                  }
                />

                <select
                  className={styles.damageTypeSelect}
                  value={damageType}
                  onChange={(event) =>
                    setDamageType(event.target.value as (typeof DAMAGE_TYPES)[number])
                  }
                >
                  {DAMAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.actionButtonRow}>
                <button
                  type="button"
                  className={styles.btnDano}
                  onClick={() => applyAction('damage')}
                >
                  Dano
                </button>
                <button
                  type="button"
                  className={styles.btnCura}
                  onClick={() => applyAction('heal')}
                >
                  Cura
                </button>
                <button
                  type="button"
                  className={styles.btnTemp}
                  onClick={() => applyAction('temp')}
                >
                  Temp
                </button>
              </div>
            </div>
          </div>
        )}

        {(isEditMode || character.hpBonusEntries.length > 0) && (
          <div className={styles.bonusSection}>
            <span className={styles.hpBlockLabel}>Bônus de HP</span>

            {character.hpBonusEntries.length === 0 ? (
              <p className={panelStyles.emptyState}>Nenhum ajuste extra cadastrado.</p>
            ) : (
              character.hpBonusEntries.map((entry, index) => (
                <div className={styles.bonusEntry} key={index}>
                  {isEditMode ? (
                    <>
                      <input
                        className={styles.bonusValueInput}
                        type="number"
                        value={entry.value}
                        onChange={(e) =>
                          setHpBonusEntry(index, { value: Number(e.target.value) })
                        }
                        placeholder="Valor"
                      />

                      <input
                        className={styles.bonusSourceInput}
                        type="text"
                        value={entry.source}
                        onChange={(e) =>
                          setHpBonusEntry(index, { source: e.target.value })
                        }
                        placeholder="Origem do bônus"
                      />

                      <button
                        type="button"
                        className={panelStyles.removeButton}
                        onClick={() => removeHpBonusEntry(index)}
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <span className={styles.bonusText}>
                      <strong>{formatModifier(entry.value)}</strong> ·{' '}
                      {entry.source || 'Sem origem informada'}
                    </span>
                  )}
                </div>
              ))
            )}

            {isEditMode && (
              <div className={styles.bonusActions}>
                <button
                  type="button"
                  className={panelStyles.addButton}
                  onClick={addHpBonusEntry}
                >
                  + Ajuste de HP
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.hitDiceRow}>
        <div className={styles.hitDiceInfo}>
          <span className={styles.hitDiceLabel}>Dados de vida</span>
          <strong className={styles.hitDiceValue}>{totalHitDice(character)}</strong>
          <span className={styles.statNote}>
            Restantes: {remainingHitDice} de {totalHitDiceAvailable}
          </span>
        </div>

        <div className={styles.hitDiceControls}>
          <span className={styles.statNote}>Gastos</span>

          <div className={styles.stepper}>
            <button
              type="button"
              className={styles.stepperButton}
              aria-label="Reduzir dados de vida gastos"
              onClick={() => set('hitDiceSpent', Math.max(0, character.hitDiceSpent - 1))}
            >
              −
            </button>

            {isEditMode ? (
              <input
                className={`${panelStyles.compactInput} ${styles.statInput}`}
                type="number"
                min={0}
                max={totalHitDiceAvailable}
                value={character.hitDiceSpent}
                onChange={(e) =>
                  set(
                    'hitDiceSpent',
                    clamp(Number(e.target.value), 0, totalHitDiceAvailable),
                  )
                }
              />
            ) : (
              <strong className={styles.stepperCounter}>{character.hitDiceSpent}</strong>
            )}

            <button
              type="button"
              className={styles.stepperButton}
              aria-label="Aumentar dados de vida gastos"
              onClick={() =>
                set('hitDiceSpent', Math.min(totalHitDiceAvailable, character.hitDiceSpent + 1))
              }
            >
              +
            </button>
          </div>
        </div>
      </div>

      {(isDowned || isEditMode) && (
        <div className={styles.deathSaves}>
          <h3 className={styles.deathSavesTitle}>Testes de morte</h3>
          {renderDeathDots('success', 'Sucessos')}
          {renderDeathDots('failure', 'Falhas')}
        </div>
      )}

      <div className={styles.inspirationRow}>
        <span className={styles.inspirationLabel}>Inspiração heroica</span>

        <div className={styles.inspirationControls}>
          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Reduzir inspiração heroica"
            onClick={() =>
              set('heroicInspiration', Math.max(0, character.heroicInspiration - 1))
            }
          >
            −
          </button>

          <button
            type="button"
            className={
              character.heroicInspiration > 0
                ? `${styles.inspirationBtn} ${styles.inspirationActive}`
                : styles.inspirationBtn
            }
            aria-label="Alternar inspiração heroica"
            aria-pressed={character.heroicInspiration > 0}
            onClick={() =>
              set('heroicInspiration', character.heroicInspiration > 0 ? 0 : 1)
            }
          >
            {character.heroicInspiration}
          </button>

          <button
            type="button"
            className={styles.stepperButton}
            aria-label="Aumentar inspiração heroica"
            onClick={() => set('heroicInspiration', character.heroicInspiration + 1)}
          >
            +
          </button>
        </div>

        <span className={styles.statNote}>Controle manual do total disponível.</span>
      </div>
    </section>
  )
}