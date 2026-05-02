import { useState } from 'react'
import type { LegendaryAction } from '../../../types/system/dnd/monsterSheet'
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
    type MonsterComponentProps,
} from '../shared'
import styles from './LegendaryActionsPanel.module.css'

function createLegendaryAction(): LegendaryAction {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        cost: 1,
        description: '',
    }
}

function parsePoints(rawValue: string, fallback: number, minimum = 0): number {
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? Math.max(minimum, Math.trunc(parsed)) : fallback
}

export function LegendaryActionsPanel({
    sheet,
    isEditing,
    onChange,
}: MonsterComponentProps) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
    const legendary = sheet.legendary
    const actions = legendary.actions

    function updateLegendary(patch: Partial<typeof legendary>) {
        onChange({ legendary: patch })
    }

    function toggleCollapse(id: string) {
        setCollapsedIds((previous) => {
            const next = new Set(previous)

            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }

            return next
        })
    }

    function updateActions(updated: LegendaryAction[]) {
        updateLegendary({ actions: updated })
    }

    function setAction(index: number, patch: Partial<LegendaryAction>) {
        updateActions(
            actions.map((action, currentIndex) =>
                currentIndex === index ? { ...action, ...patch } : action,
            ),
        )
    }

    function addAction() {
        updateActions([...actions, createLegendaryAction()])
    }

    function removeAction(index: number) {
        updateActions(actions.filter((_, currentIndex) => currentIndex !== index))
    }

    function getLegendaryResource() {
        return {
            current: Math.max(0, legendary.pointsPerRound - legendary.pointsUsed),
            max: legendary.pointsPerRound,
        }
    }

    function setPointsPerRound(value: number) {
        const next = setResourceMax(getLegendaryResource(), value)
        updateLegendary({
            pointsPerRound: next.max,
            pointsUsed: next.max - next.current,
        })
    }

    function spendLegendaryPoints(amount = 1) {
        const next = spendResource(getLegendaryResource(), amount)
        updateLegendary({ pointsUsed: next.max - next.current })
    }

    function restoreLegendaryPoints(amount = 1) {
        const next = restoreResource(getLegendaryResource(), amount)
        updateLegendary({ pointsUsed: next.max - next.current })
    }

    function resetLegendaryPoints() {
        const next = restoreResourceFull(getLegendaryResource())
        updateLegendary({ pointsUsed: next.max - next.current })
    }

    function renderPointsTracker() {
        const resource = getLegendaryResource()

        return (
            <ManagedResourceControls
                current={resource.current}
                max={resource.max}
                itemName="pontos lendários"
                resourceKind="ação lendária"
                spendAriaLabel="Gastar ponto de ação lendária"
                restoreAriaLabel="Restaurar ponto de ação lendária"
                restoreFullAriaLabel="Restaurar todos os pontos de ação lendária"
                onSpend={() => spendLegendaryPoints()}
                onRestore={() => restoreLegendaryPoints()}
                onRestoreFull={resetLegendaryPoints}
                restoreFullText="Resetar turno"
            />
        )
    }

    function renderCostTracker(cost: number) {
        return (
            <span className={styles.costTracker} aria-hidden="true">
                {Array.from({ length: cost }, (_, dotIndex) => (
                    <span key={`cost-${cost}-${dotIndex}`} className={`${styles.costDot} ${styles.costDotFilled}`} />
                ))}
            </span>
        )
    }

    if (!isEditing && actions.length === 0) {
        return null
    }

    return (
        <section className={`${panelStyles.panel} ${styles.panel}`}>
            <div className={panelStyles.panelHeader}>
                <h2 className={panelStyles.panelTitle}>Ações Lendárias</h2>
                <p className={panelStyles.panelSubtitle}>Recursos extras fora do turno comum</p>
            </div>

            {isEditing ? (
                <div className={styles.layout}>
                    <div className={styles.topGrid}>
                        <label className={`${styles.field} ${styles.pointsField}`}>
                            Pontos por rodada
                            <NumberInput
                                min={0}
                                value={legendary.pointsPerRound}
                                onChange={setPointsPerRound}
                            />
                        </label>

                        <label className={styles.field}>
                            Descrição geral
                            <textarea
                                rows={4}
                                value={legendary.description}
                                onChange={(event) =>
                                    updateLegendary({ description: event.target.value })
                                }
                                placeholder="Explique quando e como as ações lendárias são usadas"
                            />
                        </label>
                    </div>

                    <div className={styles.list}>
                        {actions.map((action, index) => {
                            const actionId = action.id || `legendary-${index}`

                            return (
                                <article className={styles.card} key={actionId}>
                                    <div className={styles.cardHeader}>
                                        <label className={`${styles.field} ${styles.nameField}`}>
                                            Nome
                                            <input
                                                type="text"
                                                value={action.name}
                                                onChange={(event) => setAction(index, { name: event.target.value })}
                                                placeholder="Nome da ação lendária"
                                            />
                                        </label>

                                        <label className={`${styles.field} ${styles.costField}`}>
                                            Custo
                                            <select
                                                value={action.cost}
                                                onChange={(event) =>
                                                    setAction(index, { cost: parsePoints(event.target.value, action.cost, 1) })
                                                }
                                            >
                                                <option value={1}>1 ponto</option>
                                                <option value={2}>2 pontos</option>
                                                <option value={3}>3 pontos</option>
                                            </select>
                                        </label>

                                        <button
                                            type="button"
                                            className={panelStyles.removeButton}
                                            onClick={() => removeAction(index)}
                                        >
                                            Remover
                                        </button>
                                    </div>

                                    <label className={styles.field}>
                                        Descrição
                                        <textarea
                                            rows={4}
                                            value={action.description}
                                            onChange={(event) =>
                                                setAction(index, { description: event.target.value })
                                            }
                                            placeholder="Descreva o efeito da ação lendária"
                                        />
                                    </label>
                                </article>
                            )
                        })}

                        {actions.length === 0 && (
                            <p className={panelStyles.emptyState}>Nenhuma ação lendária cadastrada.</p>
                        )}

                        <button type="button" className={panelStyles.addButton} onClick={addAction}>
                            + Nova Ação Lendária
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.layout}>
                    {legendary.description.trim() && (
                        <p className={styles.overview}>{legendary.description}</p>
                    )}

                    <div className={styles.trackerRow}>
                        <div className={styles.trackerSummary}>
                            {renderPointsTracker()}
                            <span className={styles.pointsSummary}>
                                {getLegendaryResource().current} / {legendary.pointsPerRound} pontos disponíveis
                            </span>
                        </div>

                    </div>

                    <div className={styles.list}>
                        {actions.map((action, index) => {
                            const actionId = action.id || `legendary-${index}`
                            const isCollapsed = collapsedIds.has(actionId)

                            return (
                                <article className={styles.card} key={actionId}>
                                    <button
                                        type="button"
                                        className={styles.cardToggle}
                                        onClick={() => toggleCollapse(actionId)}
                                        aria-expanded={!isCollapsed}
                                    >
                                        <span className={styles.cardTitle}>{action.name || '(sem nome)'}</span>
                                        <span className={styles.cardMeta}>
                                            {renderCostTracker(action.cost)}
                                            {action.cost} ponto{action.cost === 1 ? '' : 's'}
                                        </span>
                                        <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                    </button>

                                    {!isCollapsed && (
                                        <div className={styles.cardBody}>
                                            <div className={styles.actionResourceRow}>
                                                <ManagedResourceControls
                                                    current={getLegendaryResource().current}
                                                    max={legendary.pointsPerRound}
                                                    itemName={action.name}
                                                    resourceKind="ação lendária"
                                                    spendAmount={action.cost}
                                                    restoreAmount={action.cost}
                                                    onSpend={() => spendLegendaryPoints(action.cost)}
                                                    onRestore={() => restoreLegendaryPoints(action.cost)}
                                                />
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
                </div>
            )}
        </section>
    )
}
