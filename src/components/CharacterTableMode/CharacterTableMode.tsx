import type { CharacterSheet } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import { ManagedResourceControls } from '../ManagedResourceControls/ManagedResourceControls'
import { spendResource, restoreResource, restoreResourceFull } from '../../utils/manageableResource'
import { isRestBasedReset } from '../../utils/restRules'
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

const ATTR_NAME_BY_KEY: Record<string, string> = {
  str: 'Força', dex: 'Destreza', con: 'Constituição',
  int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma',
}

function calcAttackBonus(attack: CharacterSheet['attacks'][number], character: CharacterSheet['character']): number {
  const profBonus = calcProficiencyBonus(character.classes)
  if (attack.attributeKey === 'manual' || !attack.attributeKey) return attack.attackBonus ?? 0
  const attrName = ATTR_NAME_BY_KEY[attack.attributeKey]
  const attr = character.attributes.find((a) => a.name === attrName)
  return (attr ? calcModifier(attr.value) : 0) + (attack.useProficiency ? profBonus : 0)
}

export function CharacterTableMode({ sheet, onUpdate }: CharacterTableModeProps) {
  const { character } = sheet

  return (
    <>
      {/* ── Seção C: Recursos gerenciáveis ── */}
      {sheet.resources.some((r) => (r.max ?? 0) > 0) && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Recursos</span>
          <div className={styles.resourceList}>
            {sheet.resources
              .map((resource, originalIndex) => ({ resource, originalIndex }))
              .filter(({ resource: r }) => (r.max ?? 0) > 0)
              .map(({ resource, originalIndex }) => {
                const current = resource.current ?? 0
                const max = resource.max ?? 0
                const restBased = isRestBasedReset(resource.resetOn)

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
                  <div className={styles.resourceRow} key={originalIndex}>
                    <span className={styles.resourceName}>{resource.name || '(sem nome)'}</span>
                    <ManagedResourceControls
                      current={current}
                      max={max}
                      itemName={resource.name || ''}
                      resourceKind="recurso"
                      onSpend={spend}
                      onRestore={restBased ? undefined : restore}
                      onRestoreFull={restBased ? undefined : restoreFull}
                      restoreFullText="Recarregar"
                      meta={
                        resource.resetOn && resource.resetOn !== 'na'
                          ? <span className={styles.resetBadge}>{RESET_LABEL[resource.resetOn] ?? resource.resetOn}</span>
                          : undefined
                      }
                    />
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* ── Seção D: Ataques ── */}
      {sheet.attacks.length > 0 && (
        <section className={panelStyles.panel}>
          <span className={styles.sectionTitle}>Ataques</span>
          <table className={styles.attackTable}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Bônus</th>
                <th>Dano</th>
              </tr>
            </thead>
            <tbody>
              {sheet.attacks.map((attack, index) => {
                const bonus = calcAttackBonus(attack, character)
                const damage = [attack.damage, attack.damageType].filter(Boolean).join(' ')
                return (
                  <tr key={index}>
                    <td className={styles.attackName}>{attack.name || '(sem nome)'}</td>
                    <td>{fmt(bonus)}</td>
                    <td>{damage || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
    </>
  )
}
