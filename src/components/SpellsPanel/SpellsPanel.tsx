// src/components/SpellsPanel/SpellsPanel.tsx
// Magias por nível, spell slots (atual/máx) e lista de magias

import { useState } from 'react'
import type { Character, Spell } from '../../types/system/dnd'

// ─── spell slots ─────────────────────────────────────────────────────────────

interface SpellSlots {
  [level: number]: { current: number; max: number }
}

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
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
    <section>
      <h2>Magias</h2>
      <p>Habilidade de conjuração: {character.spellcastingAbility || '—'}</p>

      {usedLevels.map((level) => {
        const slots = slotsData[level] ?? { current: 0, max: 0 }
        const levelSpells = spellsByLevel[level]
        const expanded = expandedLevels.has(level)

        return (
          <div key={level}>
            {/* cabeçalho do nível */}
            <div>
              <button onClick={() => toggleLevel(level)}>
                {expanded ? '▾' : '▸'} {LEVEL_LABEL[level]}
              </button>

              {level > 0 && (
                <span>
                  {isEditMode ? (
                    <>
                      <label>
                        Slots máx
                        <input
                          type="number"
                          min={0}
                          value={slots.max}
                          onChange={(e) =>
                            setSlot(level, 'max', Number(e.target.value))
                          }
                          style={{ width: '3rem' }}
                        />
                      </label>
                    </>
                  ) : slots.max > 0 ? (
                    <>
                      <button
                        onClick={() => setSlot(level, 'current', slots.current - 1)}
                      >
                        −
                      </button>
                      <span>{slots.current} / {slots.max}</span>
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

            {/* lista de magias do nível */}
            {expanded && (
              <ul>
                {levelSpells.map((spell, i) => {
                  const globalIndex = spells.indexOf(spell)
                  return (
                    <li key={globalIndex}>
                      {isEditMode ? (
                        <>
                          <input
                            type="text"
                            value={spell.name ?? ''}
                            placeholder="Nome da magia"
                            onChange={(e) =>
                              setSpell(globalIndex, { name: e.target.value })
                            }
                          />
                          <input
                            type="text"
                            value={spell.castingTime ?? ''}
                            placeholder="Tempo de conjuração"
                            onChange={(e) =>
                              setSpell(globalIndex, { castingTime: e.target.value })
                            }
                            style={{ width: '8rem' }}
                          />
                          <input
                            type="text"
                            value={spell.range ?? ''}
                            placeholder="Alcance"
                            onChange={(e) =>
                              setSpell(globalIndex, { range: e.target.value })
                            }
                            style={{ width: '5rem' }}
                          />
                          <input
                            type="text"
                            value={spell.duration ?? ''}
                            placeholder="Duração"
                            onChange={(e) =>
                              setSpell(globalIndex, { duration: e.target.value })
                            }
                            style={{ width: '7rem' }}
                          />
                          <label>
                            Conc.
                            <input
                              type="checkbox"
                              checked={!!(spell as any).concentration}
                              onChange={(e) =>
                                setSpell(globalIndex, {
                                  concentration: e.target.checked,
                                } as any)
                              }
                            />
                          </label>
                          <label>
                            Prep.
                            <input
                              type="checkbox"
                              checked={spell.prepared ?? false}
                              onChange={(e) =>
                                setSpell(globalIndex, { prepared: e.target.checked })
                              }
                            />
                          </label>
                          <textarea
                            value={spell.description ?? ''}
                            placeholder="Descrição"
                            rows={2}
                            onChange={(e) =>
                              setSpell(globalIndex, { description: e.target.value })
                            }
                          />
                          <button onClick={() => removeSpell(globalIndex)}>
                            Remover
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{spell.prepared ? '★' : '☆'}</span>
                          <strong>{spell.name || '—'}</strong>
                          {(spell as any).concentration && <span> [C]</span>}
                          <span> · {spell.castingTime || '—'}</span>
                          <span> · {spell.range || '—'}</span>
                          <span> · {spell.duration || '—'}</span>
                        </>
                      )}
                    </li>
                  )
                })}

                {isEditMode && (
                  <li>
                    <button onClick={() => addSpell(level)}>
                      + Magia
                    </button>
                  </li>
                )}

                {levelSpells.length === 0 && !isEditMode && (
                  <li>Nenhuma magia.</li>
                )}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}