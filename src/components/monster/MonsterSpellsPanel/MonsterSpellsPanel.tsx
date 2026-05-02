import { useState } from 'react'
import type { Spell, SpellcastingAbility } from '../../../types/system/dnd/monsterSheet'
import { calcModifier } from '../../AttributesPanel/AttributesPanel'
import { ManagedResourceControls } from '../../ManagedResourceControls/ManagedResourceControls'
import { NumberInput } from '../../NumberInput/NumberInput'
import {
    restoreResource,
    restoreResourceFull,
    setResourceCurrent,
    setResourceMax,
    spendResource,
} from '../../../utils/manageableResource'
import panelStyles from '../../../styles/panel.module.css'
import type { MonsterComponentProps } from '../shared'
import styles from './MonsterSpellsPanel.module.css'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const LEVEL_LABEL: Record<number, string> = {
    0: 'Truques',
    1: '1º nível',
    2: '2º nível',
    3: '3º nível',
    4: '4º nível',
    5: '5º nível',
    6: '6º nível',
    7: '7º nível',
    8: '8º nível',
    9: '9º nível',
}

const SCHOOLS = [
    'Abjuração',
    'Adivinhação',
    'Conjuração',
    'Encantamento',
    'Evocação',
    'Ilusão',
    'Necromancia',
    'Transmutação',
]

const SPELLCASTING_OPTIONS: SpellcastingAbility[] = [
    '',
    'Força',
    'Destreza',
    'Constituição',
    'Inteligência',
    'Sabedoria',
    'Carisma',
]

