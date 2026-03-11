// src/components/SpellsPanel/SpellsPanel.tsx
// Magias por nível, spell slots (atual/máx) e lista de magias

import { useState } from 'react'
import type { Character, Spell } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './SpellsPanel.module.css'

// ─── spell slots ─────────────────────────────────────────────────────────────

interface SpellSlots {
  [level: number]: { current: number; max: number }
}

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const SPELL_SCHOOLS = [
  'Abjuração',
  'Adivinhação',
  'Conjuração',
  'Encantamento',
  'Evocação',
  'Ilusão',
  'Necromancia',
  'Transmutação',
]
const LEVEL_LABEL: Record<number, string> = {
  0: 'Truques',
  1: '1º nível', 2: '2º nível', 3: '3º nível',
  4: '4º nível', 5: '5º nível', 6: '6º nível',
  7: '7º nível', 8: '8º nível', 9: '9º nível',
}

function createSpell(): Spell {
  return {
    name: '',
    level: 0,
    school: '',
    castingTime: '',
    range: '',
    duration: '',
    components: [],
    prepared: false,
    description: '',
  }
}

// SpellSlots são guardados em spells[0].extraData por simplicidade,
// mas para não poluir o tipo Spell usamos um campo auxiliar no componente
// e persistimos via onChangeSlotsData
interface SpellsPanelProps {
  spells: Spell[]
  character: Character
  isEditMode: boolean
  onChangeSpells: (updated: Spell[]) => void
  slotsData: SpellSlots
  onChangeSlotsData: (updated: SpellSlots) => void
}

