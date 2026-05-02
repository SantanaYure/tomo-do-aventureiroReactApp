import { useState } from 'react'
import type { MonsterFeature } from '../../../types/system/dnd/monsterSheet'
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
import { isRestBasedRecharge } from '../../../utils/restRules'
import styles from './MonsterFeaturesPanel.module.css'

function createFeature(): MonsterFeature {
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

export function MonsterFeaturesPanel({
    sheet,
    isEditing,
    onChange,
}: MonsterComponentProps) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
    const features = sheet.features

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

    function updateFeatures(updated: MonsterFeature[]) {
        onChange({ features: updated })
    }

    function setFeature(index: number, patch: Partial<MonsterFeature>) {
        updateFeatures(
            features.map((feature, currentIndex) =>
                currentIndex === index ? { ...feature, ...patch } : feature,
            ),
        )
    }

    function setLimitedUses(index: number, enabled: boolean) {
        const feature = features[index]
        const nextMax = Math.max(1, feature.maxUses)
        const next = setResourceMax(
            { current: feature.currentUses, max: feature.maxUses },
            nextMax,
            1,
        )

        setFeature(index, {
            hasLimitedUses: enabled,
            maxUses: next.max,
            currentUses: next.current,
        })
    }

    function setMaxUses(index: number, value: number) {
        const feature = features[index]
        const next = setResourceMax(
            { current: feature.currentUses, max: feature.maxUses },
            value,
            1,
        )

        setFeature(index, {
            maxUses: next.max,
            currentUses: next.current,
        })
    }

    function spendFeatureUse(index: number) {
        const feature = features[index]

        if (!feature.hasLimitedUses) {
            return
        }

        const next = spendResource({ current: feature.currentUses, max: feature.maxUses })
        setFeature(index, {
            currentUses: next.current,
        })
    }

    function restoreFeatureUse(index: number) {
        const feature = features[index]

        if (!feature.hasLimitedUses) {
            return
        }

        const next = restoreResource({ current: feature.currentUses, max: feature.maxUses })
        setFeature(index, { currentUses: next.current })
    }

    function resetCurrentUses(index: number) {
        const feature = features[index]

        if (!feature.hasLimitedUses) {
            return
        }

        const next = restoreResourceFull({ current: feature.currentUses, max: feature.maxUses })
        setFeature(index, { currentUses: next.current })
    }

    function addFeature() {
        updateFeatures([...features, createFeature()])
    }

    function removeFeature(index: number) {
        updateFeatures(features.filter((_, currentIndex) => currentIndex !== index))
    }

    function renderUsageTracker(feature: MonsterFeature, index: number) {
        if (!feature.hasLimitedUses) {
            return null
        }

        const restBased = isRestBasedRecharge(feature.recharge)

        return (
            <ManagedResourceControls
                current={feature.currentUses}
                max={feature.maxUses}
                itemName={feature.name}
                resourceKind="habilidade"
                onSpend={() => spendFeatureUse(index)}
                onRestore={restBased ? undefined : () => restoreFeatureUse(index)}
                onRestoreFull={restBased ? undefined : () => resetCurrentUses(index)}
                restoreFullText="Recarregar"
                meta={<span className={styles.metaChip}>{getRechargeLabel(feature.recharge)}</span>}
            />
        )
    }

    return (
        <section className={`${panelStyles.panel} ${styles.panel}`}>
            <div className={panelStyles.panelHeader}>
                <h2 className={panelStyles.panelTitle}>Habilidades Especiais</h2>
                <p className={panelStyles.panelSubtitle}>Traços passivos e capacidades nativas</p>
            </div>

            {isEditing ? (
                <div className={styles.list}>
                    {features.map((feature, index) => {
                        const featureId = feature.id || `feature-${index}`

                        return (
                            <article className={styles.card} key={featureId}>
                                <div className={styles.cardHeader}>
                                    <label className={`${styles.field} ${styles.nameField}`}>
                                        Nome
                                        <input
                                            type="text"
                                            value={feature.name}
                                            onChange={(event) => setFeature(index, { name: event.target.value })}
                                            placeholder="Nome da habilidade"
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() => removeFeature(index)}
                                        aria-label={`Excluir habilidade ${feature.name || `#${index + 1}`}`}
                                        title="Excluir habilidade"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <label className={panelStyles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={feature.hasLimitedUses}
                                        onChange={(event) => setLimitedUses(index, event.target.checked)}
                                    />
                                    Usos limitados?
                                </label>

                                {feature.hasLimitedUses && (
                                    <div className={styles.limitedUsesGrid}>
                                        <label className={styles.field}>
                                            Máximo
                                            <NumberInput
                                                min={1}
                                                value={feature.maxUses}
                                                emptyValue={1}
                                                onChange={(value) => setMaxUses(index, value)}
                                            />
                                        </label>

                                        <label className={styles.field}>
                                            Recarga
                                            <select
                                                value={feature.recharge}
                                                onChange={(event) =>
                                                    setFeature(index, { recharge: event.target.value as MonsterFeature['recharge'] })
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

                                <div className={styles.detailsGrid}>
                                    <label className={styles.field}>
                                        Alcance
                                        <input
                                            type="text"
                                            value={feature.range}
                                            onChange={(event) => setFeature(index, { range: event.target.value })}
                                            placeholder="18m, toque ou pessoal"
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        Duração
                                        <input
                                            type="text"
                                            value={feature.duration}
                                            onChange={(event) => setFeature(index, { duration: event.target.value })}
                                            placeholder="Instantânea ou Concentração, 1 min"
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        Requisitos
                                        <input
                                            type="text"
                                            value={feature.requirements}
                                            onChange={(event) => setFeature(index, { requirements: event.target.value })}
                                            placeholder="V, S, material ou condição"
                                        />
                                    </label>
                                </div>

                                <label className={styles.field}>
                                    Descrição
                                    <textarea
                                        rows={4}
                                        value={feature.description}
                                        onChange={(event) =>
                                            setFeature(index, { description: event.target.value })
                                        }
                                        placeholder="Descrição da habilidade"
                                    />
                                </label>
                            </article>
                        )
                    })}

                    {features.length === 0 && (
                        <p className={panelStyles.emptyState}>Nenhuma habilidade especial cadastrada.</p>
                    )}

                    <button type="button" className={panelStyles.addButton} onClick={addFeature}>
                        + Nova Habilidade
                    </button>
                </div>
            ) : features.length > 0 ? (
                <div className={styles.list}>
                    {features.map((feature, index) => {
                        const featureId = feature.id || `feature-${index}`
                        const isCollapsed = collapsedIds.has(featureId)

                        return (
                            <article className={styles.card} key={featureId}>
                                <button
                                    type="button"
                                    className={styles.cardToggle}
                                    onClick={() => toggleCollapse(featureId)}
                                    aria-expanded={!isCollapsed}
                                >
                                    <span className={styles.cardTitle}>{feature.name || '(sem nome)'}</span>

                                    {feature.hasLimitedUses && (
                                        <div className={styles.collapsedMeta}>
                                            <span className={styles.metaChip}>
                                                usos: {feature.currentUses}/{feature.maxUses}
                                            </span>
                                            <span className={styles.metaChip}>
                                                {getRechargeLabel(feature.recharge)}
                                            </span>
                                        </div>
                                    )}

                                    <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                </button>

                                {!isCollapsed && (
                                    <div className={styles.cardBody}>
                                        {feature.hasLimitedUses && (
                                            <div className={styles.summaryRow}>
                                                {renderUsageTracker(feature, index)}
                                            </div>
                                        )}

                                        {(feature.range.trim() || feature.duration.trim() || feature.requirements.trim()) && (
                                            <div className={styles.detailRow}>
                                                {feature.range.trim() && (
                                                    <span className={styles.detailChip}>Alcance: {feature.range}</span>
                                                )}
                                                {feature.duration.trim() && (
                                                    <span className={styles.detailChip}>Duração: {feature.duration}</span>
                                                )}
                                                {feature.requirements.trim() && (
                                                    <span className={styles.detailChip}>Requisitos: {feature.requirements}</span>
                                                )}
                                            </div>
                                        )}

                                        <p className={feature.description.trim() ? styles.description : styles.emptyText}>
                                            {feature.description.trim() || 'Sem descrição adicional.'}
                                        </p>
                                    </div>
                                )}
                            </article>
                        )
                    })}
                </div>
            ) : (
                <p className={panelStyles.emptyState}>Nenhuma habilidade especial cadastrada.</p>
            )}
        </section>
    )
}
