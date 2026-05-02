import { useState } from 'react'
import type {
    AttackType,
    DamageType,
    MonsterAction,
    MonsterFeature,
} from '../../../types/system/dnd/monsterSheet'
import { ManagedResourceControls } from '../../ManagedResourceControls/ManagedResourceControls'
import { NumberInput } from '../../NumberInput/NumberInput'
import {
    restoreResource,
    restoreResourceFull,
    setResourceMax,
    spendResource,
} from '../../../utils/manageableResource'
import panelStyles from '../../../styles/panel.module.css'
import {
    getRechargeLabel,
    type MonsterComponentProps,
    RECHARGE_OPTIONS,
} from '../shared'
import styles from './MonsterActionsPanel.module.css'

const ATTACK_TYPES: AttackType[] = ['Corpo-a-corpo', 'Distância', 'Magia']

const DAMAGE_TYPES: DamageType[] = [
    'Ácido',
    'Frio',
    'Fogo',
    'Elétrico',
    'Trovão',
    'Veneno',
    'Necrótico',
    'Radiante',
    'Psíquico',
    'Força',
    'Concussão',
    'Perfuração',
    'Corte',
]

function createAction(): MonsterAction {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
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

export function MonsterActionsPanel({
    sheet,
    isEditing,
    onChange,
}: MonsterComponentProps) {
    const [collapsedActionIds, setCollapsedActionIds] = useState<Set<string>>(new Set())
    const [collapsedReactionIds, setCollapsedReactionIds] = useState<Set<string>>(new Set())
    const actions = sheet.actions
    const reactions = sheet.reactions
    const indexedActions = actions.map((action, index) => ({ action, index }))
    const multiattacks = indexedActions.filter(({ action }) => action.isMultiattack)
    const regularActions = indexedActions.filter(({ action }) => !action.isMultiattack)

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

    function getNextLimitedUseState(
        item: Pick<MonsterAction, 'currentUses' | 'maxUses'>,
        maxUses: number,
    ) {
        return setResourceMax(
            { current: item.currentUses, max: item.maxUses },
            maxUses,
            1,
        )
    }

    function setActionLimitedUses(index: number, enabled: boolean) {
        const action = actions[index]
        const next = getNextLimitedUseState(action, Math.max(1, action.maxUses))

        setAction(index, {
            hasLimitedUses: enabled,
            maxUses: next.max,
            currentUses: next.current,
        })
    }

    function setReactionLimitedUses(index: number, enabled: boolean) {
        const reaction = reactions[index]
        const next = getNextLimitedUseState(reaction, Math.max(1, reaction.maxUses))

        setReaction(index, {
            hasLimitedUses: enabled,
            maxUses: next.max,
            currentUses: next.current,
        })
    }

    function setActionMaxUses(index: number, value: number) {
        const action = actions[index]
        const next = getNextLimitedUseState(action, value)
        setAction(index, { maxUses: next.max, currentUses: next.current })
    }

    function setReactionMaxUses(index: number, value: number) {
        const reaction = reactions[index]
        const next = getNextLimitedUseState(reaction, value)
        setReaction(index, { maxUses: next.max, currentUses: next.current })
    }

    function spendActionUse(index: number) {
        const action = actions[index]
        if (!action.hasLimitedUses) return

        const next = spendResource({ current: action.currentUses, max: action.maxUses })
        setAction(index, { currentUses: next.current })
    }

    function restoreActionUse(index: number) {
        const action = actions[index]
        if (!action.hasLimitedUses) return

        const next = restoreResource({ current: action.currentUses, max: action.maxUses })
        setAction(index, { currentUses: next.current })
    }

    function resetActionUses(index: number) {
        const action = actions[index]
        if (!action.hasLimitedUses) return

        const next = restoreResourceFull({ current: action.currentUses, max: action.maxUses })
        setAction(index, { currentUses: next.current })
    }

    function spendReactionUse(index: number) {
        const reaction = reactions[index]
        if (!reaction.hasLimitedUses) return

        const next = spendResource({ current: reaction.currentUses, max: reaction.maxUses })
        setReaction(index, { currentUses: next.current })
    }

    function restoreReactionUse(index: number) {
        const reaction = reactions[index]
        if (!reaction.hasLimitedUses) return

        const next = restoreResource({ current: reaction.currentUses, max: reaction.maxUses })
        setReaction(index, { currentUses: next.current })
    }

    function resetReactionUses(index: number) {
        const reaction = reactions[index]
        if (!reaction.hasLimitedUses) return

        const next = restoreResourceFull({ current: reaction.currentUses, max: reaction.maxUses })
        setReaction(index, { currentUses: next.current })
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

                                        <label className={panelStyles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={action.hasLimitedUses}
                                                onChange={(event) =>
                                                    setActionLimitedUses(index, event.target.checked)
                                                }
                                            />
                                            Usos limitados?
                                        </label>
                                    </div>

                                    {action.hasLimitedUses && (
                                        <div className={styles.limitedUsesGrid}>
                                            <label className={styles.field}>
                                                Máximo
                                                <NumberInput
                                                    min={1}
                                                    value={action.maxUses}
                                                    emptyValue={1}
                                                    onChange={(value) => setActionMaxUses(index, value)}
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                Recarga
                                                <select
                                                    value={action.recharge}
                                                    onChange={(event) =>
                                                        setAction(index, {
                                                            recharge: event.target.value as MonsterAction['recharge'],
                                                        })
                                                    }
                                                >
                                                    {RECHARGE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}

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
                                            <NumberInput
                                                min={1}
                                                value={action.attackCount}
                                                emptyValue={1}
                                                onChange={(value) =>
                                                    setAction(index, {
                                                        attackCount: Math.max(1, Math.trunc(value)),
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

                                    <label className={panelStyles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={reaction.hasLimitedUses}
                                            onChange={(event) =>
                                                setReactionLimitedUses(index, event.target.checked)
                                            }
                                        />
                                        Usos limitados?
                                    </label>

                                    {reaction.hasLimitedUses && (
                                        <div className={styles.limitedUsesGrid}>
                                            <label className={styles.field}>
                                                Máximo
                                                <NumberInput
                                                    min={1}
                                                    value={reaction.maxUses}
                                                    emptyValue={1}
                                                    onChange={(value) => setReactionMaxUses(index, value)}
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                Recarga
                                                <select
                                                    value={reaction.recharge}
                                                    onChange={(event) =>
                                                        setReaction(index, {
                                                            recharge: event.target.value as MonsterFeature['recharge'],
                                                        })
                                                    }
                                                >
                                                    {RECHARGE_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}

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
                            {multiattacks.map(({ action, index }) => {
                                const actionId = action.id || `multiattack-${index}`

                                return (
                                    <article className={styles.multiattackCard} key={actionId}>
                                        <h3 className={styles.multiattackTitle}>
                                            {action.name.trim() || 'Multiataque'}. Realiza {action.attackCount} ataques por turno.
                                        </h3>
                                        {action.hasLimitedUses && (
                                            <div className={styles.summaryRow}>
                                                <ManagedResourceControls
                                                    current={action.currentUses}
                                                    max={action.maxUses}
                                                    itemName={action.name}
                                                    resourceKind="ação"
                                                    onSpend={() => spendActionUse(index)}
                                                    onRestore={() => restoreActionUse(index)}
                                                    onRestoreFull={() => resetActionUses(index)}
                                                    restoreFullText="Recarregar"
                                                    meta={<span className={styles.metaChip}>{getRechargeLabel(action.recharge)}</span>}
                                                />
                                            </div>
                                        )}
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
                            {regularActions.map(({ action, index }) => {
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
                                            {action.hasLimitedUses && (
                                                <span className={styles.cardMeta}>
                                                    usos: {action.currentUses}/{action.maxUses}
                                                </span>
                                            )}
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

                                                {action.hasLimitedUses && (
                                                    <div className={styles.summaryRow}>
                                                        <ManagedResourceControls
                                                            current={action.currentUses}
                                                            max={action.maxUses}
                                                            itemName={action.name}
                                                            resourceKind="ação"
                                                            onSpend={() => spendActionUse(index)}
                                                            onRestore={() => restoreActionUse(index)}
                                                            onRestoreFull={() => resetActionUses(index)}
                                                            restoreFullText="Recarregar"
                                                            meta={<span className={styles.metaChip}>{getRechargeLabel(action.recharge)}</span>}
                                                        />
                                                    </div>
                                                )}

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
                                                {reaction.hasLimitedUses && (
                                                    <span className={styles.cardMeta}>
                                                        usos: {reaction.currentUses}/{reaction.maxUses}
                                                    </span>
                                                )}
                                                <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                            </button>

                                            {!isCollapsed && (
                                                <div className={styles.cardBody}>
                                                    {reaction.hasLimitedUses && (
                                                        <div className={styles.summaryRow}>
                                                            <ManagedResourceControls
                                                                current={reaction.currentUses}
                                                                max={reaction.maxUses}
                                                                itemName={reaction.name}
                                                                resourceKind="reação"
                                                                onSpend={() => spendReactionUse(index)}
                                                                onRestore={() => restoreReactionUse(index)}
                                                                onRestoreFull={() => resetReactionUses(index)}
                                                                restoreFullText="Recarregar"
                                                                meta={<span className={styles.metaChip}>{getRechargeLabel(reaction.recharge)}</span>}
                                                            />
                                                        </div>
                                                    )}

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
