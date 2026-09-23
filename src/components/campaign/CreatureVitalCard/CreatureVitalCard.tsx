import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CopyPlus, Dices, Eye, Pencil, Shield, Skull, Trash2, Plus, X, ExternalLink } from 'lucide-react'
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
  /** Avatar lido da ficha (criaturas da mesa não guardam imagem base64). */
  avatarUrl?: string | null
  /** É a vez deste participante no combate. */
  isActiveTurn?: boolean
  /** Rodadas restantes das condições com duração. */
  conditionRounds?: Record<string, number>
  /** Só para o mestre durante o combate. */
  onSetConditionRounds?: (condition: string, rounds: number | null) => void
}

export function CreatureVitalCard({
  creature,
  campaignId,
  isDm,
  onUpdate,
  onRemove,
  onDuplicate,
  avatarUrl,
  isActiveTurn = false,
  conditionRounds,
  onSetConditionRounds,
}: CreatureVitalCardProps) {
  const avatar = avatarUrl || creature.avatar
  const [isHpModalOpen, setIsHpModalOpen] = useState(false)
  const [hpModalMode, setHpModalMode] = useState<'damage' | 'heal' | 'temp'>('damage')
  const [isCondModalOpen, setIsCondModalOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(creature.name)

  function startRename() {
    setNameDraft(creature.name)
    setIsRenaming(true)
  }

  function commitRename() {
    const next = nameDraft.trim()
    setIsRenaming(false)
    if (next && next !== creature.name) onUpdate(creature.id, { name: next.slice(0, 80) })
  }

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
    <article
      className={`${styles.card} ${isActiveTurn ? styles.cardActive : ''}`}
      aria-label={`Status de ${creature.name}`}
      aria-current={isActiveTurn ? 'true' : undefined}
    >
      {isActiveTurn && <span className={styles.turnTag}>Vez de agir</span>}
      <div className={styles.header}>
        {sheetUrl ? (
          <Link to={sheetUrl} title="Abrir ficha da criatura">
            {avatar ? (
              <img src={avatar} alt={creature.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder} aria-hidden="true">
                <Skull size={20} strokeWidth={1.5} />
              </div>
            )}
          </Link>
        ) : avatar ? (
          <img src={avatar} alt={creature.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder} aria-hidden="true">
            <Skull size={20} strokeWidth={1.5} />
          </div>
        )}

        <div className={styles.titleArea}>
          {isRenaming ? (
            <input
              className={styles.renameInput}
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
                if (event.key === 'Escape') {
                  setNameDraft(creature.name)
                  setIsRenaming(false)
                }
              }}
              maxLength={80}
              aria-label={`Novo nome para ${creature.name}`}
              autoFocus
            />
          ) : (
            <div className={styles.nameRow}>
              <h3 className={styles.name} title={creature.name}>
                {sheetUrl ? (
                  <Link to={sheetUrl} className={styles.link} title="Abrir ficha de monstro">
                    {creature.name}
                    <ExternalLink size={12} strokeWidth={2} />
                  </Link>
                ) : (
                  creature.name
                )}
              </h3>
              {isDm && (
                <button
                  type="button"
                  className={styles.renameBtn}
                  onClick={startRename}
                  aria-label={`Renomear ${creature.name}`}
                  title="Renomear em cena"
                >
                  <Pencil size={11} strokeWidth={1.75} />
                </button>
              )}
            </div>
          )}
          <p className={styles.subtitle}>
            {creature.monsterSheetId ? 'Com ficha vinculada' : 'Criatura avulsa'}
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
          <abbr title="Percepção passiva">Perc.</abbr>
          <span className={styles.statVal}>{creature.passivePerception ?? 10}</span>
        </div>
        {typeof creature.initiative === 'number' && (
          <div className={styles.statBadge}>
            <Dices size={14} strokeWidth={1.75} />
            <abbr title="Iniciativa">Inic.</abbr>
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
            {conditionRounds?.[cond] ? (
              <span className={styles.roundsTag} title="Rodadas restantes">
                {conditionRounds[cond]}r
              </span>
            ) : null}
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
          rounds={conditionRounds}
          onSetRounds={onSetConditionRounds}
        />
      )}
    </article>
  )
}
