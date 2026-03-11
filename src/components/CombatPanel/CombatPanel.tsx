// src/components/CombatPanel/CombatPanel.tsx
// CA, iniciativa, HP (máx/atual/temp), velocidade, dados de vida e death saves

import { useEffect } from 'react'
import type { Character, HpBonusEntry } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'

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
  const ac = calcAC(character)
  const initiative = calcInitiative(character)
  const profBonus = calcProficiencyBonus(character.classes)
  const naturalHpMax = calcNaturalHpMax(character)
  const extraHpTotal = calcHpBonusTotal(character)
  const effectiveHpMax = calcEffectiveHpMax(character)

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }

  // HP atual nunca ultrapassa hpMax + hpTemp
  function setHpCurrent(value: number) {
    set('hpCurrent', clamp(value, 0, effectiveHpMax + character.hpTemp))
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

  useEffect(() => {
    const clampedCurrentHp = clamp(
      character.hpCurrent,
      0,
      effectiveHpMax + character.hpTemp,
    )

    if (clampedCurrentHp !== character.hpCurrent) {
      onChangeCharacter({ ...character, hpCurrent: clampedCurrentHp })
    }
  }, [character, effectiveHpMax, onChangeCharacter])

  const displayedCurrentHp = clamp(character.hpCurrent, 0, effectiveHpMax + character.hpTemp)
  const isDowned = displayedCurrentHp === 0

  return (
    <section>
      <h2>Combate</h2>

      {/* ── linha superior: CA / Iniciativa / Velocidade ── */}
      <div>
        <div>
          <span>CA</span>
          <strong>{ac}</strong>
          {isEditMode && (
            <label>
              Valor
              <input
                type="number"
                value={character.armorClassBase}
                onChange={(e) => set('armorClassBase', Number(e.target.value))}
                style={{ width: '3.5rem' }}
              />
            </label>
          )}
        </div>

        <div>
          <span>Iniciativa</span>
          <strong>{formatModifier(initiative)}</strong>
          {isEditMode && (
            <label>
              Bônus extra
              <input
                type="number"
                value={character.initiativeBonusExtra}
                onChange={(e) =>
                  set('initiativeBonusExtra', Number(e.target.value))
                }
                style={{ width: '3.5rem' }}
              />
            </label>
          )}
        </div>

        <div>
          <span>Velocidade</span>
          {isEditMode ? (
            <input
              type="text"
              value={character.speed}
              onChange={(e) => set('speed', e.target.value)}
              style={{ width: '5rem' }}
            />
          ) : (
            <strong>{character.speed}</strong>
          )}
        </div>

        <div>
          <span>Proficiência</span>
          <strong>{formatModifier(profBonus)}</strong>
        </div>
      </div>

      {/* ── HP ── */}
      <div>
        <div>
          <span>HP Máximo</span>
          {isEditMode && !character.hpAutoCalc ? (
            <input
              type="number"
              min={0}
              value={character.hpMax}
              onChange={(e) => set('hpMax', Number(e.target.value))}
              style={{ width: '4rem' }}
            />
          ) : (
            <strong>{effectiveHpMax}</strong>
          )}
          {character.hpAutoCalc && (
            <div>
              <small>Base: {naturalHpMax}</small>
              <small> · Extra: {formatModifier(extraHpTotal)}</small>
            </div>
          )}
          {isEditMode && (
            <label>
              HP automático
              <input
                type="checkbox"
                checked={character.hpAutoCalc}
                onChange={(e) => set('hpAutoCalc', e.target.checked)}
              />
            </label>
          )}
          {isEditMode && !character.hpAutoCalc && (
            <div>
              <small>HP sugerido pelas regras: {Math.max(0, naturalHpMax + extraHpTotal)}</small>
            </div>
          )}
        </div>

        <div>
          <span>HP Atual</span>
          <button onClick={() => setHpCurrent(displayedCurrentHp - 1)}>−</button>
          <strong>{displayedCurrentHp}</strong>
          <button onClick={() => setHpCurrent(displayedCurrentHp + 1)}>+</button>
        </div>

        <div>
          <span>HP Temporário</span>
          <button
            onClick={() =>
              set('hpTemp', Math.max(0, character.hpTemp - 1))
            }
          >
            −
          </button>
          <strong>{character.hpTemp}</strong>
          <button onClick={() => set('hpTemp', character.hpTemp + 1)}>+</button>
        </div>
      </div>

      {(isEditMode || character.hpBonusEntries.length > 0) && (
        <div>
          <h3>Ajustes extras de HP</h3>

          {character.hpBonusEntries.length === 0 ? (
            <p>Nenhum ajuste extra cadastrado.</p>
          ) : (
            character.hpBonusEntries.map((entry, index) => (
              <div key={`${entry.source}-${index}`}>
                {isEditMode ? (
                  <>
                    <input
                      type="number"
                      value={entry.value}
                      onChange={(e) =>
                        setHpBonusEntry(index, { value: Number(e.target.value) })
                      }
                      placeholder="Valor"
                      style={{ width: '4.5rem' }}
                    />
                    <input
                      type="text"
                      value={entry.source}
                      onChange={(e) =>
                        setHpBonusEntry(index, { source: e.target.value })
                      }
                      placeholder="Origem do bônus"
                      style={{ width: '16rem' }}
                    />
                    <button onClick={() => removeHpBonusEntry(index)}>Remover</button>
                  </>
                ) : (
                  <span>
                    <strong>{formatModifier(entry.value)}</strong> · {entry.source || 'Sem origem informada'}
                  </span>
                )}
              </div>
            ))
          )}

          {isEditMode && (
            <button onClick={addHpBonusEntry}>+ Ajuste de HP</button>
          )}
        </div>
      )}

      {/* ── Dados de vida ── */}
      <div>
        <span>Dados de vida: {totalHitDice(character)}</span>
        <span>Gastos: </span>
        <button
          onClick={() =>
            set('hitDiceSpent', Math.max(0, character.hitDiceSpent - 1))
          }
        >
          −
        </button>
        <strong>{character.hitDiceSpent}</strong>
        <button
          onClick={() => {
            const total = character.classes.reduce((s, c) => s + c.level, 0)
            set('hitDiceSpent', Math.min(total, character.hitDiceSpent + 1))
          }}
        >
          +
        </button>
      </div>

      {/* ── Death saves — só aparece quando desmaiado ── */}
      {(isDowned || isEditMode) && (
        <div>
          <h3>Testes de morte</h3>

          <div>
            <span>Sucessos</span>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="checkbox"
                checked={character.deathSaves.success > i}
                onChange={(e) =>
                  setDeathSave('success', e.target.checked ? i + 1 : i)
                }
              />
            ))}
          </div>

          <div>
            <span>Falhas</span>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="checkbox"
                checked={character.deathSaves.failure > i}
                onChange={(e) =>
                  setDeathSave('failure', e.target.checked ? i + 1 : i)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Inspiração heroica ── */}
      <div>
        <span>Inspiração heroica</span>
        <button
          onClick={() =>
            set('heroicInspiration', Math.max(0, character.heroicInspiration - 1))
          }
        >
          −
        </button>
        <strong>{character.heroicInspiration}</strong>
        <button
          onClick={() => set('heroicInspiration', character.heroicInspiration + 1)}
        >
          +
        </button>
      </div>
    </section>
  )
}