function formatModifier(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`
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
        concentration: false,
        prepared: false,
        description: '',
    }
}

function parseMaterialComponents(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

function formatMaterialComponents(components: string[] | undefined): string {
    return (components ?? []).join(', ')
}

export function MonsterSpellsPanel({ sheet, isEditing, onChange }: MonsterComponentProps) {
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]))
    const [materialDrafts, setMaterialDrafts] = useState<Record<number, string>>({})
    const { spells } = sheet

    const statMap: Record<string, number> = {
        Força: sheet.stats.strength,
        Destreza: sheet.stats.dexterity,
        Constituição: sheet.stats.constitution,
        Inteligência: sheet.stats.intelligence,
        Sabedoria: sheet.stats.wisdom,
        Carisma: sheet.stats.charisma,
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
        setExpandedLevels((previous) => {
            const next = new Set(previous)
            if (next.has(level)) next.delete(level)
            else next.add(level)
            return next
        })
    }

    function setSpell(index: number, partial: Partial<Spell>) {
        updateSpells({
            items: spells.items.map((spell, spellIndex) =>
                spellIndex === index ? { ...spell, ...partial } : spell,
            ),
        })
    }

    function addSpell(level: number) {
        setMaterialDrafts({})
        updateSpells({ items: [...spells.items, { ...createSpell(), level }] })
    }

    function removeSpell(index: number) {
        setMaterialDrafts({})
        updateSpells({ items: spells.items.filter((_, spellIndex) => spellIndex !== index) })
    }

    function setMaterialDraft(index: number, value: string) {
        setMaterialDrafts((previous) => ({ ...previous, [index]: value }))
        setSpell(index, { components: parseMaterialComponents(value) })
    }

    function clearMaterialDraft(index: number) {
        setMaterialDrafts((previous) => {
            if (!(index in previous)) {
                return previous
            }

            const next = { ...previous }
            delete next[index]
            return next
        })
    }

    function setSlot(level: number, field: 'current' | 'max', value: number) {
        const previous = spells.slots[level] ?? { current: 0, max: 0 }
        const next = field === 'max'
            ? setResourceMax(previous, value)
            : setResourceCurrent(previous, value)

        updateSpells({ slots: { ...spells.slots, [level]: next } })
    }

    function spendSlot(level: number) {
        const next = spendResource(spells.slots[level] ?? { current: 0, max: 0 })
        updateSpells({ slots: { ...spells.slots, [level]: next } })
    }

    function restoreSlot(level: number) {
        const next = restoreResource(spells.slots[level] ?? { current: 0, max: 0 })
        updateSpells({ slots: { ...spells.slots, [level]: next } })
    }

    function restoreSlotFull(level: number) {
        const next = restoreResourceFull(spells.slots[level] ?? { current: 0, max: 0 })
        updateSpells({ slots: { ...spells.slots, [level]: next } })
    }

    const spellsByLevel = SPELL_LEVELS.reduce<Record<number, Array<{ spell: Spell; index: number }>>>(
        (accumulator, level) => {
            accumulator[level] = spells.items.reduce<Array<{ spell: Spell; index: number }>>(
                (entries, spell, index) => {
                    if ((spell.level ?? 0) === level) {
                        entries.push({ spell, index })
                    }

                    return entries
                },
                [],
            )

            return accumulator
        },
        {},
    )

    const usedLevels = isEditing
        ? SPELL_LEVELS
        : SPELL_LEVELS.filter(
            (level) => spellsByLevel[level].length > 0 || (spells.slots[level]?.max ?? 0) > 0,
        )

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
                            onChange={(event) =>
                                updateSpells({
                                    spellcastingAbility: event.target.value as SpellcastingAbility,
                                })
                            }
                        >
                            <option value="">— Atributo —</option>
                            {SPELLCASTING_OPTIONS.filter(Boolean).map((attribute) => (
                                <option key={attribute} value={attribute}>
                                    {attribute}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className={styles.spellStatValue}>{spells.spellcastingAbility || '—'}</span>
                    )}
                </div>

                <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Proficiência</span>
                    {isEditing ? (
                        <NumberInput
                            min={1}
                            className={styles.profInput}
                            value={spells.proficiencyBonus}
                            emptyValue={2}
                            onChange={(value) =>
                                updateSpells({
                                    proficiencyBonus: Math.max(1, value),
                                })
                            }
                        />
                    ) : (
                        <span className={styles.spellStatValue}>
                            {formatModifier(spells.proficiencyBonus)}
                        </span>
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
                        <div className={styles.levelHeader}>
                            <button
                                type="button"
                                className={styles.levelToggle}
                                onClick={() => toggleLevel(level)}
                                aria-expanded={expanded}
                            >
                                <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
                                    ▸
                                </span>
                                <span className={styles.levelTitle}>{LEVEL_LABEL[level]}</span>
                                <span className={styles.levelCount}>
                                    {levelSpells.length} magia{levelSpells.length !== 1 ? 's' : ''}
                                </span>
                            </button>

                            {level > 0 && (
                                isEditing ? (
                                    <NumberInput
                                        className={styles.slotInput}
                                        min={0}
                                        placeholder="Slots Máximos"
                                        value={slots.max}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(value) => setSlot(level, 'max', value)}
                                    />
                                ) : slots.max > 0 ? (
                                    <div
                                        className={styles.slotCounter}
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <ManagedResourceControls
                                            current={slots.current}
                                            max={slots.max}
                                            itemName={LEVEL_LABEL[level]}
                                            resourceKind="espaço de magia"
                                            onSpend={() => spendSlot(level)}
                                            onRestore={() => restoreSlot(level)}
                                            onRestoreFull={() => restoreSlotFull(level)}
                                            restoreFullText="Restaurar"
                                        />
                                    </div>
                                ) : null
                            )}
                        </div>

                        {expanded && (
                            <div className={styles.levelBody}>
                                {levelSpells.map(({ spell, index }) => (
                                    <div key={index} className={styles.spellRow}>
                                        {isEditing ? (
                                            <>
                                                <div className={styles.spellTopRow}>
                                                    <span
                                                        className={styles.spellPrepared}
                                                        onClick={() =>
                                                            setSpell(index, { prepared: !spell.prepared })
                                                        }
                                                    >
                                                        {spell.prepared ? '★' : '☆'}
                                                    </span>
                                                    <input
                                                        className={styles.spellNameInput}
                                                        type="text"
                                                        value={spell.name ?? ''}
                                                        placeholder="Nome da magia"
                                                        onChange={(event) =>
                                                            setSpell(index, { name: event.target.value })
                                                        }
                                                    />
                                                    <button
                                                        type="button"
                                                        className={styles.removeButton}
                                                        onClick={() => removeSpell(index)}
                                                        aria-label={`Excluir magia ${spell.name || `#${index + 1}`}`}
                                                        title="Excluir magia"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <div className={styles.spellPrimaryGrid}>
                                                    <input
                                                        className={styles.castingTimeInput}
                                                        type="text"
                                                        value={spell.castingTime ?? ''}
                                                        placeholder="Tempo"
                                                        onChange={(event) =>
                                                            setSpell(index, { castingTime: event.target.value })
                                                        }
                                                    />
                                                    <select
                                                        className={styles.spellSchoolSelect}
                                                        value={spell.school ?? ''}
                                                        onChange={(event) =>
                                                            setSpell(index, { school: event.target.value })
                                                        }
                                                    >
                                                        <option value="">— Escola —</option>
                                                        {SCHOOLS.map((school) => (
                                                            <option key={school} value={school}>
                                                                {school}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        className={styles.materialsInput}
                                                        type="text"
                                                        value={materialDrafts[index] ?? formatMaterialComponents(spell.components)}
                                                        placeholder="Componentes materiais"
                                                        onChange={(event) => setMaterialDraft(index, event.target.value)}
                                                        onBlur={() => clearMaterialDraft(index)}
                                                    />
                                                </div>

                                                <div className={styles.spellSecondaryGrid}>
                                                    <input
                                                        className={styles.rangeInput}
                                                        type="text"
                                                        value={spell.range ?? ''}
                                                        placeholder="Alcance"
                                                        onChange={(event) =>
                                                            setSpell(index, { range: event.target.value })
                                                        }
                                                    />
                                                    <input
                                                        className={styles.durationInput}
                                                        type="text"
                                                        value={spell.duration ?? ''}
                                                        placeholder="Duração"
                                                        onChange={(event) =>
                                                            setSpell(index, { duration: event.target.value })
                                                        }
                                                    />
                                                    <label className={styles.spellConcLabel}>
                                                        <span>Concentração</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!spell.concentration}
                                                            onChange={(event) =>
                                                                setSpell(index, {
                                                                    concentration: event.target.checked,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </div>

                                                <textarea
                                                    className={styles.spellDescription}
                                                    value={spell.description ?? ''}
                                                    placeholder="Descrição da magia"
                                                    rows={3}
                                                    onChange={(event) =>
                                                        setSpell(index, { description: event.target.value })
                                                    }
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <span
                                                    className={styles.spellPrepared}
                                                    onClick={() =>
                                                        setSpell(index, { prepared: !spell.prepared })
                                                    }
                                                >
                                                    {spell.prepared ? '★' : '☆'}
                                                </span>
                                                <span className={styles.spellConc}>
                                                    {spell.concentration ? 'C' : ''}
                                                </span>
                                                <span className={styles.spellName}>{spell.name || '—'}</span>
                                                {spell.school && (
                                                    <span className={styles.spellSchool}>{spell.school}</span>
                                                )}
                                                <span className={styles.spellMetaText}>
                                                    {spell.castingTime}
                                                </span>
                                                <span className={styles.spellMetaText}>{spell.range}</span>
                                                <span className={styles.spellMetaText}>{spell.duration}</span>
                                                {spell.components && spell.components.length > 0 && (
                                                    <span className={styles.spellMetaText}>
                                                        Materiais: {formatMaterialComponents(spell.components)}
                                                    </span>
                                                )}
                                                {(spell.level ?? 0) > 0 && slots.max > 0 && (
                                                    <ManagedResourceControls
                                                        className={styles.spellResourceControls}
                                                        current={slots.current}
                                                        max={slots.max}
                                                        itemName={spell.name ?? LEVEL_LABEL[level]}
                                                        resourceKind="magia"
                                                        onSpend={() => spendSlot(level)}
                                                        onRestore={() => restoreSlot(level)}
                                                    />
                                                )}
                                                {spell.description && (
                                                    <p className={styles.spellDescriptionRead}>
                                                        {spell.description}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}

                                {isEditing && (
                                    <button
                                        type="button"
                                        className={panelStyles.addButton}
                                        onClick={() => addSpell(level)}
                                    >
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
