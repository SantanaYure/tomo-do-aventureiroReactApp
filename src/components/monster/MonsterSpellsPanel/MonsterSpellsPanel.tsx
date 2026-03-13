import { useState } from 'react'
import type { Spell, SpellcastingAbility } from '../../../types/system/dnd/monsterSheet'
import { calcModifier } from '../../AttributesPanel/AttributesPanel'
import panelStyles from '../../../styles/panel.module.css'
import type { MonsterComponentProps } from '../shared'
import styles from './MonsterSpellsPanel.module.css'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const LEVEL_LABEL: Record<number, string> = {
    0: 'Truques',
    1: '1º nível', 2: '2º nível', 3: '3º nível',
    4: '4º nível', 5: '5º nível', 6: '6º nível',
    7: '7º nível', 8: '8º nível', 9: '9º nível',
}

const SCHOOLS = ['Abjuração', 'Adivinhação', 'Conjuração', 'Encantamento', 'Evocação', 'Ilusão', 'Necromancia', 'Transmutação']
const SPELLCASTING_OPTIONS: SpellcastingAbility[] = ['', 'Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma']

function formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`
}

function createSpell(): Spell {
    return { name: '', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], concentration: false, prepared: false, description: '' }
}

export function MonsterSpellsPanel({ sheet, isEditing, onChange }: MonsterComponentProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]))
    const { spells } = sheet

    const statMap: Record<string, number> = {
        'Força': sheet.stats.strength,
        'Destreza': sheet.stats.dexterity,
        'Constituição': sheet.stats.constitution,
        'Inteligência': sheet.stats.intelligence,
        'Sabedoria': sheet.stats.wisdom,
        'Carisma': sheet.stats.charisma,
    }

    const spellModifier = spells.spellcastingAbility
        ? calcModifier(statMap[spells.spellcastingAbility] ?? 10)
        : null
    const spellAttackBonus = spellModifier === null ? null : spells.proficiencyBonus + spellModifier
    const spellSaveDc = spellModifier === null ? null : 8 + spells.proficiencyBonus + spellModifier

    function updateSpells(patch: Partial<typeof spells>) {
        onChange({ spells: patch })
    }

    function toggleLevel(level: number) {
        setExpandedLevels((prev) => {
            const next = new Set(prev)
            if (next.has(level)) next.delete(level)
            else next.add(level)
            return next
        })
    }

    function setSpell(index: number, partial: Partial<Spell>) {
        updateSpells({
            items: spells.items.map((spell, i) => i === index ? { ...spell, ...partial } : spell),
        })
    }

    function addSpell(level: number) {
        updateSpells({ items: [...spells.items, { ...createSpell(), level }] })
    }

    function removeSpell(index: number) {
        updateSpells({ items: spells.items.filter((_, i) => i !== index) })
    }

    function setSlot(level: number, field: 'current' | 'max', value: number) {
        const prev = spells.slots[level] ?? { current: 0, max: 0 }
        const next = { ...prev, [field]: Math.max(0, value) }
        if (field === 'current') next.current = Math.min(next.current, next.max)
        updateSpells({ slots: { ...spells.slots, [level]: next } })
    }

    const spellsByLevel = SPELL_LEVELS.reduce<Record<number, Spell[]>>((acc, level) => {
        acc[level] = spells.items.filter((s) => (s.level ?? 0) === level)
        return acc
    }, {})

    const usedLevels = isEditing
        ? SPELL_LEVELS
        : SPELL_LEVELS.filter((l) => spellsByLevel[l].length > 0 || (spells.slots[l]?.max ?? 0) > 0)

    return (
        <section className={panelStyles.panel}>
            <div className={panelStyles.panelHeader}>
                <h2 className={panelStyles.panelTitle}>Magias</h2>
                <p className={panelStyles.panelSubtitle}>Magias e espaços de magia</p>
            </div>

            <div className={styles.spellHeader}>
                <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Atributo-chave</span>
                    {isEditing ? (
                        <select
                            className={styles.spellAbilitySelect}
                            value={spells.spellcastingAbility}
                            onChange={(e) => updateSpells({ spellcastingAbility: e.target.value as SpellcastingAbility })}
                        >
                            <option value="">— Atributo —</option>
                            {SPELLCASTING_OPTIONS.filter(Boolean).map((attr) => (
                                <option key={attr} value={attr}>{attr}</option>
                            ))}
                        </select>
                    ) : (
                        <span className={styles.spellStatValue}>{spells.spellcastingAbility || '—'}</span>
                    )}
                </div>

                <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Bônus de proficiência</span>
                    {isEditing ? (
                        <input
                            type="number"
                            min={1}
                            className={styles.profInput}
                            value={spells.proficiencyBonus}
                            onChange={(e) => updateSpells({ proficiencyBonus: Math.max(1, Number(e.target.value) || 2) })}
                        />
                    ) : (
                        <span className={styles.spellStatValue}>{formatModifier(spells.proficiencyBonus)}</span>
                    )}
                </div>

                <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Ataque com magia</span>
                    <span className={styles.spellStatValue}>
                        {spellAttackBonus === null ? '—' : formatModifier(spellAttackBonus)}
                    </span>
                </div>

                <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>CD das magias</span>
                    <span className={styles.spellStatValue}>
                        {spellSaveDc === null ? '—' : spellSaveDc}
                    </span>
                </div>
            </div>

            {!isEditing && usedLevels.length === 0 && (
                <p className={panelStyles.emptyState}>Nenhuma magia cadastrada.</p>
            )}

            {usedLevels.map((level) => {
                const slots = spells.slots[level] ?? { current: 0, max: 0 }
                const levelSpells = spellsByLevel[level]
                const expanded = expandedLevels.has(level)

                return (
                    <div key={level} className={styles.levelSection}>
                        <button type="button" className={styles.levelHeader} onClick={() => toggleLevel(level)}>
                            <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▸</span>
                            <span className={styles.levelTitle}>{LEVEL_LABEL[level]}</span>
                            <span className={styles.levelCount}>{levelSpells.length} magia{levelSpells.length !== 1 ? 's' : ''}</span>
                            {level > 0 && (
                                isEditing ? (
                                    <label onClick={(e) => e.stopPropagation()}>
                                        Slots máx
                                        <input
                                            className={styles.slotInput}
                                            type="number"
                                            min={0}
                                            value={slots.max}
                                            onChange={(e) => setSlot(level, 'max', Number(e.target.value))}
                                        />
                                    </label>
                                ) : slots.max > 0 ? (
                                    <div className={styles.slotCounter} onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className={styles.slotBtn} onClick={() => setSlot(level, 'current', slots.current - 1)}>−</button>
                                        <span className={styles.slotNumbers}>{slots.current}/{slots.max}</span>
                                        <button type="button" className={styles.slotBtn} onClick={() => setSlot(level, 'current', slots.current + 1)}>+</button>
                                    </div>
                                ) : null
                            )}
                        </button>

                        {expanded && (
                            <div className={styles.levelBody}>
                                {levelSpells.map((spell) => {
                                    const globalIndex = spells.items.indexOf(spell)
                                    return (
                                        <div key={globalIndex} className={styles.spellRow}>
                                            <span
                                                className={styles.spellPrepared}
                                                onClick={() => setSpell(globalIndex, { prepared: !spell.prepared })}
                                            >
                                                {spell.prepared ? '★' : '☆'}
                                            </span>
                                            <span className={styles.spellConc}>{spell.concentration ? 'C' : ''}</span>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        className={styles.spellNameInput}
                                                        type="text"
                                                        value={spell.name ?? ''}
                                                        placeholder="Nome da magia"
                                                        onChange={(e) => setSpell(globalIndex, { name: e.target.value })}
                                                    />
                                                    <input
                                                        className={styles.castingTimeInput}
                                                        type="text"
                                                        value={spell.castingTime ?? ''}
                                                        placeholder="Tempo"
                                                        onChange={(e) => setSpell(globalIndex, { castingTime: e.target.value })}
                                                    />
                                                    <select
                                                        className={styles.spellSchoolSelect}
                                                        value={spell.school ?? ''}
                                                        onChange={(e) => setSpell(globalIndex, { school: e.target.value })}
                                                    >
                                                        <option value="">— Escola —</option>
                                                        {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <input
                                                        className={styles.rangeInput}
                                                        type="text"
                                                        value={spell.range ?? ''}
                                                        placeholder="Alcance"
                                                        onChange={(e) => setSpell(globalIndex, { range: e.target.value })}
                                                    />
                                                    <input
                                                        className={styles.durationInput}
                                                        type="text"
                                                        value={spell.duration ?? ''}
                                                        placeholder="Duração"
                                                        onChange={(e) => setSpell(globalIndex, { duration: e.target.value })}
                                                    />
                                                    <label>
                                                        Conc.
                                                        <input
                                                            type="checkbox"
                                                            checked={!!spell.concentration}
                                                            onChange={(e) => setSpell(globalIndex, { concentration: e.target.checked })}
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className={panelStyles.removeButton}
                                                        onClick={() => removeSpell(globalIndex)}
                                                    >
                                                        ✕
                                                    </button>
                                                    <textarea
                                                        className={styles.spellDescription}
                                                        value={spell.description ?? ''}
                                                        placeholder="Descrição da magia"
                                                        rows={2}
                                                        onChange={(e) => setSpell(globalIndex, { description: e.target.value })}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.spellName}>{spell.name || '—'}</span>
                                                    {spell.school && <span className={styles.spellSchool}>{spell.school}</span>}
                                                    <span className={styles.spellMetaText}>{spell.castingTime}</span>
                                                    <span className={styles.spellMetaText}>{spell.range}</span>
                                                    <span className={styles.spellMetaText}>{spell.duration}</span>
                                                    {spell.description && <p className={styles.spellDescriptionRead}>{spell.description}</p>}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                                {isEditing && (
                                    <button type="button" className={panelStyles.addButton} onClick={() => addSpell(level)}>
                                        + Magia
                                    </button>
                                )}
                                {levelSpells.length === 0 && !isEditing && (
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
