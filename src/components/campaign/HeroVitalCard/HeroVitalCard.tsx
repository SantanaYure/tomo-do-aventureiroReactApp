import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Shield, Sparkles, Plus, X, ExternalLink, Trash2 } from 'lucide-react'
import type { CampaignMember, CharacterVitals } from '../../../types/campaign/campaign'
import { ConditionsModal } from '../ConditionsModal/ConditionsModal'
import { HpAdjustModal } from '../HpAdjustModal/HpAdjustModal'
import styles from './HeroVitalCard.module.css'

interface HeroVitalCardProps {
  member: CampaignMember
  campaignId?: string
  isDm: boolean
  canManageHeroes?: boolean
  currentUserId?: string | null
  onUpdateVitals: (userId: string, newVitals: CharacterVitals) => void
  onSelectCharacter?: () => void
  onRemoveHero?: (userId: string, sheetId?: string | null) => void
  /** É a vez deste participante no combate. */
  isActiveTurn?: boolean
  /** Rodadas restantes das condições com duração. */
  conditionRounds?: Record<string, number>
  /** Só para o mestre durante o combate. */
  onSetConditionRounds?: (condition: string, rounds: number | null) => void
}

export function HeroVitalCard({
  member,
  campaignId,
  isDm,
  canManageHeroes = false,
  currentUserId,
  onUpdateVitals,
  onSelectCharacter,
  onRemoveHero,
  isActiveTurn = false,
  conditionRounds,
  onSetConditionRounds,
}: HeroVitalCardProps) {
  const [isHpModalOpen, setIsHpModalOpen] = useState(false)
  const [hpModalMode, setHpModalMode] = useState<'damage' | 'heal' | 'temp'>('damage')
  const [isCondModalOpen, setIsCondModalOpen] = useState(false)

  const isOwner = member.userId === currentUserId
  const canEdit = isDm || isOwner
  const canRemove = (isDm || canManageHeroes || isOwner) && Boolean(member.characterSheetId)

  const vitals: CharacterVitals = member.vitals || {
    hpCurrent: 10,
    hpMax: 10,
    hpTemp: 0,
    armorClass: 10,
    passivePerception: 10,
    heroicInspiration: false,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
  }

  const hpPercent = vitals.hpMax > 0
    ? Math.max(0, Math.min(100, Math.round((vitals.hpCurrent / vitals.hpMax) * 100)))
    : 0

  const isHpLow = hpPercent <= 25

  function handleOpenHp(mode: 'damage' | 'heal' | 'temp') {
    if (!canEdit) return
    setHpModalMode(mode)
    setIsHpModalOpen(true)
  }

  function handleApplyHp(newCurrent: number, newTemp: number) {
    onUpdateVitals(member.userId, {
      ...vitals,
      hpCurrent: newCurrent,
      hpTemp: newTemp,
    })
  }

  function handleToggleInspiration() {
    if (!canEdit) return
    onUpdateVitals(member.userId, {
      ...vitals,
      heroicInspiration: !vitals.heroicInspiration,
    })
  }

  function handleToggleCondition(cond: string) {
    const currentList = vitals.conditions || []
    const updated = currentList.includes(cond)
      ? currentList.filter((c) => c !== cond)
      : [...currentList, cond]

    onUpdateVitals(member.userId, {
      ...vitals,
      conditions: updated,
    })
  }

  function handleRemoveCondition(cond: string) {
    if (!canEdit) return
    const currentList = vitals.conditions || []
    onUpdateVitals(member.userId, {
      ...vitals,
      conditions: currentList.filter((c) => c !== cond),
    })
  }

  function handleToggleDeathSave(type: 'successes' | 'failures', index: number) {
    if (!canEdit) return
    const current = vitals.deathSaves?.[type] ?? 0
    const nextVal = current === index + 1 ? index : index + 1
    onUpdateVitals(member.userId, {
      ...vitals,
      deathSaves: {
        successes: type === 'successes' ? nextVal : (vitals.deathSaves?.successes ?? 0),
        failures: type === 'failures' ? nextVal : (vitals.deathSaves?.failures ?? 0),
      },
    })
  }

  const heroName = member.characterName || (member.role === 'dm' ? 'Mestre da Mesa' : 'Aventureiro Sem Ficha')
  const heroClass = member.characterClass || (member.role === 'dm' ? 'Narrador' : 'Sem classe vinculada')

  const sheetUrl = member.characterSheetId
    ? `/ficha/${member.characterSheetId}?owner=${member.userId}&campaign=${campaignId || ''}`
    : null

  function handleConfirmRemove() {
    if (window.confirm(`Deseja desvincular o herói "${heroName}" da mesa?`)) {
      onRemoveHero?.(member.userId, member.characterSheetId)
    }
  }

  return (
    <article
      className={`${styles.card} ${isActiveTurn ? styles.cardActive : ''}`}
      aria-label={`Status de ${heroName}`}
      aria-current={isActiveTurn ? 'true' : undefined}
    >
      {isActiveTurn && <span className={styles.turnTag}>Vez de agir</span>}
      <div className={styles.header}>
        {sheetUrl ? (
          <Link to={sheetUrl} title="Abrir ficha do personagem">
            {member.characterAvatarUrl ? (
              <img
                src={member.characterAvatarUrl}
                alt={heroName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {heroName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        ) : member.characterAvatarUrl ? (
          <img
            src={member.characterAvatarUrl}
            alt={heroName}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {heroName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className={styles.titleArea}>
          <h3 className={styles.heroName}>
            {sheetUrl ? (
              <Link to={sheetUrl} className={styles.heroLink} title="Abrir ficha">
                {heroName}
                <ExternalLink size={12} strokeWidth={2} />
              </Link>
            ) : (
              heroName
            )}
          </h3>
          <p className={styles.playerName}>{member.displayName}</p>
          <p className={styles.heroClass}>{heroClass}</p>
        </div>

        <div className={styles.headerActions}>
          {canRemove && onRemoveHero && (
            <button
              type="button"
              className={styles.removeHeroBtn}
              onClick={handleConfirmRemove}
              title="Desvincular herói da mesa"
              aria-label={`Desvincular ${heroName}`}
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              className={`${styles.inspirationBtn} ${vitals.heroicInspiration ? styles.inspirationActive : ''}`}
              onClick={handleToggleInspiration}
              title={vitals.heroicInspiration ? 'Inspiração Heróica ativa' : 'Conceder Inspiração Heróica'}
              aria-pressed={vitals.heroicInspiration}
            >
              <Sparkles size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBadge}>
          <Shield size={14} strokeWidth={1.75} />
          <span>CA</span>
          <span className={styles.statVal}>{vitals.armorClass}</span>
        </div>
        <div className={styles.statBadge}>
          <Eye size={14} strokeWidth={1.75} />
          <abbr title="Percepção passiva">Perc.</abbr>
          <span className={styles.statVal}>{vitals.passivePerception}</span>
        </div>
      </div>

      <div className={styles.hpSection}>
        <div className={styles.hpHeader}>
          <span>Pontos de Vida</span>
          <span className={styles.hpNumbers}>
            {vitals.hpCurrent} / {vitals.hpMax}
            {vitals.hpTemp > 0 && (
              <span className={styles.tempHpTag}> (+{vitals.hpTemp})</span>
            )}
          </span>
        </div>

        <div className={styles.track}>
          <div
            className={`${styles.fill} ${isHpLow ? styles.fillLow : ''}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {vitals.hpCurrent === 0 && (
        <div className={styles.deathSaves}>
          <span>Mortes</span>
          <div className={styles.pips}>
            {[0, 1, 2].map((idx) => (
              <button
                key={`succ-${idx}`}
                type="button"
                className={`${styles.pip} ${(vitals.deathSaves?.successes ?? 0) > idx ? styles.pipSuccessActive : ''}`}
                onClick={() => handleToggleDeathSave('successes', idx)}
                title="Sucesso no teste de morte"
                aria-label={`Sucesso ${idx + 1}`}
              />
            ))}
          </div>
          <span>Falhas</span>
          <div className={styles.pips}>
            {[0, 1, 2].map((idx) => (
              <button
                key={`fail-${idx}`}
                type="button"
                className={`${styles.pip} ${(vitals.deathSaves?.failures ?? 0) > idx ? styles.pipFailActive : ''}`}
                onClick={() => handleToggleDeathSave('failures', idx)}
                title="Falha no teste de morte"
                aria-label={`Falha ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.conditionsArea}>
        {(vitals.conditions || []).map((cond) => (
          <span key={cond} className={styles.conditionChip}>
            {cond}
            {conditionRounds?.[cond] ? (
              <span className={styles.roundsTag} title="Rodadas restantes">
                {conditionRounds[cond]}r
              </span>
            ) : null}
            {canEdit && (
              <button
                type="button"
                className={styles.removeCondBtn}
                onClick={() => handleRemoveCondition(cond)}
                aria-label={`Remover condição ${cond}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            )}
          </span>
        ))}

        {canEdit && (
          <button
            type="button"
            className={styles.addCondBtn}
            onClick={() => setIsCondModalOpen(true)}
          >
            <Plus size={10} strokeWidth={2} /> Condição
          </button>
        )}
      </div>

      {canEdit && (
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionDamage}`}
            onClick={() => handleOpenHp('damage')}
          >
            Dano
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionHeal}`}
            onClick={() => handleOpenHp('heal')}
          >
            Cura
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionTemp}`}
            onClick={() => handleOpenHp('temp')}
          >
            Temp
          </button>
        </div>
      )}

      {isOwner && !member.characterSheetId && onSelectCharacter && (
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onSelectCharacter}
          style={{ marginTop: 'var(--space-1)', width: '100%' }}
        >
          Vincular Ficha de Personagem
        </button>
      )}

      {isHpModalOpen && (
        <HpAdjustModal
          entityName={heroName}
          currentHp={vitals.hpCurrent}
          maxHp={vitals.hpMax}
          tempHp={vitals.hpTemp}
          initialMode={hpModalMode}
          onApply={handleApplyHp}
          onClose={() => setIsHpModalOpen(false)}
        />
      )}

      {isCondModalOpen && (
        <ConditionsModal
          entityName={heroName}
          activeConditions={vitals.conditions || []}
          onToggleCondition={handleToggleCondition}
          onClose={() => setIsCondModalOpen(false)}
          rounds={conditionRounds}
          onSetRounds={onSetConditionRounds}
        />
      )}
    </article>
  )
}
