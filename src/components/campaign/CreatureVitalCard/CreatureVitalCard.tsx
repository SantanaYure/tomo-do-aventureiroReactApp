import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyPlus, Dices, Eye, Shield, Skull, Trash2, Plus, X, ExternalLink } from 'lucide-react'
import type { CampaignCreature } from '../../../types/campaign/campaign'
import { ConditionsModal } from '../ConditionsModal/ConditionsModal'
import { HpAdjustModal } from '../HpAdjustModal/HpAdjustModal'
import styles from './CreatureVitalCard.module.css'

interface CreatureVitalCardProps {
  creature: CampaignCreature
  campaignId?: string
  isDm: boolean
  onUpdate: (creatureId: string, updates: Partial<CampaignCreature>) => void
  onRemove: (creatureId: string) => void
  /** Replica a criatura em cena (mestre). */
  onDuplicate?: (creatureId: string) => void
}

export function CreatureVitalCard({
  creature,
  campaignId,
  isDm,
  onUpdate,
  onRemove,
  onDuplicate,
}: CreatureVitalCardProps) {
  const [isHpModalOpen, setIsHpModalOpen] = useState(false)
  const [hpModalMode, setHpModalMode] = useState<'damage' | 'heal' | 'temp'>('damage')
  const [isCondModalOpen, setIsCondModalOpen] = useState(false)

  const hpPercent = creature.hpMax > 0
    ? Math.max(0, Math.min(100, Math.round((creature.hpCurrent / creature.hpMax) * 100)))
    : 0

  const isHpLow = hpPercent <= 25

  function handleOpenHp(mode: 'damage' | 'heal' | 'temp') {
    if (!isDm) return
    setHpModalMode(mode)
    setIsHpModalOpen(true)
  }

  function handleApplyHp(newCurrent: number, newTemp: number) {
    onUpdate(creature.id, {
      hpCurrent: newCurrent,
      hpTemp: newTemp,
    })
  }

  function handleToggleCondition(cond: string) {
    const currentList = creature.conditions || []
    const updated = currentList.includes(cond)
      ? currentList.filter((c) => c !== cond)
      : [...currentList, cond]

    onUpdate(creature.id, { conditions: updated })
  }

  function handleRemoveCondition(cond: string) {
    if (!isDm) return
    const currentList = creature.conditions || []
    onUpdate(creature.id, {
      conditions: currentList.filter((c) => c !== cond),
    })
  }

  function handleConfirmRemove() {
    if (window.confirm(`Remover ${creature.name} do encontro?`)) {
      onRemove(creature.id)
    }
  }

  const sheetUrl = creature.monsterSheetId
    ? `/monstro/${creature.monsterSheetId}?campaign=${campaignId || ''}${creature.ownerId ? `&owner=${creature.ownerId}` : ''}`
    : null

  return (
    <article className={styles.card} aria-label={`Status de ${creature.name}`}>
      <div className={styles.header}>
        {sheetUrl ? (
          <Link to={sheetUrl} title="Abrir ficha da criatura">
            {creature.avatar ? (
              <img src={creature.avatar} alt={creature.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder} aria-hidden="true">
                <Skull size={20} strokeWidth={1.5} />
              </div>
            )}
          </Link>
        ) : creature.avatar ? (
          <img src={creature.avatar} alt={creature.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder} aria-hidden="true">
            <Skull size={20} strokeWidth={1.5} />
          </div>
        )}

        <div className={styles.titleArea}>
          <h3 className={styles.name}>
            {sheetUrl ? (
              <Link to={sheetUrl} className={styles.link} title="Abrir ficha de monstro">
                {creature.name}
                <ExternalLink size={12} strokeWidth={2} />
              </Link>
            ) : (
              creature.name
            )}
          </h3>
          <p className={styles.subtitle}>
            {creature.monsterSheetId ? 'Monstro / NPC Vinculado' : 'Criatura / Monstro em Cena'}
          </p>
        </div>

        {isDm && onDuplicate && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onDuplicate(creature.id)}
            title="Replicar criatura"
            aria-label={`Replicar ${creature.name}`}
          >
            <CopyPlus size={14} strokeWidth={1.75} />
          </button>
        )}

        {isDm && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleConfirmRemove}
            title="Remover do encontro"
            aria-label={`Remover ${creature.name}`}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBadge}>
          <Shield size={14} strokeWidth={1.75} />
          <span>CA</span>
          <span className={styles.statVal}>{creature.armorClass}</span>
        </div>
        <div className={styles.statBadge}>
          <Eye size={14} strokeWidth={1.75} />
          <span>Percepção</span>
          <span className={styles.statVal}>{creature.passivePerception ?? 10}</span>
        </div>
        {typeof creature.initiative === 'number' && (
          <div className={styles.statBadge}>
            <Dices size={14} strokeWidth={1.75} />
            <span>Iniciativa</span>
            <span className={styles.statVal}>{creature.initiative}</span>
          </div>
        )}
      </div>

      <div className={styles.hpSection}>
        <div className={styles.hpHeader}>
          <span>Pontos de Vida</span>
          <span className={styles.hpNumbers}>
            {creature.hpCurrent} / {creature.hpMax}
            {creature.hpTemp > 0 && (
              <span className={styles.tempHpTag}> (+{creature.hpTemp})</span>
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

      <div className={styles.conditionsArea}>
        {(creature.conditions || []).map((cond) => (
          <span key={cond} className={styles.conditionChip}>
            {cond}
            {isDm && (
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

        {isDm && (
          <button
            type="button"
            className={styles.addCondBtn}
            onClick={() => setIsCondModalOpen(true)}
          >
            <Plus size={10} strokeWidth={2} /> Condição
          </button>
        )}
      </div>

      {isDm && (
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

      {isHpModalOpen && (
        <HpAdjustModal
          entityName={creature.name}
          currentHp={creature.hpCurrent}
          maxHp={creature.hpMax}
          tempHp={creature.hpTemp}
          initialMode={hpModalMode}
          onApply={handleApplyHp}
          onClose={() => setIsHpModalOpen(false)}
        />
      )}

      {isCondModalOpen && (
        <ConditionsModal
          entityName={creature.name}
          activeConditions={creature.conditions || []}
          onToggleCondition={handleToggleCondition}
          onClose={() => setIsCondModalOpen(false)}
        />
      )}
    </article>
  )
}
