import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Castle, KeyRound, Plus, ScrollText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../hooks/useCampaigns'
import { CampaignCard } from '../../components/campaign/CampaignCard/CampaignCard'
import { CreateCampaignModal } from '../../components/campaign/CreateCampaignModal/CreateCampaignModal'
import { JoinCampaignModal } from '../../components/campaign/JoinCampaignModal/JoinCampaignModal'
import { DeleteCampaignModal } from '../../components/campaign/DeleteCampaignModal/DeleteCampaignModal'
import { deleteCampaign } from '../../store/campaignStore'
import type { Campaign, CampaignMember } from '../../types/campaign/campaign'
import styles from './CampaignsPage.module.css'

type FilterTab = 'all' | 'dm' | 'player'

export function CampaignsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { campaigns, dmCampaigns, playerCampaigns, isLoading } = useCampaigns(user?.uid)

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null)

  const displayedCampaigns =
    activeTab === 'dm'
      ? dmCampaigns
      : activeTab === 'player'
      ? playerCampaigns
      : campaigns

  function handleCampaignCreated(campaign: Campaign) {
    setIsCreateOpen(false)
    navigate(`/mesas/${campaign.id}`)
  }

  /** Erros sobem para o DeleteCampaignModal, que os mostra sem fechar. */
  async function handleConfirmDelete() {
    if (!deletingCampaign) return
    await deleteCampaign(deletingCampaign.id)
    setDeletingCampaign(null)
  }

  function handleCampaignJoined(result: { campaign: Campaign; member: CampaignMember }) {
    setIsJoinOpen(false)
    navigate(`/mesas/${result.campaign.id}`)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Gerenciamento de Mesas</p>
          <h1 className={styles.title}>Mesas & Campanhas</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.joinBtn}
            onClick={() => setIsJoinOpen(true)}
          >
            <KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />
            Entrar com Código
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nova Mesa
          </button>
        </div>
      </header>

      <nav className={styles.filterTabs} aria-label="Filtros de campanhas">
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todas ({campaigns.length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'dm' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('dm')}
        >
          Como Mestre ({dmCampaigns.length})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'player' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('player')}
        >
          Como Jogador ({playerCampaigns.length})
        </button>
      </nav>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '9rem',
                background: 'var(--item-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--panel-border)',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : displayedCampaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            {activeTab === 'dm' ? (
              <Castle size={28} strokeWidth={1.5} />
            ) : (
              <ScrollText size={28} strokeWidth={1.5} />
            )}
          </div>
          <h2 className={styles.emptyTitle}>
            {activeTab === 'dm'
              ? 'Você ainda não criou nenhuma mesa'
              : activeTab === 'player'
              ? 'Você não está participando de nenhuma mesa'
              : 'Nenhuma mesa encontrada'}
          </h2>
          <p className={styles.emptyDesc}>
            {activeTab === 'dm'
              ? 'Crie uma nova mesa como Mestre e compartilhe o código de convite com seus jogadores.'
              : 'Peça o código de convite de 6 dígitos ao seu Mestre para entrar em uma mesa ativa.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedCampaigns.map((camp) => (
            <CampaignCard
              key={camp.id}
              campaign={camp}
              currentUserId={user?.uid}
              onEdit={setEditingCampaign}
              onDelete={setDeletingCampaign}
            />
          ))}
        </div>
      )}

      {isCreateOpen && user && (
        <CreateCampaignModal
          dmId={user.uid}
          dmName={user.displayName || 'Mestre'}
          dmPhotoURL={user.photoURL}
          onCreated={handleCampaignCreated}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {editingCampaign && user && (
        <CreateCampaignModal
          dmId={user.uid}
          dmName={editingCampaign.dmName}
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
        />
      )}

      {deletingCampaign && (
        <DeleteCampaignModal
          campaignName={deletingCampaign.name}
          memberCount={deletingCampaign.memberIds.length}
          creatureCount={deletingCampaign.creatures?.length ?? 0}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingCampaign(null)}
        />
      )}

      {isJoinOpen && user && (
        <JoinCampaignModal
          userId={user.uid}
          userDisplayName={user.displayName || 'Aventureiro'}
          userPhotoURL={user.photoURL}
          onJoined={handleCampaignJoined}
          onClose={() => setIsJoinOpen(false)}
        />
      )}
    </div>
  )
}
