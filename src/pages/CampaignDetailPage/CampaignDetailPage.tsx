import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCampaign } from '../../hooks/useCampaign'
import {
  removeMember,
  updateMemberCharacter,
  regenerateInviteCode,
  updateCampaign,
} from '../../store/campaignStore'
import { MemberCard } from '../../components/campaign/MemberCard/MemberCard'
import { SelectCharacterModal } from '../../components/campaign/SelectCharacterModal/SelectCharacterModal'
import { formatInviteCode } from '../../utils/inviteCode'
import type { CampaignMember } from '../../types/campaign/campaign'
import styles from './CampaignDetailPage.module.css'

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { campaign, members, isDm, currentMember, isLoading, error } = useCampaign(
    id,
    user?.uid,
  )

  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSelectCharOpen, setIsSelectCharOpen] = useState(false)

  async function handleCopyCode() {
    if (!campaign) return
    try {
      await navigator.clipboard.writeText(campaign.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback simples
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
  }) {
    if (!campaign || !user) return
    await updateMemberCharacter(campaign.id, user.uid, data)
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div style={{ height: '12rem', background: 'var(--item-bg)', borderRadius: 'var(--radius-xl)' }} />
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

      <div className={styles.membersGrid}>
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

      {isSelectCharOpen && user && (
        <SelectCharacterModal
          userId={user.uid}
          currentSheetId={currentMember?.characterSheetId}
          onSelect={handleUpdateCharacter}
          onClose={() => setIsSelectCharOpen(false)}
        />
      )}
    </div>
  )
}
