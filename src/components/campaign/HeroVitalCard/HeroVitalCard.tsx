import { useState } from 'react'
import { Eye, Shield, Sparkles, Plus, X } from 'lucide-react'
import type { CampaignMember, CharacterVitals } from '../../../types/campaign/campaign'
import { ConditionsModal } from '../ConditionsModal/ConditionsModal'
import { HpAdjustModal } from '../HpAdjustModal/HpAdjustModal'
import styles from './HeroVitalCard.module.css'

interface HeroVitalCardProps {
  member: CampaignMember
  isDm: boolean
  currentUserId?: string | null
  onUpdateVitals: (userId: string, newVitals: CharacterVitals) => void
  onSelectCharacter?: () => void
}

export function HeroVitalCard({
  member,
  isDm,
  currentUserId,
  onUpdateVitals,
  onSelectCharacter,
}: HeroVitalCardProps) {
  const [isHpModalOpen, setIsHpModalOpen] = useState(false)
  const [hpModalMode, setHpModalMode] = useState<'damage' | 'heal' | 'temp'>('damage')
  const [isCondModalOpen, setIsCondModalOpen] = useState(false)

  const isOwner = member.userId === currentUserId
  const canEdit = isDm || isOwner

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

  return (
    <article className={styles.card} aria-label={`Status de ${heroName}`}>
      <div className={styles.header}>
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

        <div className={styles.titleArea}>
          <h3 className={styles.heroName}>{heroName}</h3>
          <p className={styles.playerName}>{member.displayName}</p>
          <p className={styles.heroClass}>{heroClass}</p>
        </div>

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

      <div className={styles.statsRow}>
        <div className={styles.statBadge}>
          <Shield size={14} strokeWidth={1.75} />
          <span>CA</span>
          <span className={styles.statVal}>{vitals.armorClass}</span>
        </div>
        <div className={styles.statBadge}>
          <Eye size={14} strokeWidth={1.75} />
          <span>Percepção</span>
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
        />
      )}
    </article>
  )
}
