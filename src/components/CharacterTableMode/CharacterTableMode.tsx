import { useState } from 'react'
import type { Attribute, CharacterSheet } from '../../types/system/dnd'
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

function getAttrMod(character: CharacterSheet['character'], name: Attribute['name']): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function calcEffectiveHpMax(character: CharacterSheet['character']): number {
  if (!character.hpAutoCalc) return Math.max(0, Math.trunc(character.hpMax))
  const conMod = getAttrMod(character, 'Constituição')
  let total = 0
  let firstLevel = false
  for (const cls of character.classes) {
    const levels = Math.max(0, Math.trunc(cls.level))
    const match = /d(\d+)/i.exec(cls.hitDice)
    const sides = match ? Number(match[1]) : 0
    if (levels === 0 || sides === 0) continue
    const avg = Math.floor(sides / 2) + 1
    for (let i = 0; i < levels; i++) {
      total += Math.max(1, (firstLevel ? avg : sides) + conMod)
      firstLevel = true
    }
  }
  const bonus = character.hpBonusEntries.reduce((sum, e) => {
    const v = Number(e.value)
    return sum + (Number.isFinite(v) ? Math.trunc(v) : 0)
  }, 0)
  return Math.max(0, total + bonus)
}

function calcPassivePerception(character: CharacterSheet['character'], profBonus: number): number {
  const wisMod = getAttrMod(character, 'Sabedoria')
  const perc = character.skills.perception
  const profLevel = Math.max(0, Math.min(2, Math.trunc(perc?.proficiency ?? 0)))
  return 10 + wisMod + profLevel * profBonus + (perc?.misc ?? 0) + (character.passivePerceptionBonus ?? 0)
}

const ABILITIES = [
  { key: 'Força',        short: 'FOR' },
  { key: 'Destreza',     short: 'DES' },
  { key: 'Constituição', short: 'CON' },
  { key: 'Inteligência', short: 'INT' },
  { key: 'Sabedoria',    short: 'SAB' },
  { key: 'Carisma',      short: 'CAR' },
] as const

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
  const [actionValue, setActionValue] = useState('')

  const profBonus = calcProficiencyBonus(character.classes)
  const hpMax = calcEffectiveHpMax(character)
  const hpCurrent = Math.min(Math.max(0, character.hpCurrent), hpMax)
  const hpTemp = Math.max(0, character.hpTemp)
  const ac = Math.max(0, Math.trunc(character.armorClassBase))
  const initiative = getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
  const passivePerception = calcPassivePerception(character, profBonus)

  function updateCharacter(patch: Partial<CharacterSheet['character']>) {
    onUpdate({ ...sheet, character: { ...character, ...patch } })
  }

  function applyHpAction(type: 'damage' | 'heal' | 'temp') {
    const value = Math.trunc(Number(actionValue))
    if (!Number.isFinite(value) || value <= 0) return
    let nextCurrent = hpCurrent
    let nextTemp = hpTemp
    if (type === 'damage') {
      const absorbed = Math.min(nextTemp, value)
      nextTemp -= absorbed
      nextCurrent = Math.max(0, nextCurrent - (value - absorbed))
    } else if (type === 'heal') {
      nextCurrent = Math.min(hpMax, nextCurrent + value)
    } else {
      nextTemp = value > nextTemp ? value : nextTemp
    }
    updateCharacter({ hpCurrent: nextCurrent, hpTemp: nextTemp })
    setActionValue('')
  }

  return (
    <>
      {/* ── Seção A: Stats rápidos ── */}
      <section className={panelStyles.panel}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>CA</span>
            <strong className={styles.statValue}>{ac}</strong>
          </div>
          <div className={`${styles.statCard} ${styles.statCardHp}`}>
            <span className={styles.statLabel}>PV</span>
            <strong className={styles.statValue}>
              {hpCurrent}<span className={styles.statMax}>/{hpMax}</span>
            </strong>
            {hpTemp > 0 && <span className={styles.statSub}>+{hpTemp} temp</span>}
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Iniciativa</span>
            <strong className={styles.statValue}>{fmt(initiative)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Deslocamento</span>
            <strong className={styles.statValue}>{character.speed || '—'}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Proficiência</span>
            <strong className={styles.statValue}>{fmt(profBonus)}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Percep. Passiva</span>
            <strong className={styles.statValue}>{passivePerception}</strong>
          </div>
          {character.spellcastingAbility && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Conjuração</span>
              <strong className={styles.statValue}>
                {character.spellcastingAbility.slice(0, 3).toUpperCase()}
              </strong>
            </div>
          )}
        </div>
        <div className={styles.hpControls}>
          <input
            className={styles.hpInput}
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Valor"
            aria-label="Valor para dano, cura ou PV temporário"
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value.replace(/[^\d]/g, ''))}
          />
          <button type="button" className={styles.btnDamage} onClick={() => applyHpAction('damage')}>Dano</button>
          <button type="button" className={styles.btnHeal} onClick={() => applyHpAction('heal')}>Cura</button>
          <button type="button" className={styles.btnTemp} onClick={() => applyHpAction('temp')}>Temp</button>
        </div>
      </section>

      {/* ── Seção B: Atributos ── */}
      <section className={panelStyles.panel}>
        <span className={styles.sectionTitle}>Atributos</span>
        <div className={styles.abilityGrid}>
          {ABILITIES.map((ability) => {
            const attr = character.attributes.find((a) => a.name === ability.key)
            const score = attr?.value ?? 10
            const mod = calcModifier(score)
            return (
              <article className={styles.abilityCard} key={ability.key}>
                <span className={styles.abilityShort}>{ability.short}</span>
                <strong className={styles.abilityValue}>{score}</strong>
                <span className={styles.abilityMod}>{fmt(mod)}</span>
              </article>
            )
          })}
        </div>
      </section>

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
