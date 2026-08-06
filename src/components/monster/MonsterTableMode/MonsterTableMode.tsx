import { useState } from 'react'
import type { DamagePart, MonsterSheet, MonsterKind } from '../../../types/system/dnd/monsterSheet'
import type { DeepPartial } from '../shared'
import { getRechargeLabel } from '../shared'
import { isRestBasedRecharge } from '../../../utils/restRules'
import { spendResource, restoreResource, restoreResourceFull } from '../../../utils/manageableResource'
import { rollDamages, type DamageRollSummary } from '../../../utils/diceRoller'
import { RollResultBlock } from '../../RollResultBlock/RollResultBlock'
import { ManagedResourceControls } from '../../ManagedResourceControls/ManagedResourceControls'
import panelStyles from '../../../styles/panel.module.css'
import styles from './MonsterTableMode.module.css'

interface MonsterTableModeProps {
  sheet: MonsterSheet
  onChange: (patch: DeepPartial<MonsterSheet>) => void
}

function fmt(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function calcModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

const KIND_LABELS: Record<MonsterKind, string> = {
  monster: 'Monstro',
  npc: 'NPC',
}

const ABILITIES = [
  { key: 'strength'     as const, short: 'FOR', label: 'Força' },
  { key: 'dexterity'    as const, short: 'DES', label: 'Destreza' },
  { key: 'constitution' as const, short: 'CON', label: 'Constituição' },
  { key: 'intelligence' as const, short: 'INT', label: 'Inteligência' },
  { key: 'wisdom'       as const, short: 'SAB', label: 'Sabedoria' },
  { key: 'charisma'     as const, short: 'CAR', label: 'Carisma' },
]

function getPerceptionBonus(skills: string[]): number | null {
  for (const s of skills) {
    const norm = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    if (!norm.includes('percepcao') && !norm.includes('perception')) continue
    const m = s.match(/([+-]?\d+)/)
    if (m) {
      const v = Number(m[1])
      if (Number.isFinite(v)) return v
    }
  }
  return null
}

function calcPassivePerception(sheet: MonsterSheet): number {
  const bonus = getPerceptionBonus(sheet.traits.skills)
  return bonus !== null ? 10 + bonus : 10 + calcModifier(sheet.stats.wisdom)
}

export function MonsterTableMode({ sheet, onChange }: MonsterTableModeProps) {
  const { details, stats, traits } = sheet
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleRollDamage(id: string, damages: DamagePart[]) {
    setRollResults((prev) => new Map(prev).set(id, rollDamages(damages)))
  }

  function clearRollResult(id: string) {
    setRollResults((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  function updateFeature(index: number, patch: Partial<MonsterSheet['features'][number]>) {
    const updated = sheet.features.map((f, i) => i === index ? { ...f, ...patch } : f)
    onChange({ features: updated })
  }

  function updateAction(index: number, patch: Partial<MonsterSheet['actions'][number]>) {
    const updated = sheet.actions.map((a, i) => i === index ? { ...a, ...patch } : a)
    onChange({ actions: updated })
  }

  function updateReaction(index: number, patch: Partial<MonsterSheet['reactions'][number]>) {
    const updated = sheet.reactions.map((r, i) => i === index ? { ...r, ...patch } : r)
    onChange({ reactions: updated })
  }

  function getLegendaryResource() {
    const { pointsPerRound, pointsUsed } = sheet.legendary
    return {
      current: Math.max(0, pointsPerRound - pointsUsed),
      max: pointsPerRound,
    }
  }

  function spendLegendaryPoints(amount: number) {
    const next = spendResource(getLegendaryResource(), amount)
    onChange({ legendary: { pointsUsed: sheet.legendary.pointsPerRound - next.current } })
  }

  function restoreLegendaryPoints(amount: number) {
    const next = restoreResource(getLegendaryResource(), amount)
    onChange({ legendary: { pointsUsed: sheet.legendary.pointsPerRound - next.current } })
  }

  function resetLegendaryPoints() {
    onChange({ legendary: { pointsUsed: 0 } })
  }

  const metaParts = [details.species, details.size, details.alignment].filter((v) => v.trim())
  const meta = metaParts.length > 0 ? metaParts.join(' · ') : null

  return (
    <>
      {/* ── Seção A: Identidade ── */}
      <section className={panelStyles.panel}>
        <div className={styles.identity}>
          <h1 className={styles.name}>{details.name || '(sem nome)'}</h1>
          <span className={styles.kindBadge}>{KIND_LABELS[details.kind]}</span>
          {meta && <p className={styles.meta}>{meta}</p>}
          {details.creatureClass.trim() && (
            <p className={styles.creatureClass}>{details.creatureClass}</p>
          )}
          <div className={styles.ratingRow}>
            {traits.challengeRating && (
              <div className={styles.ratingChip}>
                <span className={styles.ratingLabel}>ND</span>
                <strong className={styles.ratingValue}>{traits.challengeRating}</strong>
              </div>
            )}
            {traits.xp > 0 && (
              <div className={styles.ratingChip}>
                <span className={styles.ratingLabel}>XP</span>
                <strong className={styles.ratingValue}>{traits.xp.toLocaleString('pt-BR')}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Seção C: Atributos e Traços ── */}
      <section className={panelStyles.panel}>
        <span className={styles.sectionTitle}>Atributos</span>
        <div className={styles.abilityGrid}>
          {ABILITIES.map((a) => {
            const score = stats[a.key]
            const mod = calcModifier(score)
            return (
              <article className={styles.abilityCard} key={a.key}>
                <span className={styles.abilityShort}>{a.short}</span>
                <strong className={styles.abilityValue}>{score}</strong>
                <span className={styles.abilityMod}>{fmt(mod)}</span>
              </article>
            )
          })}
        </div>

        {traits.savingThrows.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Testes de Resistência</span>
            <div className={styles.traitList}>
              {traits.savingThrows.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
            </div>
          </div>
        )}
        {traits.skills.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Perícias</span>
            <div className={styles.traitList}>
              {traits.skills.map((s) => <span key={s} className={styles.chip}>{s}</span>)}
            </div>
          </div>
        )}
        {traits.languages.length > 0 && (
          <div className={styles.traitBlock}>
            <span className={styles.traitTitle}>Idiomas</span>
            <div className={styles.traitList}>
              {traits.languages.map((l) => <span key={l} className={styles.chip}>{l}</span>)}
            </div>
          </div>
        )}

        <div className={styles.traitBlock}>
          <span className={styles.traitTitle}>Percepção Passiva</span>
          <span className={styles.chip}>{calcPassivePerception(sheet)}</span>
        </div>
      </section>

      {/* ── Seção D: Habilidades Especiais ── */}
      {sheet.features.length > 0 && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Habilidades Especiais</span>
          <div className={styles.itemList}>
            {sheet.features.map((feature, index) => {
              const id = feature.id || `feature-${index}`
              const isCollapsed = collapsedIds.has(id)
              const restBased = isRestBasedRecharge(feature.recharge)

              return (
                <article className={styles.itemCard} key={id}>
                  <button
                    type="button"
                    className={styles.itemToggle}
                    onClick={() => toggleCollapse(id)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={styles.itemTitle}>{feature.name || '(sem nome)'}</span>
                    {feature.hasLimitedUses && (
                      <span className={styles.itemMeta}>
                        {feature.currentUses}/{feature.maxUses} · {getRechargeLabel(feature.recharge)}
                      </span>
                    )}
                    <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                  </button>

                  {!isCollapsed && (
                    <div className={styles.itemBody}>
                      {feature.hasLimitedUses && (
                        <ManagedResourceControls
                          current={feature.currentUses}
                          max={feature.maxUses}
                          itemName={feature.name}
                          resourceKind="habilidade"
                          onSpend={() => {
                            const next = spendResource({ current: feature.currentUses, max: feature.maxUses })
                            updateFeature(index, { currentUses: next.current })
                          }}
                          onRestore={restBased ? undefined : () => {
                            const next = restoreResource({ current: feature.currentUses, max: feature.maxUses })
                            updateFeature(index, { currentUses: next.current })
                          }}
                          onRestoreFull={restBased ? undefined : () => {
                            const next = restoreResourceFull({ current: feature.currentUses, max: feature.maxUses })
                            updateFeature(index, { currentUses: next.current })
                          }}
                          restoreFullText="Recarregar"
                          meta={<span className={styles.metaChip}>{getRechargeLabel(feature.recharge)}</span>}
                        />
                      )}
                      <p className={feature.description.trim() ? styles.description : styles.emptyText}>
                        {feature.description.trim() || 'Sem descrição.'}
                      </p>
                      {(feature.damages ?? []).length > 0 && (
                        <div className={styles.rollArea}>
                          <button
                            type="button"
                            className={styles.rollBtn}
                            onClick={() => handleRollDamage(id, feature.damages ?? [])}
                          >
                            🎲 Rolar dano
                          </button>
                          {rollResults.has(id) && (
                            <RollResultBlock
                              summary={rollResults.get(id)!}
                              itemName={feature.name}
                              onClear={() => clearRollResult(id)}
                            />
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

      {/* ── Seção E: Ações e Reações ── */}
      {(sheet.actions.length > 0 || sheet.reactions.length > 0) && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Ações</span>
          <div className={styles.itemList}>
            {/* Multiataques em destaque */}
            {sheet.actions.filter((a) => a.isMultiattack).map((action, i) => (
              <article key={action.id || `multi-${i}`} className={styles.multiattackCard}>
                <p className={styles.multiattackTitle}>
                  {action.name.trim() || 'Multiataque'}. Realiza {action.attackCount} ataques por turno.
                </p>
                {action.description.trim() && (
                  <p className={styles.description}>{action.description}</p>
                )}
              </article>
            ))}

            {/* Ações regulares */}
            {sheet.actions
              .map((action, realIndex) => ({ action, realIndex }))
              .filter(({ action: a }) => !a.isMultiattack)
              .map(({ action, realIndex }) => {
                const id = action.id || `action-${realIndex}`
                const isCollapsed = collapsedIds.has(id)
                const restBased = isRestBasedRecharge(action.recharge)
                const summary = action.isAttack
                  ? [action.attackBonus.trim(), action.damage.trim() ? `${action.damage} ${action.damageType}`.trim() : ''].filter(Boolean).join(' | ')
                  : ''

                return (
                  <article className={styles.itemCard} key={id}>
                    <button
                      type="button"
                      className={styles.itemToggle}
                      onClick={() => toggleCollapse(id)}
                      aria-expanded={!isCollapsed}
                    >
                      <span className={styles.itemTitle}>{action.name || '(sem nome)'}</span>
                      {summary && <span className={styles.itemMeta}>{summary}</span>}
                      {action.hasLimitedUses && (
                        <span className={styles.itemMeta}>{action.currentUses}/{action.maxUses}</span>
                      )}
                      <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                    </button>

                    {!isCollapsed && (
                      <div className={styles.itemBody}>
                        <div className={styles.metaRow}>
                          {action.isAttack && action.attackType && <span className={styles.metaChip}>{action.attackType}</span>}
                          {action.isAttack && action.attackBonus.trim() && <span className={styles.metaChip}>Bônus {action.attackBonus}</span>}
                          {action.isAttack && action.damage.trim() && (
                            <span className={styles.metaChip}>Dano {action.damage}{action.damageType ? ` ${action.damageType}` : ''}</span>
                          )}
                          {action.reach.trim() && <span className={styles.metaChip}>Alcance {action.reach}</span>}
                        </div>
                        {action.hasLimitedUses && (
                          <ManagedResourceControls
                            current={action.currentUses}
                            max={action.maxUses}
                            itemName={action.name}
                            resourceKind="ação"
                            onSpend={() => {
                              const next = spendResource({ current: action.currentUses, max: action.maxUses })
                              updateAction(realIndex, { currentUses: next.current })
                            }}
                            onRestore={restBased ? undefined : () => {
                              const next = restoreResource({ current: action.currentUses, max: action.maxUses })
                              updateAction(realIndex, { currentUses: next.current })
                            }}
                            onRestoreFull={restBased ? undefined : () => {
                              const next = restoreResourceFull({ current: action.currentUses, max: action.maxUses })
                              updateAction(realIndex, { currentUses: next.current })
                            }}
                            restoreFullText="Recarregar"
                            meta={<span className={styles.metaChip}>{getRechargeLabel(action.recharge)}</span>}
                          />
                        )}
                        <p className={action.description.trim() ? styles.description : styles.emptyText}>
                          {action.description.trim() || 'Sem descrição.'}
                        </p>
                        {(action.damages ?? []).length > 0 && (
                          <div className={styles.rollArea}>
                            <button
                              type="button"
                              className={styles.rollBtn}
                              onClick={() => handleRollDamage(id, action.damages ?? [])}
                            >
                              🎲 Rolar dano
                            </button>
                            {rollResults.has(id) && (
                              <RollResultBlock
                                summary={rollResults.get(id)!}
                                itemName={action.name}
                                onClear={() => clearRollResult(id)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}

            {/* Reações */}
            {sheet.reactions.length > 0 && (
              <>
                <p className={styles.subsectionTitle}>Reações</p>
                {sheet.reactions.map((reaction, index) => {
                  const id = reaction.id || `reaction-${index}`
                  const isCollapsed = collapsedIds.has(id)
                  const restBased = isRestBasedRecharge(reaction.recharge)

                  return (
                    <article className={styles.itemCard} key={id}>
                      <button
                        type="button"
                        className={styles.itemToggle}
                        onClick={() => toggleCollapse(id)}
                        aria-expanded={!isCollapsed}
                      >
                        <span className={styles.itemTitle}>{reaction.name || '(sem nome)'}</span>
                        {reaction.hasLimitedUses && (
                          <span className={styles.itemMeta}>{reaction.currentUses}/{reaction.maxUses}</span>
                        )}
                        <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                      </button>

                      {!isCollapsed && (
                        <div className={styles.itemBody}>
                          {reaction.hasLimitedUses && (
                            <ManagedResourceControls
                              current={reaction.currentUses}
                              max={reaction.maxUses}
                              itemName={reaction.name}
                              resourceKind="reação"
                              onSpend={() => {
                                const next = spendResource({ current: reaction.currentUses, max: reaction.maxUses })
                                updateReaction(index, { currentUses: next.current })
                              }}
                              onRestore={restBased ? undefined : () => {
                                const next = restoreResource({ current: reaction.currentUses, max: reaction.maxUses })
                                updateReaction(index, { currentUses: next.current })
                              }}
                              onRestoreFull={restBased ? undefined : () => {
                                const next = restoreResourceFull({ current: reaction.currentUses, max: reaction.maxUses })
                                updateReaction(index, { currentUses: next.current })
                              }}
                              restoreFullText="Recarregar"
                              meta={<span className={styles.metaChip}>{getRechargeLabel(reaction.recharge)}</span>}
                            />
                          )}
                          <p className={reaction.description.trim() ? styles.description : styles.emptyText}>
                            {reaction.description.trim() || 'Sem descrição.'}
                          </p>
                          {(reaction.damages ?? []).length > 0 && (
                            <div className={styles.rollArea}>
                              <button
                                type="button"
                                className={styles.rollBtn}
                                onClick={() => handleRollDamage(id, reaction.damages ?? [])}
                              >
                                🎲 Rolar dano
                              </button>
                              {rollResults.has(id) && (
                                <RollResultBlock
                                  summary={rollResults.get(id)!}
                                  itemName={reaction.name}
                                  onClear={() => clearRollResult(id)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Seção F: Ações Lendárias ── */}
      {sheet.legendary.actions.length > 0 && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Ações Lendárias</span>

          <div className={styles.legendaryTracker}>
            <ManagedResourceControls
              current={getLegendaryResource().current}
              max={sheet.legendary.pointsPerRound}
              itemName="pontos lendários"
              resourceKind="ação lendária"
              onSpend={() => spendLegendaryPoints(1)}
              onRestore={() => restoreLegendaryPoints(1)}
              onRestoreFull={resetLegendaryPoints}
              restoreFullText="Resetar turno"
            />
            <span className={styles.legendaryPoints}>
              {getLegendaryResource().current}/{sheet.legendary.pointsPerRound} pontos disponíveis
            </span>
          </div>

          {sheet.legendary.description.trim() && (
            <p className={styles.description}>{sheet.legendary.description}</p>
          )}

          <div className={styles.itemList}>
            {sheet.legendary.actions.map((action, index) => {
              const id = action.id || `legendary-${index}`
              const isCollapsed = collapsedIds.has(id)
              const resource = getLegendaryResource()

              return (
                <article className={styles.itemCard} key={id}>
                  <button
                    type="button"
                    className={styles.itemToggle}
                    onClick={() => toggleCollapse(id)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={styles.itemTitle}>{action.name || '(sem nome)'}</span>
                    <span className={styles.itemMeta}>{action.cost} ponto{action.cost === 1 ? '' : 's'}</span>
                    <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                  </button>

                  {!isCollapsed && (
                    <div className={styles.itemBody}>
                      <ManagedResourceControls
                        current={resource.current}
                        max={sheet.legendary.pointsPerRound}
                        itemName={action.name}
                        resourceKind="ação lendária"
                        spendAmount={action.cost}
                        restoreAmount={action.cost}
                        onSpend={() => spendLegendaryPoints(action.cost)}
                        onRestore={() => restoreLegendaryPoints(action.cost)}
                      />
                      <p className={action.description.trim() ? styles.description : styles.emptyText}>
                        {action.description.trim() || 'Sem descrição.'}
                      </p>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
