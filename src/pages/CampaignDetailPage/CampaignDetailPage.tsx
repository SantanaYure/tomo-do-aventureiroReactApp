import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Skull,
  Swords,
  Trash2,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCampaign } from '../../hooks/useCampaign'
import { creatureAvatarKey, useCreatureAvatars } from '../../hooks/useCreatureAvatars'
import {
  removeMember,
  updateMemberVitals,
  regenerateInviteCode,
  addCreatureToCampaign,
  updateCreatureInCampaign,
  removeCreatureFromCampaign,
  duplicateCreatureInCampaign,
  rollCreaturesInitiative,
  rollMembersInitiative,
  setMemberInitiative,
  updateCampaignCombat,
  endCampaignCombat,
  setCombatantOutOfCombat,
  applyTurnAdvance,
  linkCharacterSheetToCampaign,
  unlinkCharacterSheetFromCampaign,
  linkMonsterSheetToCampaign,
  removeHeroFromCampaign,
  toggleMemberAuthorization,
  setDmParticipatesAsPlayer,
  deleteCampaign,
} from '../../store/campaignStore'
import { MemberCard } from '../../components/campaign/MemberCard/MemberCard'
import { SelectCharacterModal } from '../../components/campaign/SelectCharacterModal/SelectCharacterModal'
import { HeroVitalCard } from '../../components/campaign/HeroVitalCard/HeroVitalCard'
import { CreatureVitalCard } from '../../components/campaign/CreatureVitalCard/CreatureVitalCard'
import { AddCreatureModal } from '../../components/campaign/AddCreatureModal/AddCreatureModal'
import { InitiativeTracker } from '../../components/campaign/InitiativeTracker/InitiativeTracker'
import { CreateCampaignModal } from '../../components/campaign/CreateCampaignModal/CreateCampaignModal'
import { DeleteCampaignModal } from '../../components/campaign/DeleteCampaignModal/DeleteCampaignModal'
import { formatInviteCode } from '../../utils/inviteCode'
import {
  advanceTurn,
  combatantId,
  isHeroInCombat,
  setConditionRounds,
  tickConditionRounds,
  turnAfterRemoval,
  rollInitiative,
  type Combatant,
} from '../../utils/initiative'
import type { CampaignCreature, CharacterVitals } from '../../types/campaign/campaign'
import type { CharacterSheet } from '../../types/system/dnd/CharacterSheet'
import styles from './CampaignDetailPage.module.css'

type TabType = 'session' | 'members'

