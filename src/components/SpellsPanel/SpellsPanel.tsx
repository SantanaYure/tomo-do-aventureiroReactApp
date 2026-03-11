// src/components/SpellsPanel/SpellsPanel.tsx
import { useState } from 'react'
import type { Character, Spell } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './SpellsPanel.module.css'

interface SpellSlots { [level: number]: { current: number; max: number } }

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const LEVEL_LABEL: Record<number, string> = {
  0: 'Truques',
  1: '1º nível', 2: '2º nível', 3: '3º nível',
  4: '4º nível', 5: '5º nível', 6: '6º nível',
  7: '7º nível', 8: '8º nível', 9: '9º nível',
}

const SCHOOLS = ['Abjuração','Adivinhação','Conjuração','Encantamento','Evocação','Ilusão','Necromancia','Transmutação']

function createSpell(): Spell {
  return { name: '', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], prepared: false, description: '' }
}

interface SpellsPanelProps {
  spells: Spell[]
  character: Character
  isEditMode: boolean
  onChangeSpells: (updated: Spell[]) => void
  slotsData: SpellSlots
  onChangeSlotsData: (updated: SpellSlots) => void
}

export function SpellsPanel({ spells, character, isEditMode, onChangeSpells, slotsData, onChangeSlotsData }: SpellsPanelProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]))

  function toggleLevel(level: number) {
    setExpandedLevels((prev) => { const next = new Set(prev); next.has(level) ? next.delete(level) : next.add(level); return next })
  }
  function setSpell(index: number, partial: Partial<Spell>) {
    onChangeSpells(spells.map((s, i) => (i === index ? { ...s, ...partial } : s)))
  }
  function addSpell(level: number) { onChangeSpells([...spells, { ...createSpell(), level }]) }
  function removeSpell(index: number) { onChangeSpells(spells.filter((_, i) => i !== index)) }
  function setSlot(level: number, field: 'current' | 'max', value: number) {
    const prev = slotsData[level] ?? { current: 0, max: 0 }
    const next = { ...prev, [field]: Math.max(0, value) }
    if (field === 'current') next.current = Math.min(next.current, next.max)
    onChangeSlotsData({ ...slotsData, [level]: next })
  }

  const spellsByLevel = SPELL_LEVELS.reduce<Record<number, Spell[]>>((acc, level) => {
    acc[level] = spells.filter((s) => (s.level ?? 0) === level); return acc
  }, {})

  const usedLevels = isEditMode
    ? SPELL_LEVELS
    : SPELL_LEVELS.filter((l) => spellsByLevel[l].length > 0 || (slotsData[l]?.max ?? 0) > 0)

  if (usedLevels.length === 0) return null

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Magias</h2>

      <div className={styles.spellHeader}>
        <div className={styles.spellStat}>
          <span className={styles.spellStatLabel}>Atributo</span>
          <span className={styles.spellStatValue}>{character.spellcastingAbility || '—'}</span>
        </div>
      </div>

      {usedLevels.map((level) => {
        const slots = slotsData[level] ?? { current: 0, max: 0 }
        const levelSpells = spellsByLevel[level]
        const expanded = expandedLevels.has(level)

        return (
          <div key={level} className={styles.levelSection}>
            <button className={styles.levelHeader} onClick={() => toggleLevel(level)}>
              <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▸</span>
              <span className={styles.levelTitle}>{LEVEL_LABEL[level]}</span>
              <span className={styles.levelCount}>{levelSpells.length} magia{levelSpells.length !== 1 ? 's' : ''}</span>
              {level > 0 && (
                isEditMode ? (
                  <label onClick={(e) => e.stopPropagation()}>
                    Slots máx
                    <input className={styles.slotInput} type="number" min={0} value={slots.max} onChange={(e) => setSlot(level, 'max', Number(e.target.value))} />
                  </label>
                ) : slots.max > 0 ? (
                  <div className={styles.slotCounter} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.slotBtn} onClick={() => setSlot(level, 'current', slots.current - 1)}>−</button>
                    <span className={styles.slotNumbers}>{slots.current}/{slots.max}</span>
                    <button className={styles.slotBtn} onClick={() => setSlot(level, 'current', slots.current + 1)}>+</button>
                  </div>
                ) : null
              )}
            </button>

            {expanded && (
              <div className={styles.levelBody}>
                {levelSpells.map((spell) => {
                  const globalIndex = spells.indexOf(spell)
                  return (
                    <div key={globalIndex} className={styles.spellRow}>
                      <span className={styles.spellPrepared} onClick={() => setSpell(globalIndex, { prepared: !spell.prepared })}>
                        {spell.prepared ? '★' : '☆'}
                      </span>
                      <span className={styles.spellConc}>{spell.concentration ? 'C' : ''}</span>
                      {isEditMode ? (
                        <>
                          <input className={styles.spellNameInput} type="text" value={spell.name ?? ''} placeholder="Nome da magia" onChange={(e) => setSpell(globalIndex, { name: e.target.value })} />
                          <input type="text" value={spell.castingTime ?? ''} placeholder="Tempo" onChange={(e) => setSpell(globalIndex, { castingTime: e.target.value })} style={{ width: '7rem' }} />
                          <select className={styles.spellSchoolSelect} value={spell.school ?? ''} onChange={(e) => setSpell(globalIndex, { school: e.target.value })}>
                            <option value="">— Escola —</option>
                            {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input type="text" value={spell.range ?? ''} placeholder="Alcance" onChange={(e) => setSpell(globalIndex, { range: e.target.value })} style={{ width: '5rem' }} />
                          <input type="text" value={spell.duration ?? ''} placeholder="Duração" onChange={(e) => setSpell(globalIndex, { duration: e.target.value })} style={{ width: '6rem' }} />
                          <label>
                            Conc.
                            <input type="checkbox" checked={!!spell.concentration} onChange={(e) => setSpell(globalIndex, { concentration: e.target.checked })} />
                          </label>
                          <button className={panelStyles.removeButton} onClick={() => removeSpell(globalIndex)}>✕</button>
                          <textarea className={styles.spellDescription} value={spell.description ?? ''} placeholder="Descrição da magia" rows={2} onChange={(e) => setSpell(globalIndex, { description: e.target.value })} />
                        </>
                      ) : (
                        <>
                          <span className={styles.spellName}>{spell.name || '—'}</span>
                          {spell.school && <span className={styles.spellSchool}>{spell.school}</span>}
                          <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-xs)' }}>{spell.castingTime}</span>
                          <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-xs)' }}>{spell.range}</span>
                          <span style={{ color: 'var(--ink-faint)', fontSize: 'var(--text-xs)' }}>{spell.duration}</span>
                          {spell.description && <p className={styles.spellDescriptionRead}>{spell.description}</p>}
                        </>
                      )}
                    </div>
                  )
                })}
                {isEditMode && (
                  <button className={panelStyles.addButton} onClick={() => addSpell(level)}>+ Magia</button>
                )}
                {levelSpells.length === 0 && !isEditMode && (
                  <p className={panelStyles.emptyState}>Nenhuma magia.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}