import { useState } from 'react'
import type { MonsterMovement, MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import panelStyles from '../../../styles/panel.module.css'
import type { DeepPartial, MonsterComponentProps } from '../shared'
import styles from './MonsterStatsPanel.module.css'

const ABILITIES = [
    { key: 'strength', shortLabel: 'For', label: 'Força' },
    { key: 'dexterity', shortLabel: 'Des', label: 'Destreza' },
    { key: 'constitution', shortLabel: 'Con', label: 'Constituição' },
    { key: 'intelligence', shortLabel: 'Int', label: 'Inteligência' },
    { key: 'wisdom', shortLabel: 'Sab', label: 'Sabedoria' },
    { key: 'charisma', shortLabel: 'Car', label: 'Carisma' },
] as const satisfies ReadonlyArray<{
    key: keyof MonsterSheet['stats']
    shortLabel: string
    label: string
}>

function parseNumberInput(rawValue: string, fallback: number): number {
    const parsed = Number(rawValue)
    return Number.isFinite(parsed) ? parsed : fallback
}

function clampAbility(value: number): number {
    return Math.min(30, Math.max(1, Math.trunc(value)))
}

function clampMetric(value: number): number {
    return Math.max(0, Math.trunc(value))
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, Math.trunc(value)))
}

function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2)
}

