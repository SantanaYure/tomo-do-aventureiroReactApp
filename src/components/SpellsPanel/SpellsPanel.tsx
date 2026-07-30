// src/components/SpellsPanel/SpellsPanel.tsx
import { memo, useCallback, useRef, useState } from 'react'
import type { Character, Spell, SpellSlots, SpellcastingAbility } from '../../types/system/dnd'
import { ManagedResourceControls } from '../ManagedResourceControls/ManagedResourceControls'
import { NumberInput } from '../NumberInput/NumberInput'
import {
  setResourceCurrent,
  setResourceMax,
  spendResource,
  restoreResource,
} from '../../utils/manageableResource'
import panelStyles from '../../styles/panel.module.css'
import styles from './SpellsPanel.module.css'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Congelado no módulo: usado como fallback em vários pontos. Criar o objeto
// no corpo do render daria uma identidade nova por render e invalidaria o
// memo de todas as linhas de magia.
const EMPTY_SLOT = { current: 0, max: 0 } as const
const LEVEL_LABEL: Record<number, string> = {
  0: 'Truques',
  1: '1º nível', 2: '2º nível', 3: '3º nível',
  4: '4º nível', 5: '5º nível', 6: '6º nível',
  7: '7º nível', 8: '8º nível', 9: '9º nível',
}

const SCHOOLS = ['Abjuração', 'Adivinhação', 'Conjuração', 'Encantamento', 'Evocação', 'Ilusão', 'Necromancia', 'Transmutação']
const SPELLCASTING_OPTIONS: SpellcastingAbility[] = [
  '',
  'Força',
  'Destreza',
  'Constituição',
  'Inteligência',
  'Sabedoria',
  'Carisma',
]

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function getSpellcastingModifier(character: Character): number | null {
  if (!character.spellcastingAbility) {
    return null
  }

  const attribute = character.attributes.find(
    (currentAttribute) => currentAttribute.name === character.spellcastingAbility,
  )

  if (!attribute) {
    return null
  }

  return calcModifier(attribute.value)
}

function createSpell(): Spell {
  return { name: '', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], prepared: false, description: '' }
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

interface SpellsPanelProps {
  spells: Spell[]
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
  onChangeSpells: (updated: Spell[]) => void
  slotsData: SpellSlots
  onChangeSlotsData: (updated: SpellSlots) => void
}

