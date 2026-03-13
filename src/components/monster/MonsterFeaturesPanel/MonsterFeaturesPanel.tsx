import { useState } from 'react'
import type { MonsterFeature } from '../../../types/system/dnd/monsterSheet'
import panelStyles from '../../../styles/panel.module.css'
import {
    clampTrackerValue,
    getRechargeLabel,
    MAX_TRACKER_DOTS,
    type MonsterComponentProps,
    RECHARGE_OPTIONS,
} from '../shared'
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

function parseCount(rawValue: string, fallback: number, minimum = 0): number {
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? Math.max(minimum, Math.trunc(parsed)) : fallback
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
        const nextCurrent = enabled
            ? feature.currentUses >= feature.maxUses
                ? nextMax
                : clampTrackerValue(feature.currentUses, nextMax)
            : clampTrackerValue(feature.currentUses, nextMax)

        setFeature(index, {
            hasLimitedUses: enabled,
            maxUses: nextMax,
            currentUses: nextCurrent,
        })
    }

    function setMaxUses(index: number, rawValue: string) {
        const feature = features[index]
        const nextMax = parseCount(rawValue, feature.maxUses, 1)
        const nextCurrent = feature.currentUses >= feature.maxUses
            ? nextMax
            : clampTrackerValue(feature.currentUses, nextMax)

        setFeature(index, {
            maxUses: nextMax,
            currentUses: nextCurrent,
        })
    }

    function adjustCurrentUses(index: number, delta: number) {
        const feature = features[index]

        if (!feature.hasLimitedUses) {
            return
        }

        setFeature(index, {
            currentUses: clampTrackerValue(feature.currentUses + delta, feature.maxUses),
        })
    }

    function resetCurrentUses(index: number) {
        const feature = features[index]

        if (!feature.hasLimitedUses) {
            return
        }

        setFeature(index, { currentUses: feature.maxUses })
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

        if (feature.maxUses > MAX_TRACKER_DOTS) {
            return <span className={styles.usageText}>{feature.currentUses} / {feature.maxUses} usos</span>
        }

        return (
            <div className={styles.usageTracker}>
                {Array.from({ length: feature.maxUses }, (_, dotIndex) => {
                    const isFilled = dotIndex < feature.currentUses

                    return (
                        <button
                            key={`${feature.id || index}-usage-${dotIndex}`}
                            type="button"
                            className={isFilled ? `${styles.usageDot} ${styles.usageDotFilled}` : styles.usageDot}
                            onClick={() => adjustCurrentUses(index, isFilled ? 1 : -1)}
                            aria-label={isFilled ? 'Recuperar um uso' : 'Gastar um uso'}
                            aria-pressed={isFilled}
                        />
                    )
                })}
            </div>
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
                                        className={panelStyles.removeButton}
                                        onClick={() => removeFeature(index)}
                                    >
                                        Remover
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
                                            <input
                                                type="number"
                                                min={1}
                                                value={feature.maxUses}
                                                onChange={(event) => setMaxUses(index, event.target.value)}
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
                                                <span className={styles.usageText}>
                                                    {feature.currentUses} / {feature.maxUses} usos
                                                </span>
                                                {renderUsageTracker(feature, index)}
                                                <span className={styles.metaChip}>
                                                    {getRechargeLabel(feature.recharge)}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.rechargeButton}
                                                    onClick={() => resetCurrentUses(index)}
                                                >
                                                    Recarregar
                                                </button>
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