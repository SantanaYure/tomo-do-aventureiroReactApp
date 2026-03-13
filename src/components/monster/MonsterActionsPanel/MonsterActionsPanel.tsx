import { useState } from 'react'
import type {
    AttackType,
    DamageType,
    MonsterAction,
    MonsterFeature,
} from '../../../types/system/dnd/monsterSheet'
import panelStyles from '../../../styles/panel.module.css'
import type { MonsterComponentProps } from '../shared'
import styles from './MonsterActionsPanel.module.css'

const ATTACK_TYPES: AttackType[] = ['Corpo-a-corpo', 'Distância', 'Magia']

const DAMAGE_TYPES: DamageType[] = [
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
    'Não-mágico',
]

function createAction(): MonsterAction {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        isAttack: false,
        isMultiattack: false,
        attackCount: 1,
        attackType: '',
        attackBonus: '',
        damage: '',
        damageType: '',
        reach: '',
    }
}

function createReaction(): MonsterFeature {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
    }
}

function formatActionSummary(action: MonsterAction): string {
    if (!action.isAttack) {
        return ''
    }

    const summaryParts: string[] = []
    const attackBonus = action.attackBonus.trim()
    const damage = action.damage.trim()
    const damageType = action.damageType.trim()

    if (attackBonus) {
        summaryParts.push(attackBonus)
    }

    if (damage) {
        summaryParts.push(damageType ? `${damage} ${damageType}` : damage)
    }

    return summaryParts.join(' | ')
}

function parseCount(rawValue: string, fallback: number): number {
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : fallback
}