function formatModifier(modifier: number): string {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function createMovement(): MonsterMovement {
    return {
        id: globalThis.crypto.randomUUID(),
        source: '',
        distance: 0,
    }
}

function formatMovement(movement: MonsterMovement): string {
    const source = movement.source.trim() || 'Sem tipo'
    return `${source} ${movement.distance} m`
}

export function MonsterStatsPanel({
    sheet,
    isEditing,
    onChange,
}: MonsterComponentProps) {
    const [actionValue, setActionValue] = useState('')
    const { stats } = sheet
    const effectiveHpMax = clampMetric(stats.maxHp)
    const displayedCurrentHp = clamp(stats.hpCurrent, 0, effectiveHpMax)
    const displayedTempHp = clampMetric(stats.hpTemp)
    const movements = stats.movements

    function updateStats(patch: DeepPartial<MonsterSheet['stats']>) {
        onChange({ stats: patch })
    }

    function updateMovements(updated: MonsterMovement[]) {
        updateStats({ movements: updated })
    }

    function setMovement(index: number, patch: Partial<MonsterMovement>) {
        updateMovements(
            movements.map((movement, currentIndex) =>
                currentIndex === index ? { ...movement, ...patch } : movement,
            ),
        )
    }

    function addMovement() {
        updateMovements([...movements, createMovement()])
    }

    function removeMovement(index: number) {
        updateMovements(movements.filter((_, currentIndex) => currentIndex !== index))
    }

    function setHpCurrent(value: number) {
        updateStats({ hpCurrent: clamp(value, 0, effectiveHpMax) })
    }

    function setHpTemp(value: number) {
        updateStats({ hpTemp: clampMetric(value) })
    }

    function setMaxHp(value: number) {
        const nextMaxHp = clampMetric(value)

        updateStats({
            maxHp: nextMaxHp,
            hpCurrent: Math.min(displayedCurrentHp, nextMaxHp),
        })
    }

    function applyHpAction(type: 'damage' | 'heal' | 'temp') {
        const value = Math.trunc(Number(actionValue))

        if (!Number.isFinite(value) || value <= 0) {
            return
        }

        let nextCurrentHp = displayedCurrentHp
        let nextTempHp = displayedTempHp

        if (type === 'damage') {
            const absorbedDamage = Math.min(nextTempHp, value)
            nextTempHp -= absorbedDamage
            nextCurrentHp = Math.max(0, nextCurrentHp - (value - absorbedDamage))
        }

        if (type === 'heal') {
            nextCurrentHp = Math.min(effectiveHpMax, nextCurrentHp + value)
        }

        if (type === 'temp') {
            nextTempHp = value > nextTempHp ? value : nextTempHp
        }

        updateStats({
            hpCurrent: nextCurrentHp,
            hpTemp: nextTempHp,
        })

        setActionValue('')
    }

    return (
        <section className={`${panelStyles.panel} ${styles.panel}`}>
            <div className={panelStyles.panelHeader}>
                <h2 className={panelStyles.panelTitle}>Estatísticas</h2>
                <p className={panelStyles.panelSubtitle}>Modificadores calculados automaticamente</p>
            </div>

            <div className={styles.summaryRow}>
                <article className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>CA</span>
                    {isEditing ? (
                        <label className={styles.inlineField}>
                            Classe de Armadura
                            <input
                                className={styles.summaryInput}
                                type="number"
                                min={0}
                                value={stats.ac}
                                onChange={(event) =>
                                    updateStats({ ac: clampMetric(parseNumberInput(event.target.value, stats.ac)) })
                                }
                            />
                        </label>
                    ) : (
                        <strong className={styles.summaryValue}>{stats.ac}</strong>
                    )}
                </article>

                <section className={styles.movementSection}>
                    <div className={styles.movementHeader}>
                        <h3 className={styles.movementTitle}>Deslocamento</h3>
                        <p className={styles.movementNote}>Terra, voo, nado, escalada e outras formas</p>
                    </div>

                    {isEditing ? (
                        <div className={styles.movementEditor}>
                            {movements.map((movement, index) => {
                                const movementId = movement.id || `movement-${index}`

                                return (
                                    <div className={styles.movementRow} key={movementId}>
                                        <label className={styles.movementSourceField}>
                                            Fonte
                                            <input
                                                className={styles.movementSourceInput}
                                                type="text"
                                                value={movement.source}
                                                placeholder="Terra, voo, nado, escalada..."
                                                onChange={(event) =>
                                                    setMovement(index, { source: event.target.value })
                                                }
                                            />
                                        </label>

                                        <label className={styles.movementDistanceField}>
                                            Metros
                                            <input
                                                className={styles.movementDistanceInput}
                                                type="number"
                                                min={0}
                                                value={movement.distance}
                                                onChange={(event) =>
                                                    setMovement(index, {
                                                        distance: clampMetric(
                                                            parseNumberInput(event.target.value, movement.distance),
                                                        ),
                                                    })
                                                }
                                            />
                                        </label>

                                        <div className={styles.movementAction}>
                                            <button
                                                type="button"
                                                className={panelStyles.removeButton}
                                                onClick={() => removeMovement(index)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}

                            {movements.length === 0 && (
                                <p className={styles.movementEmpty}>Nenhum deslocamento cadastrado.</p>
                            )}

                            <button
                                type="button"
                                className={panelStyles.addButton}
                                onClick={addMovement}
                            >
                                + Novo deslocamento
                            </button>
                        </div>
                    ) : (
                        <div className={styles.movementList}>
                            {movements.length > 0 ? (
                                movements.map((movement, index) => (
                                    <span
                                        className={styles.movementChip}
                                        key={movement.id || `movement-${index}`}
                                    >
                                        {formatMovement(movement)}
                                    </span>
                                ))
                            ) : (
                                <span className={styles.movementEmpty}>Sem deslocamento cadastrado.</span>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <section className={styles.hpSection}>
                <div className={styles.hpHeader}>
                    <h3 className={styles.hpTitle}>Pontos de Vida</h3>
                    <p className={styles.hpNote}>Atual, máximo, temporário, dano e cura</p>
                </div>

                {isEditing ? (
                    <div className={styles.hpRow}>
                        <div className={styles.hpBlock}>
                            <span className={styles.hpBlockLabel}>Máximo</span>
                            <input
                                className={`${panelStyles.compactInput} ${styles.hpInput}`}
                                type="number"
                                min={0}
                                value={effectiveHpMax}
                                onChange={(event) =>
                                    setMaxHp(parseNumberInput(event.target.value, effectiveHpMax))
                                }
                            />
                            <span className={styles.hpHelper}>Limite total de HP</span>
                        </div>

                        <div className={styles.hpBlock}>
                            <span className={styles.hpBlockLabel}>Atual</span>

                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperButton}
                                    aria-label="Reduzir HP atual"
                                    onClick={() => setHpCurrent(displayedCurrentHp - 1)}
                                >
                                    −
                                </button>

                                <input
                                    className={`${panelStyles.compactInput} ${styles.hpInput}`}
                                    type="number"
                                    min={0}
                                    max={effectiveHpMax}
                                    value={displayedCurrentHp}
                                    onChange={(event) =>
                                        setHpCurrent(parseNumberInput(event.target.value, displayedCurrentHp))
                                    }
                                />

                                <button
                                    type="button"
                                    className={styles.stepperButton}
                                    aria-label="Aumentar HP atual"
                                    onClick={() => setHpCurrent(displayedCurrentHp + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <span className={styles.hpHelper}>Limite: {effectiveHpMax}</span>
                        </div>

                        <div className={styles.hpBlock}>
                            <span className={styles.hpBlockLabel}>Temporário</span>

                            <div className={styles.stepper}>
                                <button
                                    type="button"
                                    className={styles.stepperButton}
                                    aria-label="Reduzir HP temporário"
                                    onClick={() => setHpTemp(displayedTempHp - 1)}
                                >
                                    −
                                </button>

                                <input
                                    className={`${panelStyles.compactInput} ${styles.hpInput}`}
                                    type="number"
                                    min={0}
                                    value={displayedTempHp}
                                    onChange={(event) =>
                                        setHpTemp(parseNumberInput(event.target.value, displayedTempHp))
                                    }
                                />

                                <button
                                    type="button"
                                    className={styles.stepperButton}
                                    aria-label="Aumentar HP temporário"
                                    onClick={() => setHpTemp(displayedTempHp + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <span className={styles.hpHelper}>Absorve dano antes do HP atual</span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.hpManager}>
                        <div className={styles.hpDisplay}>
                            <span className={styles.hpBlockLabel}>HP Atual:</span>
                            <input
                                className={styles.hpCurrent}
                                type="number"
                                min={0}
                                max={effectiveHpMax}
                                value={displayedCurrentHp}
                                onChange={(event) =>
                                    setHpCurrent(parseNumberInput(event.target.value, displayedCurrentHp))
                                }
                            />
                            <span className={styles.hpSeparator}>/</span>
                            <span className={styles.hpMax}>{effectiveHpMax}</span>
                        </div>

                        <div className={styles.hpTempRow}>
                            <span>Vida Temporária:</span>
                            <input
                                className={styles.hpTempInput}
                                type="number"
                                min={0}
                                value={displayedTempHp}
                                onChange={(event) =>
                                    setHpTemp(parseNumberInput(event.target.value, displayedTempHp))
                                }
                            />
                        </div>

                        <div className={styles.actionForm}>
                            <div className={styles.actionInputRow}>
                                <input
                                    className={styles.actionValueInput}
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    placeholder="Valor"
                                    value={actionValue}
                                    onChange={(event) =>
                                        setActionValue(event.target.value.replace(/[^\d]/g, ''))
                                    }
                                />
                            </div>

                            <div className={styles.actionButtonRow}>
                                <button
                                    type="button"
                                    className={styles.btnDamage}
                                    onClick={() => applyHpAction('damage')}
                                >
                                    Dano
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnHeal}
                                    onClick={() => applyHpAction('heal')}
                                >
                                    Cura
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnTemp}
                                    onClick={() => applyHpAction('temp')}
                                >
                                    Temp
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <div className={styles.abilityGrid}>
                {ABILITIES.map((ability) => {
                    const score = stats[ability.key]
                    const modifier = calculateModifier(score)

                    return (
                        <article className={styles.abilityCard} key={ability.key}>
                            <strong className={styles.abilityShortLabel}>{ability.shortLabel}</strong>
                            <span className={styles.abilityName}>{ability.label}</span>
                            {isEditing ? (
                                <label className={styles.abilityField}>
                                    <span className="sr-only">{ability.label}</span>
                                    <input
                                        className={styles.abilityInput}
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={score}
                                        onChange={(event) =>
                                            updateStats({
                                                [ability.key]: clampAbility(
                                                    parseNumberInput(event.target.value, score),
                                                ),
                                            })
                                        }
                                    />
                                </label>
                            ) : (
                                <strong className={styles.abilityValue}>{score}</strong>
                            )}
                            <span className={styles.abilityModifier}>{formatModifier(modifier)}</span>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}