function SpellsPanelImpl({
  spells,
  character,
  isEditMode,
  onChangeCharacter,
  onChangeSpells,
  slotsData,
  onChangeSlotsData,
}: SpellsPanelProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0]))
  const [materialDrafts, setMaterialDrafts] = useState<Record<number, string>>({})
  const proficiencyBonus = calcProficiencyBonus(character.classes)
  const spellcastingModifier = getSpellcastingModifier(character)
  const spellDcBonusExtra = character.spellDcBonusExtra ?? 0
  const spellAttackBonus =
    spellcastingModifier === null ? null : proficiencyBonus + spellcastingModifier
  const spellSaveDc =
    spellcastingModifier === null ? null : 8 + proficiencyBonus + spellcastingModifier + spellDcBonusExtra

  function setSpellcastingAbility(value: SpellcastingAbility) {
    onChangeCharacter({ ...character, spellcastingAbility: value })
  }

  function toggleLevel(level: number) {
    setExpandedLevels((previous) => {
      const next = new Set(previous)

      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }

      return next
    })
  }

  // Os handlers abaixo são props das linhas memoizadas, então precisam ser
  // estáveis entre renders — um handler novo a cada render invalidaria o memo
  // de todas as linhas. Leem `spells` de uma ref para não depender da
  // identidade do array.
  const spellsRef = useRef(spells)
  spellsRef.current = spells

  const setSpell = useCallback((index: number, partial: Partial<Spell>) => {
    onChangeSpells(
      spellsRef.current.map((spell, spellIndex) =>
        spellIndex === index ? { ...spell, ...partial } : spell,
      ),
    )
  }, [onChangeSpells])

  function addSpell(level: number) {
    setMaterialDrafts({})
    onChangeSpells([...spells, { ...createSpell(), level }])
  }

  const removeSpell = useCallback((index: number) => {
    setMaterialDrafts({})
    onChangeSpells(spellsRef.current.filter((_, spellIndex) => spellIndex !== index))
  }, [onChangeSpells])

  const setMaterialDraft = useCallback((index: number, value: string) => {
    setMaterialDrafts((previous) => ({ ...previous, [index]: value }))
    setSpell(index, { components: parseMaterialComponents(value) })
  }, [setSpell])

  const clearMaterialDraft = useCallback((index: number) => {
    setMaterialDrafts((previous) => {
      if (!(index in previous)) {
        return previous
      }

      const next = { ...previous }
      delete next[index]
      return next
    })
  }, [])

  function setSlot(level: number, field: 'current' | 'max', value: number) {
    const prev = slotsData[level] ?? EMPTY_SLOT
    const next = field === 'max'
      ? setResourceMax(prev, value)
      : setResourceCurrent(prev, value)
    onChangeSlotsData({ ...slotsData, [level]: next })
  }

  const slotsDataRef = useRef(slotsData)
  slotsDataRef.current = slotsData

  const spendSlot = useCallback((level: number) => {
    const current = slotsDataRef.current
    const next = spendResource(current[level] ?? EMPTY_SLOT)
    onChangeSlotsData({ ...current, [level]: next })
  }, [onChangeSlotsData])

  function restoreSlot(level: number) {
    const next = restoreResource(slotsData[level] ?? EMPTY_SLOT)
    onChangeSlotsData({ ...slotsData, [level]: next })
  }

  const spellsByLevel = SPELL_LEVELS.reduce<Record<number, Spell[]>>((acc, level) => {
    acc[level] = spells.filter((s) => (s.level ?? 0) === level); return acc
  }, {})

  const usedLevels = isEditMode
    ? SPELL_LEVELS
    : SPELL_LEVELS.filter((l) => spellsByLevel[l].length > 0 || (slotsData[l]?.max ?? 0) > 0)

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Magias</h2>

      <div className={styles.spellHeader}>
        <div className={styles.spellHeaderTop}>
          <div className={styles.spellStat}>
            <span className={styles.spellStatLabel}>Atributo-chave</span>
            {isEditMode ? (
              <select
                className={styles.spellAbilitySelect}
                value={character.spellcastingAbility}
                onChange={(event) =>
                  setSpellcastingAbility(event.target.value as SpellcastingAbility)
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
              <span className={styles.spellStatValue}>{character.spellcastingAbility || '—'}</span>
            )}
          </div>

          <div className={styles.spellStat}>
            <span className={styles.spellStatLabel}>Ataque com magia</span>
            <span className={styles.spellStatValue}>
              {spellAttackBonus === null ? '—' : formatModifier(spellAttackBonus)}
            </span>
          </div>
        </div>

        <div className={styles.spellStatDc}>
          <span className={styles.spellStatLabel}>CD das magias</span>
          <span className={styles.spellStatValueLg}>
            {spellSaveDc === null ? '—' : spellSaveDc}
          </span>
          {isEditMode && (
            <div className={styles.spellDcBonusRow}>
              <span className={styles.spellDcBonusLabel}>Bônus extra</span>
              <NumberInput
                aria-label="Bônus extra à CD das magias"
                className={styles.spellDcBonusInput}
                title="Bônus extra de artefatos mágicos, talentos ou regras da campanha"
                value={spellDcBonusExtra}
                onChange={(value) =>
                  onChangeCharacter({ ...character, spellDcBonusExtra: value })
                }
              />
            </div>
          )}
        </div>
      </div>

      {!isEditMode && usedLevels.length === 0 && (
        <p className={panelStyles.emptyState}>
          Nenhuma magia cadastrada.
        </p>
      )}

      {usedLevels.map((level) => {
        const slots = slotsData[level] ?? EMPTY_SLOT
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
                <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>▸</span>
                <span className={styles.levelTitle}>{LEVEL_LABEL[level]}</span>
                <span className={styles.levelCount}>{levelSpells.length} magia{levelSpells.length !== 1 ? 's' : ''}</span>
              </button>
              {level > 0 && (
                isEditMode ? (
                  <NumberInput
                    className={styles.slotInput}
                    min={0}
                    placeholder="Slots Máximos"
                    value={slots.max}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(value) => setSlot(level, 'max', value)}
                  />
                ) : slots.max > 0 ? (
                  <div className={styles.slotCounter} onClick={(e) => e.stopPropagation()}>
                    <ManagedResourceControls
                      current={slots.current}
                      max={slots.max}
                      itemName={LEVEL_LABEL[level]}
                      resourceKind="espaço de magia"
                      onSpend={() => spendSlot(level)}
                      onRestore={() => restoreSlot(level)}
                    />
                  </div>
                ) : null
              )}
            </div>

            {expanded && (
              <div className={styles.levelBody}>
                {levelSpells.map((spell) => {
                  const globalIndex = spells.indexOf(spell)
                  return (
                    <SpellRow
                      key={globalIndex}
                      spell={spell}
                      globalIndex={globalIndex}
                      level={level}
                      isEditMode={isEditMode}
                      slots={slots}
                      materialDraft={materialDrafts[globalIndex]}
                      onChangeSpell={setSpell}
                      onRemoveSpell={removeSpell}
                      onChangeMaterialDraft={setMaterialDraft}
                      onClearMaterialDraft={clearMaterialDraft}
                      onSpendSlot={spendSlot}
                    />
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

interface SpellRowProps {
  spell: Spell
  globalIndex: number
  level: number
  isEditMode: boolean
  slots: { current: number; max: number }
  materialDraft: string | undefined
  onChangeSpell: (index: number, partial: Partial<Spell>) => void
  onRemoveSpell: (index: number) => void
  onChangeMaterialDraft: (index: number, value: string) => void
  onClearMaterialDraft: (index: number) => void
  onSpendSlot: (level: number) => void
}

// Cada magia é memoizada: sem isso, digitar em uma magia re-renderiza todas as
// do nível — medido em 12 renders para uma tecla numa lista de 12.
const SpellRow = memo(function SpellRow({
  spell,
  globalIndex,
  level,
  isEditMode,
  slots,
  materialDraft,
  onChangeSpell,
  onRemoveSpell,
  onChangeMaterialDraft,
  onClearMaterialDraft,
  onSpendSlot,
}: SpellRowProps) {
  const setSpell = onChangeSpell
  const removeSpell = onRemoveSpell
  const setMaterialDraft = onChangeMaterialDraft
  const clearMaterialDraft = onClearMaterialDraft
  const spendSlot = onSpendSlot
  const materialDrafts: Record<number, string | undefined> = { [globalIndex]: materialDraft }

  return (
                    <div className={styles.spellRow}>
                      {isEditMode ? (
                        <>
                          {/* Linha 1: preparada + nome + remover */}
                          <div className={styles.spellEditRow}>
                            <span
                              className={styles.spellPrepared}
                              onClick={() => setSpell(globalIndex, { prepared: !spell.prepared })}
                            >
                              {spell.prepared ? '★' : '☆'}
                            </span>
                            <input
                              className={styles.spellNameInput}
                              type="text"
                              value={spell.name ?? ''}
                              placeholder="Nome da magia"
                              onChange={(e) => setSpell(globalIndex, { name: e.target.value })}
                            />
                            <button className={panelStyles.removeButton} onClick={() => removeSpell(globalIndex)}>✕</button>
                          </div>

                          {/* Linha 2: tempo + escola */}
                          <div className={styles.spellEditRow}>
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
                          </div>

                          {/* Linha 3: alcance + duração + concentração */}
                          <div className={styles.spellEditRow}>
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
                            <label className={styles.spellConcLabel}>
                              Conc.
                              <input
                                type="checkbox"
                                checked={!!spell.concentration}
                                onChange={(e) => setSpell(globalIndex, { concentration: e.target.checked })}
                              />
                            </label>
                          </div>

                          {/* Linha 4: descrição */}
                          <input
                            className={styles.materialsInput}
                            type="text"
                            value={materialDrafts[globalIndex] ?? formatMaterialComponents(spell.components)}
                            placeholder="Componentes materiais"
                            onChange={(e) => setMaterialDraft(globalIndex, e.target.value)}
                            onBlur={() => clearMaterialDraft(globalIndex)}
                          />

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
                          <span className={styles.spellPrepared} onClick={() => setSpell(globalIndex, { prepared: !spell.prepared })}>
                            {spell.prepared ? '★' : '☆'}
                          </span>
                          <span className={styles.spellConc}>{spell.concentration ? 'C' : ''}</span>
                          <span className={styles.spellName}>{spell.name || '—'}</span>
                          {spell.school && <span className={styles.spellSchool}>{spell.school}</span>}
                          <span className={styles.spellMetaText}>{spell.castingTime}</span>
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
                            />
                          )}
                          {spell.description && <p className={styles.spellDescriptionRead}>{spell.description}</p>}
                        </>
                      )}
                    </div>
  )
})

// Memoizado: os painéis recebem props estreitas e handlers estáveis da
// página, então a comparação rasa aborta o render quando a edição foi em
// outra parte da ficha.
export const SpellsPanel = memo(SpellsPanelImpl)
