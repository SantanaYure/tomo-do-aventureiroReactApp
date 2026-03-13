import type { MonsterSheet } from '../../../types/system/dnd/monsterSheet'
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

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function MonsterStatsPanel({
  sheet,
  isEditing,
  onChange,
}: MonsterComponentProps) {
  const { stats } = sheet

  function updateStats(patch: DeepPartial<MonsterSheet['stats']>) {
    onChange({ stats: patch })
  }

  return (
    <section className={`${panelStyles.panel} ${styles.panel}`}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Estatísticas</h2>
        <p className={panelStyles.panelSubtitle}>Modificadores calculados automaticamente</p>
      </div>

      <div className={styles.summaryRow}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pontos de Vida</span>
          {isEditing ? (
            <div className={styles.hitPointsEditor}>
              <label className={styles.inlineField}>
                Atual
                <input
                  className={styles.summaryInput}
                  type="number"
                  min={0}
                  value={stats.hp}
                  onChange={(event) =>
                    updateStats({ hp: clampMetric(parseNumberInput(event.target.value, stats.hp)) })
                  }
                />
              </label>
              <span className={styles.summarySeparator}>/</span>
              <label className={styles.inlineField}>
                Máx
                <input
                  className={styles.summaryInput}
                  type="number"
                  min={0}
                  value={stats.maxHp}
                  onChange={(event) =>
                    updateStats({
                      maxHp: clampMetric(parseNumberInput(event.target.value, stats.maxHp)),
                    })
                  }
                />
              </label>
            </div>
          ) : (
            <div className={styles.summaryValueGroup}>
              <strong className={styles.summaryValue}>{stats.hp}</strong>
              <span className={styles.summarySeparator}>/</span>
              <strong className={styles.summaryValue}>{stats.maxHp}</strong>
            </div>
          )}
        </article>

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

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Deslocamento</span>
          {isEditing ? (
            <label className={styles.inlineField}>
              Metros
              <input
                className={styles.summaryInput}
                type="number"
                min={0}
                value={stats.speed}
                onChange={(event) =>
                  updateStats({
                    speed: clampMetric(parseNumberInput(event.target.value, stats.speed)),
                  })
                }
              />
            </label>
          ) : (
            <strong className={styles.summaryValue}>{stats.speed} m</strong>
          )}
        </article>
      </div>

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