export function SpellsPanel({
  spells,
  character,
  isEditMode,
  onChangeSpells,
  slotsData,
  onChangeSlotsData,
}: SpellsPanelProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]))

  function toggleLevel(level: number) {
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      next.has(level) ? next.delete(level) : next.add(level)
      return next
    })
  }

  function setSpell(index: number, partial: Partial<Spell>) {
    onChangeSpells(spells.map((s, i) => (i === index ? { ...s, ...partial } : s)))
  }

  function addSpell(level: number) {
    onChangeSpells([...spells, { ...createSpell(), level }])
  }

  function removeSpell(index: number) {
    onChangeSpells(spells.filter((_, i) => i !== index))
  }

  function setSlot(level: number, field: 'current' | 'max', value: number) {
    const prev = slotsData[level] ?? { current: 0, max: 0 }
    const next = { ...prev, [field]: Math.max(0, value) }
    if (field === 'current') next.current = Math.min(next.current, next.max)
    onChangeSlotsData({ ...slotsData, [level]: next })
  }

  const spellsByLevel = SPELL_LEVELS.reduce<Record<number, Spell[]>>(
    (acc, level) => {
      acc[level] = spells.filter((s) => (s.level ?? 0) === level)
      return acc
    },
    {}
  )

  const usedLevels = isEditMode
    ? SPELL_LEVELS
    : SPELL_LEVELS.filter(
        (l) =>
          spellsByLevel[l].length > 0 ||
          (slotsData[l]?.max ?? 0) > 0
      )

  if (usedLevels.length === 0) return null

  return (
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Magias</h2>
        <p className={styles.summary}>Habilidade de conjuração: {character.spellcastingAbility || '—'}</p>
      </div>

      {usedLevels.map((level) => {
        const slots = slotsData[level] ?? { current: 0, max: 0 }
        const levelSpells = spellsByLevel[level]
        const expanded = expandedLevels.has(level)

        return (
          <div className={styles.levelBlock} key={level}>
            <div className={styles.levelHeader}>
              <button className={styles.levelToggle} onClick={() => toggleLevel(level)}>
                {expanded ? '▾' : '▸'} {LEVEL_LABEL[level]}
              </button>

              {level > 0 && (
                <span className={styles.slotControls}>
                  {isEditMode ? (
                    <label className={styles.slotField}>
                        Slots máx
                        <input
                          className={panelStyles.compactInput}
                          type="number"
                          min={0}
                          value={slots.max}
                          onChange={(e) =>
                            setSlot(level, 'max', Number(e.target.value))
                          }
                        />
                      </label>
                  ) : slots.max > 0 ? (
                    <>
                      <button
                        onClick={() => setSlot(level, 'current', slots.current - 1)}
                      >
                        −
                      </button>
                      <span className={styles.slotCount}>{slots.current} / {slots.max}</span>
                      <button
                        onClick={() => setSlot(level, 'current', slots.current + 1)}
                      >
                        +
                      </button>
                    </>
                  ) : null}
                </span>
              )}
            </div>

            {expanded && (
              <ul className={styles.spellsList}>
                {levelSpells.map((spell, i) => {
                  const globalIndex = spells.indexOf(spell)
                  return (
                    <li className={styles.spellItem} key={globalIndex}>
                      {isEditMode ? (
                        <div className={styles.spellEditForm}>
                          <input
                            className={styles.spellName}
                            type="text"
                            value={spell.name ?? ''}
                            placeholder="Nome da magia"
                            onChange={(e) =>
                              setSpell(globalIndex, { name: e.target.value })
                            }
                          />
                          <select
                            value={spell.school ?? ''}
                            onChange={(e) =>
                              setSpell(globalIndex, { school: e.target.value })
                            }
                          >
                            <option value="">Escola</option>
                            {SPELL_SCHOOLS.map((school) => (
                              <option key={school} value={school}>
                                {school}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={spell.castingTime ?? ''}
                            placeholder="Tempo de conjuração"
                            onChange={(e) =>
                              setSpell(globalIndex, { castingTime: e.target.value })
                            }
                          />
                          <input
                            type="text"
                            value={spell.range ?? ''}
                            placeholder="Alcance"
                            onChange={(e) =>
                              setSpell(globalIndex, { range: e.target.value })
                            }
                          />
                          <input
                            type="text"
                            value={spell.duration ?? ''}
                            placeholder="Duração"
                            onChange={(e) =>
                              setSpell(globalIndex, { duration: e.target.value })
                            }
                          />
                          <label className={panelStyles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={spell.concentration ?? false}
                              onChange={(e) =>
                                setSpell(globalIndex, { concentration: e.target.checked })
                              }
                            />
                            Conc.
                          </label>
                          <label className={panelStyles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={spell.prepared ?? false}
                              onChange={(e) =>
                                setSpell(globalIndex, { prepared: e.target.checked })
                              }
                            />
                            Prep.
                          </label>
                          <textarea
                            className={styles.spellDescription}
                            value={spell.description ?? ''}
                            placeholder="Descrição"
                            rows={2}
                            onChange={(e) =>
                              setSpell(globalIndex, { description: e.target.value })
                            }
                          />
                          <button className={panelStyles.removeButton} onClick={() => removeSpell(globalIndex)}>
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className={styles.spellReadRow}>
                          <span className={styles.spellMarker}>{spell.prepared ? '★' : '☆'}</span>
                          <strong>
                            {spell.name || '—'}
                            {spell.school ? ` (${spell.school})` : ''}
                          </strong>
                          {spell.concentration && <span className={styles.spellMeta}>[C]</span>}
                          <span className={styles.spellMeta}>· {spell.castingTime || '—'}</span>
                          <span className={styles.spellMeta}>· {spell.range || '—'}</span>
                          <span className={styles.spellMeta}>· {spell.duration || '—'}</span>
                        </div>
                      )}
                    </li>
                  )
                })}

                {isEditMode && (
                  <li>
                    <button className={panelStyles.addButton} onClick={() => addSpell(level)}>
                      + Magia
                    </button>
                  </li>
                )}

                {levelSpells.length === 0 && !isEditMode && (
                  <li className={panelStyles.emptyState}>Nenhuma magia.</li>
                )}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}