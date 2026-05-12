import { useState } from 'react'
import type { CharacterSheet, Currency, DamagePart } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import { ManagedResourceControls } from '../ManagedResourceControls/ManagedResourceControls'
import { spendResource, restoreResource, restoreResourceFull } from '../../utils/manageableResource'
import { isRestBasedReset } from '../../utils/restRules'
import { rollDamages, formatRollLine, type DamageRollSummary } from '../../utils/diceRoller'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterTableMode.module.css'

export interface CharacterTableModeProps {
  sheet: CharacterSheet
  onUpdate: (updated: CharacterSheet) => void
}

function fmt(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

const RESET_LABEL: Record<string, string> = {
  'short-rest': 'Desc. curto',
  'long-rest':  'Desc. longo',
  manual:       'Manual',
  na:           'N/A',
}

const ORIGIN_LABEL: Record<string, string> = {
  class:        'Classe',
  subclass:     'Subclasse',
  species:      'Espécie',
  background:   'Antecedente',
  feat:         'Talento',
  'magic-item': 'Item Mágico',
  homebrew:     'Homebrew',
}

const ATTR_NAME_BY_KEY: Record<string, string> = {
  str: 'Força', dex: 'Destreza', con: 'Constituição',
  int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma',
}

const CURRENCY_LABEL: Record<keyof Currency, string> = {
  cp: 'PC', sp: 'PP', ep: 'PE', gp: 'PO', pp: 'Plat',
}

const CURRENCY_ORDER: (keyof Currency)[] = ['cp', 'sp', 'ep', 'gp', 'pp']

function calcAttackBonus(
  attack: CharacterSheet['attacks'][number],
  character: CharacterSheet['character'],
): number {
  const profBonus = calcProficiencyBonus(character.classes)
  if (attack.attributeKey === 'manual' || !attack.attributeKey) return attack.attackBonus ?? 0
  const attrName = ATTR_NAME_BY_KEY[attack.attributeKey]
  const attr = character.attributes.find((a) => a.name === attrName)
  return (attr ? calcModifier(attr.value) : 0) + (attack.useProficiency ? profBonus : 0)
}

function totalWeight(items: CharacterSheet['inventory']): number {
  return items.reduce((sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1), 0)
}

export function CharacterTableMode({ sheet, onUpdate }: CharacterTableModeProps) {
  const { character } = sheet
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleRollDamage(id: string, damages: DamagePart[]) {
    setRollResults((prev) => new Map(prev).set(id, rollDamages(damages)))
  }

  function updateInventory(updated: CharacterSheet['inventory']) {
    onUpdate({ ...sheet, inventory: updated })
  }

  function changeItemQty(index: number, delta: number) {
    const item = sheet.inventory[index]
    const next = Math.max(0, (item.quantity ?? 1) + delta)
    updateInventory(sheet.inventory.map((it, i) => i === index ? { ...it, quantity: next } : it))
  }

  function toggleItemEquipped(index: number) {
    const item = sheet.inventory[index]
    updateInventory(sheet.inventory.map((it, i) => i === index ? { ...it, equipped: !it.equipped } : it))
  }

  const hasCoins = CURRENCY_ORDER.some((k) => (character.currency[k] ?? 0) > 0)

  return (
    <>
      {/* ── Seção C: Recursos gerenciáveis ── */}
      {sheet.resources.some((r) => (r.max ?? 0) > 0) && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Recursos</span>
          <div className={styles.itemList}>
            {sheet.resources
              .map((resource, originalIndex) => ({ resource, originalIndex }))
              .filter(({ resource: r }) => (r.max ?? 0) > 0)
              .map(({ resource, originalIndex }) => {
                const id = `resource-${originalIndex}`
                const isExpanded = expandedIds.has(id)
                const current = resource.current ?? 0
                const max = resource.max ?? 0
                const restBased = isRestBasedReset(resource.resetOn)

                const hasBody =
                  Boolean(resource.description?.trim()) ||
                  Boolean(resource.action?.trim()) ||
                  Boolean(resource.range?.trim()) ||
                  Boolean(resource.duration?.trim()) ||
                  (resource.damages ?? []).length > 0

                const origin =
                  resource.allowCustomOrigin && resource.customOrigin?.trim()
                    ? resource.customOrigin
                    : resource.origin
                    ? (ORIGIN_LABEL[resource.origin] ?? resource.origin)
                    : null

                function spend() {
                  const next = spendResource({ current, max })
                  const updated = sheet.resources.map((r, i) =>
                    i === originalIndex ? { ...r, current: next.current } : r
                  )
                  onUpdate({ ...sheet, resources: updated })
                }

                function restore() {
                  const next = restoreResource({ current, max })
                  const updated = sheet.resources.map((r, i) =>
                    i === originalIndex ? { ...r, current: next.current } : r
                  )
                  onUpdate({ ...sheet, resources: updated })
                }

                function restoreFull() {
                  const next = restoreResourceFull({ current, max })
                  const updated = sheet.resources.map((r, i) =>
                    i === originalIndex ? { ...r, current: next.current } : r
                  )
                  onUpdate({ ...sheet, resources: updated })
                }

                return (
                  <article className={styles.itemCard} key={originalIndex}>
                    <div className={styles.resourceCardHeader}>
                      <span className={styles.itemTitle}>{resource.name || '(sem nome)'}</span>
                      <div className={styles.resourceHeaderRight}>
                        {resource.resetOn && resource.resetOn !== 'na' && (
                          <span className={styles.resetBadge}>
                            {RESET_LABEL[resource.resetOn] ?? resource.resetOn}
                          </span>
                        )}
                        {hasBody && (
                          <button
                            type="button"
                            className={styles.detailToggle}
                            onClick={() => toggleExpanded(id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Recolher detalhes' : 'Ver detalhes'}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.resourceControls}>
                      <ManagedResourceControls
                        current={current}
                        max={max}
                        itemName={resource.name || ''}
                        resourceKind="recurso"
                        onSpend={spend}
                        onRestore={restBased ? undefined : restore}
                        onRestoreFull={restBased ? undefined : restoreFull}
                        restoreFullText="Recarregar"
                      />
                    </div>
                    {isExpanded && (
                      <div className={styles.itemBody}>
                        {resource.description?.trim() && (
                          <p className={styles.description}>{resource.description}</p>
                        )}
                        {(resource.action?.trim() ||
                          resource.range?.trim() ||
                          resource.duration?.trim() ||
                          origin) && (
                          <div className={styles.metaRow}>
                            {resource.action?.trim() && (
                              <span className={styles.metaChip}>Ação: {resource.action}</span>
                            )}
                            {resource.range?.trim() && (
                              <span className={styles.metaChip}>Alcance: {resource.range}</span>
                            )}
                            {resource.duration?.trim() && (
                              <span className={styles.metaChip}>Duração: {resource.duration}</span>
                            )}
                            {origin && <span className={styles.metaChip}>{origin}</span>}
                          </div>
                        )}
                        {(resource.damages ?? []).length > 0 && (
                          <div className={styles.rollArea}>
                            <button
                              type="button"
                              className={styles.rollBtn}
                              onClick={() => handleRollDamage(id, resource.damages ?? [])}
                            >
                              🎲 Rolar dano
                            </button>
                            {rollResults.has(id) && (
                              <div className={styles.rollResult}>
                                {rollResults.get(id)!.results.map((r, i) => (
                                  <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
                                ))}
                                <span className={styles.rollTotal}>Total: {rollResults.get(id)!.total}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
          </div>
        </section>
      )}

      {/* ── Seção D: Ataques ── */}
      {sheet.attacks.length > 0 && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Ataques</span>
          <div className={styles.itemList}>
            {sheet.attacks.map((attack, index) => {
              const id = `attack-${index}`
              const isExpanded = expandedIds.has(id)
              const bonus = calcAttackBonus(attack, character)
              const damage = [attack.damage, attack.damageType].filter(Boolean).join(' ')
              const hasBody =
                Boolean(attack.range?.trim() || attack.notes?.trim()) ||
                (attack.damages ?? []).length > 0

              const attrSource =
                attack.attributeKey && attack.attributeKey !== 'manual'
                  ? `${ATTR_NAME_BY_KEY[attack.attributeKey] ?? attack.attributeKey}${attack.useProficiency ? ' + Prof.' : ''}`
                  : null

              return (
                <article className={styles.itemCard} key={index}>
                  {hasBody ? (
                    <button
                      type="button"
                      className={styles.itemToggle}
                      onClick={() => toggleExpanded(id)}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.itemTitle}>{attack.name || '(sem nome)'}</span>
                      <span className={styles.itemMeta}>{fmt(bonus)}</span>
                      {damage && <span className={styles.itemMeta}>{damage}</span>}
                      <span className={styles.collapseIcon}>{isExpanded ? '▾' : '▸'}</span>
                    </button>
                  ) : (
                    <div className={styles.itemRow}>
                      <span className={styles.itemTitle}>{attack.name || '(sem nome)'}</span>
                      <span className={styles.itemMeta}>{fmt(bonus)}</span>
                      {damage && <span className={styles.itemMeta}>{damage}</span>}
                    </div>
                  )}
                  {isExpanded && hasBody && (
                    <div className={styles.itemBody}>
                      <div className={styles.metaRow}>
                        {attrSource && <span className={styles.metaChip}>{attrSource}</span>}
                        {attack.range?.trim() && (
                          <span className={styles.metaChip}>Alcance: {attack.range}</span>
                        )}
                      </div>
                      {attack.notes?.trim() && (
                        <p className={styles.description}>{attack.notes}</p>
                      )}
                      {(attack.damages ?? []).length > 0 && (
                        <div className={styles.rollArea}>
                          <button
                            type="button"
                            className={styles.rollBtn}
                            onClick={() => handleRollDamage(id, attack.damages ?? [])}
                          >
                            🎲 Rolar dano
                          </button>
                          {rollResults.has(id) && (
                            <div className={styles.rollResult}>
                              {rollResults.get(id)!.results.map((r, i) => (
                                <span key={i} className={styles.rollLine}>{formatRollLine(r)}</span>
                              ))}
                              <span className={styles.rollTotal}>Total: {rollResults.get(id)!.total}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Seção E: Espaços de magia ── */}
      {character.spellcastingAbility && (
        (() => {
          const levelEntries = Object.entries(sheet.spellSlots)
            .map(([lvl, slot]) => ({ level: Number(lvl), slot }))
            .filter(({ slot }) => slot.max > 0)
            .sort((a, b) => a.level - b.level)

          if (levelEntries.length === 0) return null

          return (
            <section className={panelStyles.panel}>
              <span className={styles.sectionTitle}>Espaços de Magia</span>
              <div className={styles.slotGrid}>
                {levelEntries.map(({ level, slot }) => {
                  const isEmpty = slot.current === 0

                  function spendSlot() {
                    if (slot.current <= 0) return
                    onUpdate({
                      ...sheet,
                      spellSlots: {
                        ...sheet.spellSlots,
                        [level]: { ...slot, current: slot.current - 1 },
                      },
                    })
                  }

                  function restoreSlot() {
                    if (slot.current >= slot.max) return
                    onUpdate({
                      ...sheet,
                      spellSlots: {
                        ...sheet.spellSlots,
                        [level]: { ...slot, current: slot.current + 1 },
                      },
                    })
                  }

                  return (
                    <button
                      key={level}
                      type="button"
                      className={`${styles.slotChip} ${isEmpty ? styles.slotEmpty : ''}`}
                      onClick={isEmpty ? restoreSlot : spendSlot}
                      aria-label={
                        isEmpty
                          ? `Restaurar espaço de nível ${level}`
                          : `Gastar espaço de nível ${level} (${slot.current}/${slot.max} disponíveis)`
                      }
                    >
                      <span className={styles.slotLevel}>{level}º</span>
                      <span className={styles.slotCount}>{slot.current}/{slot.max}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })()
      )}

      {/* ── Seção F: Inventário ── */}
      {(sheet.inventory.length > 0 || hasCoins) && (
        <section className={panelStyles.panel}>
          <div className={styles.inventoryHeader}>
            <span className={styles.sectionTitle}>Inventário</span>
            {sheet.inventory.length > 0 && (
              <span className={styles.weightNote}>
                Peso: {totalWeight(sheet.inventory).toFixed(1)} kg
              </span>
            )}
          </div>

          {hasCoins && (
            <div className={styles.coinRow}>
              {CURRENCY_ORDER.filter((k) => (character.currency[k] ?? 0) > 0).map((key) => (
                <div key={key} className={styles.coinChip}>
                  <span className={styles.coinLabel}>{CURRENCY_LABEL[key]}</span>
                  <span className={styles.coinValue}>{character.currency[key]}</span>
                </div>
              ))}
            </div>
          )}

          {sheet.inventory.length > 0 && (
            <div className={styles.itemList}>
              {sheet.inventory.map((item, idx) => {
                const id = `item-${idx}`
                const isExpanded = expandedIds.has(id)
                const hasDesc = Boolean(item.description?.trim())

                return (
                  <article
                    className={`${styles.inventoryCard} ${item.equipped ? styles.inventoryCardEquipped : ''}`}
                    key={String(item.id ?? idx)}
                  >
                    <div className={styles.inventoryRow}>
                      <input
                        type="checkbox"
                        className={styles.equippedCheck}
                        checked={item.equipped ?? false}
                        onChange={() => toggleItemEquipped(idx)}
                        aria-label={`${item.name || 'Item'} equipado`}
                      />
                      <span className={styles.inventoryName}>{item.name || '—'}</span>
                      <div className={styles.qtyControls}>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeItemQty(idx, -1)}
                          disabled={(item.quantity ?? 1) <= 0}
                          aria-label="Reduzir quantidade"
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{item.quantity ?? 1}</span>
                        <button
                          type="button"
                          className={styles.qtyBtn}
                          onClick={() => changeItemQty(idx, 1)}
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>
                      {(item.weight ?? 0) > 0 && (
                        <span className={styles.weightChip}>{item.weight} kg</span>
                      )}
                      {hasDesc && (
                        <button
                          type="button"
                          className={styles.detailToggle}
                          onClick={() => toggleExpanded(id)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Recolher descrição' : 'Ver descrição'}
                        >
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      )}
                    </div>
                    {isExpanded && hasDesc && (
                      <p className={styles.description}>{item.description}</p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </>
  )
}
