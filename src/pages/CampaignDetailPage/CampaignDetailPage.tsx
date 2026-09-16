import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  Plus,
  RefreshCw,
  Skull,
  Swords,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCampaign } from '../../hooks/useCampaign'
import {
  removeMember,
  updateMemberCharacter,
  updateMemberVitals,
  regenerateInviteCode,
  addCreatureToCampaign,
  updateCreatureInCampaign,
  removeCreatureFromCampaign,
} from '../../store/campaignStore'
import { MemberCard } from '../../components/campaign/MemberCard/MemberCard'
import { SelectCharacterModal } from '../../components/campaign/SelectCharacterModal/SelectCharacterModal'
import { HeroVitalCard } from '../../components/campaign/HeroVitalCard/HeroVitalCard'
import { CreatureVitalCard } from '../../components/campaign/CreatureVitalCard/CreatureVitalCard'
import { AddCreatureModal } from '../../components/campaign/AddCreatureModal/AddCreatureModal'
import { formatInviteCode } from '../../utils/inviteCode'
import type { CampaignCreature, CharacterVitals } from '../../types/campaign/campaign'
import styles from './CampaignDetailPage.module.css'

type TabType = 'session' | 'members'

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

    try {
      await removeMember(campaign.id, memberId)
    } catch (err) {
      console.error('Erro ao remover membro:', err)
    }
  }

  async function handleLeaveCampaign() {
    if (!campaign || !user) return
    const confirm = window.confirm('Deseja realmente sair desta mesa?')
    if (!confirm) return

    try {
      await removeMember(campaign.id, user.uid)
      navigate('/mesas')
    } catch (err) {
      console.error('Erro ao sair da mesa:', err)
    }
  }

  async function handleUpdateCharacter(data: {
    characterSheetId: string | null
    characterName: string | null
    characterClass: string | null
    characterAvatarUrl: string | null
    vitals?: CharacterVitals | null
  }) {
    if (!campaign || !user) return
    await updateMemberCharacter(campaign.id, user.uid, {
      characterSheetId: data.characterSheetId,
      characterName: data.characterName,
      characterClass: data.characterClass,
      characterAvatarUrl: data.characterAvatarUrl,
    })
    if (data.vitals) {
      await updateMemberVitals(campaign.id, user.uid, data.vitals)
    }
  }

  async function handleUpdateVitals(userId: string, newVitals: CharacterVitals) {
    if (!campaign) return
    try {
      await updateMemberVitals(campaign.id, userId, newVitals)
    } catch (err) {
      console.error('Erro ao atualizar vitais:', err)
    }
  }

  async function handleAddCreature(creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>) {
    if (!campaign) return
    try {
      await addCreatureToCampaign(campaign.id, campaign.creatures, creatureData)
    } catch (err) {
      console.error('Erro ao adicionar criatura:', err)
    }
  }

  async function handleUpdateCreature(creatureId: string, updates: Partial<CampaignCreature>) {
    if (!campaign) return
    try {
      await updateCreatureInCampaign(campaign.id, campaign.creatures || [], creatureId, updates)
    } catch (err) {
      console.error('Erro ao atualizar criatura:', err)
    }
  }

  async function handleRemoveCreature(creatureId: string) {
    if (!campaign) return
    try {
      await removeCreatureFromCampaign(campaign.id, campaign.creatures || [], creatureId)
    } catch (err) {
      console.error('Erro ao remover criatura:', err)
    }
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

      {activeTab === 'session' ? (
        <div className={styles.sessionDashboard}>
          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Heróis na Sessão ({members.length})
              </h2>
            </div>

            <div className={styles.vitalsGrid} style={{ marginTop: 'var(--space-3)' }}>
              {members.map((member) => (
                <HeroVitalCard
                  key={member.userId}
                  member={member}
                  isDm={isDm}
                  currentUserId={user?.uid}
                  onUpdateVitals={handleUpdateVitals}
                  onSelectCharacter={() => setIsSelectCharOpen(true)}
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
                    isDm={isDm}
                    onUpdate={handleUpdateCreature}
                    onRemove={handleRemoveCreature}
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
                isDm={isDm}
                currentUserId={user?.uid}
                onRemove={handleRemoveMember}
                onChangeCharacter={() => setIsSelectCharOpen(true)}
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