function describeError(err: unknown, fallback: string): string {
  const code = (err as { code?: string } | null)?.code
  if (code === 'permission-denied') {
    return `${fallback} Permissão negada pelo servidor (confira se as regras do Firestore estão publicadas).`
  }
  if (err instanceof Error && err.message && !err.message.startsWith('FirebaseError')) {
    return `${fallback} ${err.message}`
  }
  return fallback
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { campaign, members, isDm, currentMember, isLoading, error } = useCampaign(
    id,
    user?.uid,
  )

  const [activeTab, setActiveTab] = useState<TabType>('session')
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSelectCharOpen, setIsSelectCharOpen] = useState(false)
  const [isAddCreatureOpen, setIsAddCreatureOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const creatureAvatars = useCreatureAvatars(campaign?.creatures ?? [])
  const [isCombatBusy, setIsCombatBusy] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  /** Executa uma ação da mesa e mostra a falha na tela, em vez de só no console. */
  async function runAction(fallbackMessage: string, action: () => Promise<unknown>): Promise<boolean> {
    try {
      setActionError(null)
      await action()
      return true
    } catch (err) {
      console.error(fallbackMessage, err)
      setActionError(describeError(err, fallbackMessage))
      return false
    }
  }

  async function handleCopyCode() {
    if (!campaign) return
    try {
      await navigator.clipboard.writeText(campaign.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleRegenerateCode() {
    if (!campaign || !isDm) return
    const confirm = window.confirm(
      'Tem certeza de que deseja gerar um novo código? O código anterior deixará de funcionar.',
    )
    if (!confirm) return

    try {
      setIsRegenerating(true)
      await regenerateInviteCode(campaign.id)
    } catch (err) {
      console.error('Erro ao gerar novo código:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!campaign || !isDm) return
    const member = members.find((m) => m.userId === memberId)
    const confirm = window.confirm(
      `Remover ${member?.displayName || 'este jogador'} da mesa?`,
    )
    if (!confirm) return

    await runAction('Não foi possível remover o jogador.', () =>
      removeMember(campaign.id, memberId),
    )
  }

  async function handleLeaveCampaign() {
    if (!campaign || !user) return
    const confirm = window.confirm('Deseja realmente sair desta mesa?')
    if (!confirm) return

    const ok = await runAction('Não foi possível sair da mesa.', () =>
      removeMember(campaign.id, user.uid),
    )
    if (ok) navigate('/mesas')
  }

  async function handleUpdateCharacter(data: {
    characterSheetId: string | null
    characterName: string | null
    characterClass: string | null
    characterAvatarUrl: string | null
    vitals?: CharacterVitals | null
    sheetData?: CharacterSheet | null
  }) {
    if (!campaign || !user) return

    try {
      if (data.characterSheetId && data.sheetData) {
        await linkCharacterSheetToCampaign(
          campaign.id,
          campaign.name,
          user.uid,
          data.characterSheetId,
          data.sheetData,
        )
      } else {
        await unlinkCharacterSheetFromCampaign(
          campaign.id,
          user.uid,
          currentMember?.characterSheetId,
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar vínculo do personagem:', err)
    }
  }

  async function handleRemoveHero(targetUserId: string, sheetId?: string | null) {
    if (!campaign) return
    await runAction('Não foi possível desvincular o herói.', () =>
      removeHeroFromCampaign(campaign.id, targetUserId, sheetId),
    )
  }

  async function handleToggleAuthorization(targetUserId: string, canManage: boolean) {
    if (!campaign || !isDm) return
    try {
      await toggleMemberAuthorization(campaign.id, targetUserId, canManage)
    } catch (err) {
      console.error('Erro ao alternar autorização:', err)
    }
  }

  /** Erros sobem para o DeleteCampaignModal, que os mostra sem fechar. */
  async function handleDeleteCampaign() {
    if (!campaign || !isDm) return
    await deleteCampaign(campaign.id)
    navigate('/mesas', { replace: true })
  }

  async function handleToggleDmParticipation(participates: boolean) {
    if (!campaign || !isDm || !user) return
    await runAction('Não foi possível atualizar a participação do mestre.', () =>
      setDmParticipatesAsPlayer(campaign.id, user.uid, participates),
    )
  }

  async function handleUpdateVitals(userId: string, newVitals: CharacterVitals) {
    if (!campaign) return
    await runAction('Não foi possível atualizar os vitais.', () =>
      updateMemberVitals(campaign.id, userId, newVitals),
    )
  }

  /** Erros sobem para o AddCreatureModal, que os mostra sem fechar. */
  async function handleAddCreature(
    creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>,
    quantity: number,
  ) {
    if (!campaign || !user) return
    if (creatureData.monsterSheetId) {
      const { getMonsterSheet } = await import('../../store/monsterSheetStore')
      const monster = await getMonsterSheet(user.uid, creatureData.monsterSheetId)
      if (!monster) throw new Error('A ficha de monstro/NPC não foi encontrada.')
      await linkMonsterSheetToCampaign(
        campaign.id,
        campaign.name,
        user.uid,
        creatureData.monsterSheetId,
        monster.data,
        { instanceName: creatureData.name, quantity },
      )
    } else {
      await addCreatureToCampaign(campaign.id, creatureData, quantity)
    }
  }

  async function handleUpdateCreature(creatureId: string, updates: Partial<CampaignCreature>) {
    if (!campaign) return
    await runAction('Não foi possível atualizar a criatura.', () =>
      updateCreatureInCampaign(campaign.id, creatureId, updates),
    )
  }

  async function handleRemoveCreature(creatureId: string) {
    if (!campaign) return
    await runAction('Não foi possível remover a criatura.', () =>
      removeCreatureFromCampaign(campaign.id, creatureId),
    )
  }

  async function handleDuplicateCreature(creatureId: string) {
    if (!campaign) return
    await runAction('Não foi possível replicar a criatura.', () =>
      duplicateCreatureInCampaign(campaign.id, creatureId, 1),
    )
  }

  // ── Iniciativa ──

  async function runCombatAction(fallbackMessage: string, action: () => Promise<unknown>) {
    setIsCombatBusy(true)
    try {
      await runAction(fallbackMessage, action)
    } finally {
      setIsCombatBusy(false)
    }
  }

  function heroesInCombat() {
    return members.filter(isHeroInCombat)
  }

  async function handleRollMissingInitiative() {
    if (!campaign || !isDm) return
    await runCombatAction('Não foi possível rolar a iniciativa.', async () => {
      await rollCreaturesInitiative(campaign.id, { onlyMissing: true })
      await rollMembersInitiative(campaign.id, heroesInCombat(), { onlyMissing: true })
    })
  }

  async function handleRerollAllInitiative() {
    if (!campaign || !isDm) return
    if (!window.confirm('Rolar a iniciativa de novo para todos? A ordem atual será substituída.')) return
    await runCombatAction('Não foi possível rolar a iniciativa.', async () => {
      await rollCreaturesInitiative(campaign.id)
      await rollMembersInitiative(campaign.id, heroesInCombat())
      await updateCampaignCombat(campaign.id, null)
    })
  }

  async function handleRollHeroInitiative(userId: string) {
    if (!campaign) return
    const member = members.find((m) => m.userId === userId)
    if (!member) return
    await runCombatAction('Não foi possível rolar a iniciativa.', () =>
      setMemberInitiative(campaign.id, userId, rollInitiative(member.vitals?.initiativeBonus ?? 0)),
    )
  }

  async function handleRollCreatureInitiative(creatureId: string) {
    if (!campaign || !isDm) return
    const creature = (campaign.creatures || []).find((c) => c.id === creatureId)
    if (!creature) return
    await runCombatAction('Não foi possível rolar a iniciativa.', () =>
      updateCreatureInCampaign(campaign.id, creatureId, {
        initiative: rollInitiative(creature.initiativeBonus ?? 0),
      }),
    )
  }

  async function handleSetInitiative(combatant: Combatant, value: number | null) {
    if (!campaign) return
    await runCombatAction('Não foi possível gravar a iniciativa.', () =>
      combatant.kind === 'hero'
        ? setMemberInitiative(campaign.id, combatant.refId, value)
        : updateCreatureInCampaign(campaign.id, combatant.refId, { initiative: value }),
    )
  }

  async function handleNextTurn(order: Combatant[]) {
    if (!campaign || !isDm) return
    const previousRound = campaign.combat?.round ?? 1
    let next = advanceTurn(order, campaign.combat)
    let expired: ReturnType<typeof tickConditionRounds>['expired'] = []
    // Virada de rodada: desconta as durações e tira o que expirou.
    if (campaign.combat && next.round > previousRound) {
      const ticked = tickConditionRounds(next.conditionRounds)
      next = { ...next, conditionRounds: ticked.next }
      expired = ticked.expired
    }
    await runCombatAction('Não foi possível avançar o turno.', () =>
      applyTurnAdvance(campaign.id, next, expired, members),
    )
  }

  async function handleSetConditionRounds(
    target: string,
    condition: string,
    rounds: number | null,
  ) {
    if (!campaign || !isDm || !campaign.combat) return
    const combat = campaign.combat
    await runCombatAction('Não foi possível gravar a duração da condição.', () =>
      updateCampaignCombat(campaign.id, {
        ...combat,
        conditionRounds: setConditionRounds(combat.conditionRounds, target, condition, rounds),
      }),
    )
  }

  async function handleToggleOutOfCombat(
    combatant: Combatant,
    outOfCombat: boolean,
    order: Combatant[],
  ) {
    if (!campaign || !isDm) return
    // Se quem sai estava com a vez, ela passa para o próximo.
    const nextCombat = outOfCombat
      ? turnAfterRemoval(order, campaign.combat, combatant.id)
      : undefined
    const combatChanged = outOfCombat && nextCombat !== campaign.combat
    await runCombatAction(
      outOfCombat
        ? 'Não foi possível tirar da iniciativa.'
        : 'Não foi possível devolver à iniciativa.',
      () =>
        setCombatantOutOfCombat(
          campaign.id,
          { kind: combatant.kind, refId: combatant.refId },
          outOfCombat,
          combatChanged ? nextCombat ?? null : undefined,
        ),
    )
  }

  async function handleEndCombat() {
    if (!campaign || !isDm) return
    if (!window.confirm('Encerrar o combate e limpar a iniciativa de todos?')) return
    const withInitiative = members
      .filter((m) => typeof m.initiative === 'number' || m.outOfCombat)
      .map((m) => m.userId)
    await runCombatAction('Não foi possível encerrar o combate.', () =>
      endCampaignCombat(campaign.id, withInitiative),
    )
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div
          style={{
            height: '12rem',
            background: 'var(--item-bg)',
            borderRadius: 'var(--radius-xl)',
          }}
        />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className={styles.page}>
        <Link to="/mesas" className={styles.backLink}>
          <ArrowLeft size={16} /> Voltar para Mesas
        </Link>
        <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <h2>Mesa não encontrada</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            A mesa pode ter sido arquivada ou você não possui permissão de acesso.
          </p>
        </div>
      </div>
    )
  }

  const creatures = campaign.creatures || []
  // O mestre só aparece como herói se marcou que também joga com um PJ.
  const heroes = members.filter(isHeroInCombat)

  return (
    <div className={styles.page}>
      <Link to="/mesas" className={styles.backLink}>
        <ArrowLeft size={16} strokeWidth={2} /> Voltar para Mesas
      </Link>

      <div className={styles.banner}>
        <div className={styles.bannerMain}>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles.badgeDm}`}>
              <Crown size={12} strokeWidth={1.75} /> Mestre: {campaign.dmName}
            </span>
            <span className={`${styles.badge} ${styles.badgeSystem}`}>
              D&D 5e (2024)
            </span>
          </div>

          <h1 className={styles.title}>{campaign.name}</h1>

          {isDm && (
            <div className={styles.manageRow}>
              <button type="button" className={styles.copyBtn} onClick={() => setIsEditOpen(true)}>
                <Pencil size={12} strokeWidth={1.75} aria-hidden="true" /> Editar mesa
              </button>
              <button
                type="button"
                className={`${styles.copyBtn} ${styles.deleteCampaignBtn}`}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 size={12} strokeWidth={1.75} aria-hidden="true" /> Excluir mesa
              </button>
            </div>
          )}

          {campaign.description && (
            <p className={styles.description}>{campaign.description}</p>
          )}
        </div>

        <div className={styles.inviteBox}>
          <p className={styles.inviteLabel}>Código de Convite</p>
          <div className={styles.codeRow}>
            <span className={styles.codeDisplay}>
              {formatInviteCode(campaign.inviteCode)}
            </span>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyCode}
              aria-label="Copiar código de convite"
            >
              {copied ? (
                <>
                  <Check size={14} color="var(--heal-solid)" /> Copiado!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copiar
                </>
              )}
            </button>
          </div>

          {isDm && (
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              style={{ marginTop: 'var(--space-2)' }}
            >
              <RefreshCw size={12} /> Gerar Novo Código
            </button>
          )}
        </div>
      </div>

      <nav className={styles.navTabs} aria-label="Navegação da campanha">
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'session' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('session')}
          aria-selected={activeTab === 'session'}
          role="tab"
        >
          <Swords size={15} strokeWidth={1.75} aria-hidden="true" />
          Painel da Sessão
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'members' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('members')}
          aria-selected={activeTab === 'members'}
          role="tab"
        >
          <Users size={15} strokeWidth={1.75} aria-hidden="true" />
          Integrantes & Convite ({members.length})
        </button>
      </nav>

      {actionError && (
        <div className={styles.errorBanner} role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            className={styles.errorDismiss}
            onClick={() => setActionError(null)}
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === 'session' ? (
        <div className={styles.sessionDashboard}>
          <InitiativeTracker
            members={members}
            creatures={creatures}
            combat={campaign.combat}
            isDm={isDm}
            currentUserId={user?.uid}
            busy={isCombatBusy}
            onRollMissing={handleRollMissingInitiative}
            onRerollAll={handleRerollAllInitiative}
            onRollHero={handleRollHeroInitiative}
            onRollCreature={handleRollCreatureInitiative}
            onSetInitiative={handleSetInitiative}
            onNextTurn={handleNextTurn}
            onEndCombat={handleEndCombat}
            onToggleOutOfCombat={handleToggleOutOfCombat}
          />

          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Heróis na Sessão ({heroes.length})
              </h2>
            </div>

            {heroes.length === 0 && (
              <div className={styles.emptyCreatures} style={{ marginTop: 'var(--space-3)' }}>
                <p>Nenhum jogador na mesa ainda.</p>
                {isDm && (
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Compartilhe o código de convite. Se você também joga com um PJ, marque isso na aba Integrantes.
                  </p>
                )}
              </div>
            )}

            <div className={styles.vitalsGrid} style={{ marginTop: 'var(--space-3)' }}>
              {heroes.map((member) => (
                <HeroVitalCard
                  key={member.userId}
                  member={member}
                  campaignId={campaign.id}
                  isDm={isDm}
                  canManageHeroes={Boolean(currentMember?.canManageHeroes)}
                  currentUserId={user?.uid}
                  onUpdateVitals={handleUpdateVitals}
                  onSelectCharacter={() => setIsSelectCharOpen(true)}
                  onRemoveHero={handleRemoveHero}
                  isActiveTurn={campaign.combat?.activeId === combatantId('hero', member.userId)}
                  conditionRounds={campaign.combat?.conditionRounds?.[combatantId('hero', member.userId)]}
                  onSetConditionRounds={
                    isDm && campaign.combat
                      ? (condition, rounds) =>
                          handleSetConditionRounds(combatantId('hero', member.userId), condition, rounds)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className={styles.creaturesSection}>
            <div className={styles.creaturesHeader}>
              <h2 className={styles.creaturesTitle}>
                <Skull size={18} strokeWidth={1.75} aria-hidden="true" />
                Criaturas & Monstros em Cena ({creatures.length})
              </h2>

              {isDm && (
                <button
                  type="button"
                  className={styles.addCreatureBtn}
                  onClick={() => setIsAddCreatureOpen(true)}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                  Adicionar Criatura
                </button>
              )}
            </div>

            {creatures.length === 0 ? (
              <div className={styles.emptyCreatures}>
                <p>Nenhuma criatura ou monstro instanciado em cena.</p>
                {isDm && (
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Clique em &quot;Adicionar Criatura&quot; para importar monstros da sua biblioteca ou cadastrar ameaças para o combate.
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.vitalsGrid}>
                {creatures.map((creature) => (
                  <CreatureVitalCard
                    key={creature.id}
                    creature={creature}
                    campaignId={campaign.id}
                    isDm={isDm}
                    onUpdate={handleUpdateCreature}
                    onRemove={handleRemoveCreature}
                    onDuplicate={handleDuplicateCreature}
                    isActiveTurn={campaign.combat?.activeId === combatantId('creature', creature.id)}
                    conditionRounds={campaign.combat?.conditionRounds?.[combatantId('creature', creature.id)]}
                    onSetConditionRounds={
                      isDm && campaign.combat
                        ? (condition, rounds) =>
                            handleSetConditionRounds(combatantId('creature', creature.id), condition, rounds)
                        : undefined
                    }
                    avatarUrl={(() => {
                      const key = creatureAvatarKey(creature)
                      return key ? creatureAvatars[key] : null
                    })()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Integrantes da Mesa ({members.length})
            </h2>

            {!isDm && currentMember && (
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleLeaveCampaign}
              >
                <LogOut size={13} /> Sair da Mesa
              </button>
            )}
          </div>

          <div className={styles.membersGrid} style={{ marginTop: 'var(--space-3)' }}>
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                campaignId={campaign.id}
                isDm={isDm}
                canManageHeroes={Boolean(currentMember?.canManageHeroes)}
                currentUserId={user?.uid}
                onRemove={handleRemoveMember}
                onChangeCharacter={() => setIsSelectCharOpen(true)}
                onUnlinkCharacter={handleRemoveHero}
                onToggleAuthorization={handleToggleAuthorization}
                onToggleParticipation={handleToggleDmParticipation}
              />
            ))}
          </div>
        </div>
      )}

      {isSelectCharOpen && user && (
        <SelectCharacterModal
          userId={user.uid}
          currentSheetId={currentMember?.characterSheetId}
          onSelect={handleUpdateCharacter}
          onClose={() => setIsSelectCharOpen(false)}
        />
      )}

      {isEditOpen && user && (
        <CreateCampaignModal
          dmId={user.uid}
          dmName={campaign.dmName}
          campaign={campaign}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isDeleteOpen && (
        <DeleteCampaignModal
          campaignName={campaign.name}
          memberCount={members.length}
          creatureCount={creatures.length}
          onConfirm={handleDeleteCampaign}
          onClose={() => setIsDeleteOpen(false)}
        />
      )}

      {isAddCreatureOpen && user && (
        <AddCreatureModal
          userId={user.uid}
          onAdd={handleAddCreature}
          onClose={() => setIsAddCreatureOpen(false)}
        />
      )}
    </div>
  )
}
