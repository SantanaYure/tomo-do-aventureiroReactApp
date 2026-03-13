import { useState } from 'react'
import type { MonsterFeature } from '../../../types/system/dnd/monsterSheet'
import panelStyles from '../../../styles/panel.module.css'
import type { MonsterComponentProps } from '../shared'
import styles from './MonsterFeaturesPanel.module.css'

function createFeature(): MonsterFeature {
    return {
        id: globalThis.crypto.randomUUID(),
        name: '',
        description: '',
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

    function addFeature() {
        updateFeatures([...features, createFeature()])
    }

    function removeFeature(index: number) {
        updateFeatures(features.filter((_, currentIndex) => currentIndex !== index))
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
                                    <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                                </button>

                                {!isCollapsed && (
                                    <div className={styles.cardBody}>
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