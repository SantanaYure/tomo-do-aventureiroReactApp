import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Dices, Flag, RotateCcw, Skull, Undo2, User, X } from 'lucide-react'
import type {
  CampaignCombat,
  CampaignCreature,
  CampaignMember,
} from '../../../types/campaign/campaign'
import {
  buildCombatants,
  sortByInitiative,
  type Combatant,
} from '../../../utils/initiative'
import styles from './InitiativeTracker.module.css'

interface InitiativeTrackerProps {
  members: CampaignMember[]
  creatures: CampaignCreature[]
  combat: CampaignCombat | null | undefined
  isDm: boolean
  currentUserId?: string | null
  busy?: boolean
  /** Mestre: rola para todas as criaturas e heróis que ainda não rolaram. */
  onRollMissing: () => void
  /** Mestre: rola de novo para todos. */
  onRerollAll: () => void
  /** Jogador (ou mestre) rola para um herói específico. */
  onRollHero: (userId: string) => void
  onRollCreature: (creatureId: string) => void
  onSetInitiative: (combatant: Combatant, value: number | null) => void
  onNextTurn: (order: Combatant[]) => void
  onEndCombat: () => void
  /** Mestre: tira (true) ou devolve (false) alguém da ordem, sem tirar da cena. */
  onToggleOutOfCombat: (combatant: Combatant, outOfCombat: boolean, order: Combatant[]) => void
}

function formatBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`
}

/**
 * Campo de valor com rascunho local: grava ao sair do campo ou com Enter,
 * em vez de uma escrita no Firestore por tecla.
 */
function InitiativeInput({
  combatant,
  disabled,
  onCommit,
}: {
  combatant: Combatant
  disabled: boolean
  onCommit: (value: number | null) => void
}) {
  const [draft, setDraft] = useState(combatant.initiative === null ? '' : String(combatant.initiative))

  useEffect(() => {
    setDraft(combatant.initiative === null ? '' : String(combatant.initiative))
  }, [combatant.initiative])

  function commit() {
    const trimmed = draft.trim()
    const next = trimmed === '' ? null : Math.trunc(Number(trimmed))
    if (next !== null && !Number.isFinite(next)) {
      setDraft(combatant.initiative === null ? '' : String(combatant.initiative))
      return
    }
    if (next !== combatant.initiative) onCommit(next)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      className={styles.valueInput}
      value={draft}
      placeholder="—"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      aria-label={`Iniciativa de ${combatant.name}`}
      disabled={disabled}
    />
  )
}

export function InitiativeTracker({
  members,
  creatures,
  combat,
  isDm,
  currentUserId,
  busy = false,
  onRollMissing,
  onRerollAll,
  onRollHero,
  onRollCreature,
  onSetInitiative,
  onNextTurn,
  onEndCombat,
  onToggleOutOfCombat,
}: InitiativeTrackerProps) {
  const allCombatants = useMemo(
    () => sortByInitiative(buildCombatants(members, creatures)),
    [members, creatures],
  )
  const order = allCombatants.filter((c) => !c.outOfCombat)
  const benched = allCombatants.filter((c) => c.outOfCombat)
  const rolledCount = order.filter((c) => c.initiative !== null).length
  const hasCombat = Boolean(combat) || rolledCount > 0

  function canEdit(combatant: Combatant): boolean {
    if (isDm) return true
    return combatant.kind === 'hero' && combatant.refId === currentUserId
  }

  function handleRoll(combatant: Combatant) {
    if (combatant.kind === 'hero') onRollHero(combatant.refId)
    else onRollCreature(combatant.refId)
  }

  return (
    <section className={styles.panel} aria-labelledby="initiative-title">
      <div className={styles.header}>
        <div>
          <h2 id="initiative-title" className={styles.title}>
            <Dices size={18} strokeWidth={1.75} aria-hidden="true" />
            Iniciativa
          </h2>
          <p className={styles.subtitle}>
            {combat
              ? `Rodada ${combat.round}`
              : rolledCount > 0
                ? `${rolledCount} de ${order.length} rolaram`
                : 'Nenhum combate em andamento'}
          </p>
        </div>

        {isDm && (
          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={onRollMissing} disabled={busy || order.length === 0}>
              <Dices size={14} strokeWidth={1.75} aria-hidden="true" />
              Rolar iniciativa
            </button>
            {hasCombat && (
              <>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => onNextTurn(order)}
                  disabled={busy || rolledCount === 0}
                >
                  <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
                  {combat?.activeId ? 'Próximo turno' : 'Iniciar combate'}
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={onRerollAll} disabled={busy}>
                  <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                  Rolar de novo
                </button>
                <button type="button" className={styles.dangerBtn} onClick={onEndCombat} disabled={busy}>
                  <Flag size={14} strokeWidth={1.75} aria-hidden="true" />
                  Encerrar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {order.length === 0 ? (
        <p className={styles.empty}>
          {allCombatants.length === 0
            ? 'Adicione heróis ou criaturas para montar a ordem de turnos.'
            : 'Todos estão fora do combate.'}
        </p>
      ) : (
        <ol className={styles.list}>
          {order.map((combatant) => {
            const isActive = combat?.activeId === combatant.id
            const editable = canEdit(combatant)
            return (
              <li
                key={combatant.id}
                className={`${styles.row} ${isActive ? styles.rowActive : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className={styles.kindIcon} aria-hidden="true">
                  {combatant.kind === 'hero' ? (
                    <User size={14} strokeWidth={1.75} />
                  ) : (
                    <Skull size={14} strokeWidth={1.75} />
                  )}
                </span>
                <span className={styles.name}>
                  {combatant.name}
                  <span className={styles.bonus}>{formatBonus(combatant.initiativeBonus)}</span>
                </span>

                {editable ? (
                  <InitiativeInput
                    combatant={combatant}
                    disabled={busy}
                    onCommit={(value) => onSetInitiative(combatant, value)}
                  />
                ) : (
                  <span className={styles.value}>{combatant.initiative ?? '—'}</span>
                )}

                <div className={styles.rowActions}>
                  {editable && (
                    <button
                      type="button"
                      className={styles.rollBtn}
                      onClick={() => handleRoll(combatant)}
                      disabled={busy}
                      aria-label={`Rolar iniciativa de ${combatant.name}`}
                      title="Rolar d20 + bônus"
                    >
                      <Dices size={14} strokeWidth={1.75} />
                    </button>
                  )}
                  {isDm && (
                    <button
                      type="button"
                      className={styles.rollBtn}
                      onClick={() => onToggleOutOfCombat(combatant, true, order)}
                      disabled={busy}
                      aria-label={`Tirar ${combatant.name} da iniciativa`}
                      title="Tirar da iniciativa (continua em cena)"
                    >
                      <X size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {benched.length > 0 && (
        <div className={styles.benched}>
          <p className={styles.benchedTitle}>Fora do combate ({benched.length})</p>
          <ul className={styles.benchedList}>
            {benched.map((combatant) => (
              <li key={combatant.id} className={styles.benchedItem}>
                <span className={styles.kindIcon} aria-hidden="true">
                  {combatant.kind === 'hero' ? (
                    <User size={12} strokeWidth={1.75} />
                  ) : (
                    <Skull size={12} strokeWidth={1.75} />
                  )}
                </span>
                <span>{combatant.name}</span>
                {isDm && (
                  <button
                    type="button"
                    className={styles.returnBtn}
                    onClick={() => onToggleOutOfCombat(combatant, false, order)}
                    disabled={busy}
                    aria-label={`Devolver ${combatant.name} à iniciativa`}
                  >
                    <Undo2 size={12} strokeWidth={1.75} aria-hidden="true" />
                    Voltar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