export function MonsterActionsPanel({
    sheet,
    isEditing,
    onChange,
}: MonsterComponentProps) {
    const [collapsedActionIds, setCollapsedActionIds] = useState<Set<string>>(new Set())
    const [collapsedReactionIds, setCollapsedReactionIds] = useState<Set<string>>(new Set())
    const actions = sheet.actions
    const reactions = sheet.reactions
    const multiattacks = actions.filter((action) => action.isMultiattack)
    const regularActions = actions.filter((action) => !action.isMultiattack)

    function toggleActionCollapse(id: string) {
        setCollapsedActionIds((previous) => {
            const next = new Set(previous)

            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }

            return next
        })
    }

    function toggleReactionCollapse(id: string) {
        setCollapsedReactionIds((previous) => {
            const next = new Set(previous)

            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }

            return next
        })
    }

    function updateActions(updated: MonsterAction[]) {
        onChange({ actions: updated })
    }

    function updateReactions(updated: MonsterFeature[]) {
        onChange({ reactions: updated })
    }

    function setAction(index: number, patch: Partial<MonsterAction>) {
        updateActions(
            actions.map((action, currentIndex) =>
                currentIndex === index ? { ...action, ...patch } : action,
            ),
        )
    }

    function setReaction(index: number, patch: Partial<MonsterFeature>) {
        updateReactions(
            reactions.map((reaction, currentIndex) =>
                currentIndex === index ? { ...reaction, ...patch } : reaction,
            ),
        )
    }

    function addAction() {
        updateActions([...actions, createAction()])
    }

    function removeAction(index: number) {
        updateActions(actions.filter((_, currentIndex) => currentIndex !== index))
    }

    function addReaction() {
        updateReactions([...reactions, createReaction()])
    }

    function removeReaction(index: number) {
        updateReactions(reactions.filter((_, currentIndex) => currentIndex !== index))
    }

    return (
        <section className={`${panelStyles.panel} ${styles.panel}`}>
            <div className={panelStyles.panelHeader}>
                <h2 className={panelStyles.panelTitle}>Ações</h2>
                <p className={panelStyles.panelSubtitle}>Ações ofensivas, técnicas e reações</p>
            </div>

            {isEditing ? (
                <div className={styles.layout}>
                    <div className={styles.list}>
                        {actions.map((action, index) => {
                            const actionId = action.id || `action-${index}`

                            return (
                                <article className={styles.card} key={actionId}>
                                    <div className={styles.cardHeader}>
                                        <label className={`${styles.field} ${styles.nameField}`}>
                                            Nome
                                            <input
                                                type="text"
                                                value={action.name}
                                                onChange={(event) => setAction(index, { name: event.target.value })}
                                                placeholder="Nome da ação"
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            className={panelStyles.removeButton}
                                            onClick={() => removeAction(index)}
                                        >
                                            Remover
                                        </button>
                                    </div>

                                    <div className={styles.toggleRow}>
                                        <label className={panelStyles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={action.isAttack}
                                                onChange={(event) =>
                                                    setAction(index, { isAttack: event.target.checked })
                                                }
                                            />
                                            É um ataque?
                                        </label>

                                        <label className={panelStyles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={action.isMultiattack}
                                                onChange={(event) =>
                                                    setAction(index, { isMultiattack: event.target.checked })
                                                }
                                            />
                                            Multiataque?
                                        </label>
                                    </div>

                                    {action.isAttack && (
                                        <div className={styles.grid}>
                                            <label className={styles.field}>
                                                Tipo
                                                <select
                                                    value={action.attackType}
                                                    onChange={(event) =>
                                                        setAction(index, {
                                                            attackType: event.target.value as AttackType | '',
                                                        })
                                                    }
                                                >
                                                    <option value="">Selecione</option>
                                                    {ATTACK_TYPES.map((attackType) => (
                                                        <option key={attackType} value={attackType}>
                                                            {attackType}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                Bônus
                                                <input
                                                    type="text"
                                                    value={action.attackBonus}
                                                    onChange={(event) =>
                                                        setAction(index, { attackBonus: event.target.value })
                                                    }
                                                    placeholder="+5"
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                Dano
                                                <input
                                                    type="text"
                                                    value={action.damage}
                                                    onChange={(event) =>
                                                        setAction(index, { damage: event.target.value })
                                                    }
                                                    placeholder="2d6+3"
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                Tipo de dano
                                                <select
                                                    value={action.damageType}
                                                    onChange={(event) =>
                                                        setAction(index, {
                                                            damageType: event.target.value as DamageType | '',
                                                        })
                                                    }
                                                >
                                                    <option value="">Selecione</option>
                                                    {DAMAGE_TYPES.map((damageType) => (
                                                        <option key={damageType} value={damageType}>
                                                            {damageType}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                Alcance
                                                <input
                                                    type="text"
                                                    value={action.reach}
                                                    onChange={(event) =>
                                                        setAction(index, { reach: event.target.value })
                                                    }
                                                    placeholder="1,5 m"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {action.isMultiattack && (
                                        <label className={`${styles.field} ${styles.smallField}`}>
                                            Total de ataques
                                            <input
                                                type="number"
                                                min={1}
                                                value={action.attackCount}
                                                onChange={(event) =>
                                                    setAction(index, {
                                                        attackCount: parseCount(event.target.value, action.attackCount),
                                                    })
                                                }
                                            />
                                        </label>
                                    )}

                                    <label className={styles.field}>
                                        Descrição
                                        <textarea
                                            rows={4}
                                            value={action.description}
                                            onChange={(event) =>
                                                setAction(index, { description: event.target.value })
                                            }
                                            placeholder="Descreva a ação"
                                        />
                                    </label>
                                </article>
                            )
                        })}

                        {actions.length === 0 && (
                            <p className={panelStyles.emptyState}>Nenhuma ação cadastrada.</p>
                        )}

                        <button type="button" className={panelStyles.addButton} onClick={addAction}>
                            + Nova Ação
                        </button>
                    </div>

                    <div className={styles.sectionDivider}>
                        <span className={styles.sectionDividerTitle}>Reações</span>
                    </div>

                    <div className={styles.list}>
                        {reactions.map((reaction, index) => {
                            const reactionId = reaction.id || `reaction-${index}`

                            return (
                                <article className={styles.card} key={reactionId}>
                                    <div className={styles.cardHeader}>
                                        <label className={`${styles.field} ${styles.nameField}`}>
                                            Nome
                                            <input
                                                type="text"
                                                value={reaction.name}
                                                onChange={(event) =>
                                                    setReaction(index, { name: event.target.value })
                                                }
                                                placeholder="Nome da reação"
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            className={panelStyles.removeButton}
                                            onClick={() => removeReaction(index)}
                                        >
                                            Remover
                                        </button>
                                    </div>

                                    <label className={styles.field}>
                                        Descrição
                                        <textarea
                                            rows={4}
                                            value={reaction.description}
                                            onChange={(event) =>
                                                setReaction(index, { description: event.target.value })
                                            }
                                            placeholder="Descreva a reação"
                                        />
                                    </label>
                                </article>
                            )
                        })}

                        {reactions.length === 0 && (
                            <p className={panelStyles.emptyState}>Nenhuma reação cadastrada.</p>
                        )}

                        <button type="button" className={panelStyles.addButton} onClick={addReaction}>
                            + Nova Reação
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.layout}>
                    {multiattacks.length > 0 && (
                        <div className={styles.multiattackList}>
                            {multiattacks.map((action, index) => {
                                const actionId = action.id || `multiattack-${index}`

                                return (
                                    <article className={styles.multiattackCard} key={actionId}>
                                        <h3 className={styles.multiattackTitle}>
                                            {action.name.trim() || 'Multiataque'}. Realiza {action.attackCount} ataques por turno.
                                        </h3>
                                        {action.description.trim() ? (
                                            <p className={styles.description}>{action.description}</p>
                                        ) : null}
                                    </article>
                                )
                            })}
                        </div>
                    )}

                    {regularActions.length > 0 ? (
                        <div className={styles.list}>
                            {regularActions.map((action, index) => {
                                const actionId = action.id || `action-${index}`
                                const isCollapsed = collapsedActionIds.has(actionId)
                                const summary = formatActionSummary(action)

                                return (
                                    <article className={styles.card} key={actionId}>
                                        <button
                                            type="button"
                                            className={styles.cardToggle}
                                            onClick={() => toggleActionCollapse(actionId)}
                                            aria-expanded={!isCollapsed}
                                        >
                                            <span className={styles.cardTitle}>{action.name || '(sem nome)'}</span>
                                            {summary && <span className={styles.cardMeta}>{summary}</span>}
                                            <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                        </button>

                                        {!isCollapsed && (
                                            <div className={styles.cardBody}>
                                                <div className={styles.metaRow}>
                                                    {action.isAttack && action.attackType && (
                                                        <span className={styles.metaChip}>{action.attackType}</span>
                                                    )}
                                                    {action.isAttack && action.attackBonus.trim() && (
                                                        <span className={styles.metaChip}>Bônus {action.attackBonus}</span>
                                                    )}
                                                    {action.isAttack && action.damage.trim() && (
                                                        <span className={styles.metaChip}>
                                                            Dano {action.damage}
                                                            {action.damageType ? ` ${action.damageType}` : ''}
                                                        </span>
                                                    )}
                                                    {action.reach.trim() && (
                                                        <span className={styles.metaChip}>Alcance {action.reach}</span>
                                                    )}
                                                </div>

                                                <p className={action.description.trim() ? styles.description : styles.emptyText}>
                                                    {action.description.trim() || 'Sem descrição adicional.'}
                                                </p>
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    ) : (
                        <p className={panelStyles.emptyState}>Nenhuma ação cadastrada.</p>
                    )}

                    {reactions.length > 0 && (
                        <>
                            <div className={styles.sectionDivider}>
                                <span className={styles.sectionDividerTitle}>Reações</span>
                            </div>

                            <div className={styles.list}>
                                {reactions.map((reaction, index) => {
                                    const reactionId = reaction.id || `reaction-${index}`
                                    const isCollapsed = collapsedReactionIds.has(reactionId)

                                    return (
                                        <article className={styles.card} key={reactionId}>
                                            <button
                                                type="button"
                                                className={styles.cardToggle}
                                                onClick={() => toggleReactionCollapse(reactionId)}
                                                aria-expanded={!isCollapsed}
                                            >
                                                <span className={styles.cardTitle}>{reaction.name || '(sem nome)'}</span>
                                                <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                            </button>

                                            {!isCollapsed && (
                                                <div className={styles.cardBody}>
                                                    <p className={reaction.description.trim() ? styles.description : styles.emptyText}>
                                                        {reaction.description.trim() || 'Sem descrição adicional.'}
                                                    </p>
                                                </div>
                                            )}
                                        </article>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    )
}