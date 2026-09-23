import { Link } from 'react-router-dom'
import { Crown, Shield, Users } from 'lucide-react'
import type { Campaign } from '../../../types/campaign/campaign'
import { formatInviteCode } from '../../../utils/inviteCode'
import styles from './CampaignCard.module.css'

interface CampaignCardProps {
  campaign: Campaign
  currentUserId: string | null | undefined
}

export function CampaignCard({ campaign, currentUserId }: CampaignCardProps) {
  const isDm = campaign.dmId === currentUserId
  const memberCount = campaign.memberIds ? campaign.memberIds.length : 1

  return (
    <Link to={`/mesas/${campaign.id}`} className={styles.card}>
      <div>
        <div className={styles.cardTop}>
          <h3 className={styles.title}>{campaign.name}</h3>
          <span
            className={`${styles.badge} ${isDm ? styles.badgeDm : styles.badgePlayer}`}
          >
            {isDm ? (
              <>
                <Crown size={13} strokeWidth={1.75} aria-hidden="true" />
                Mestre
              </>
            ) : (
              <>
                <Shield size={13} strokeWidth={1.75} aria-hidden="true" />
                Jogador
              </>
            )}
          </span>
        </div>

        <p className={styles.description}>
          {campaign.description || 'Nenhuma descrição informada.'}
        </p>
      </div>

      <div className={styles.cardBottom}>
        <span className={styles.metaItem}>
          <Users size={14} strokeWidth={1.75} aria-hidden="true" />
          {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
        </span>
        {isDm && (
          <span className={styles.codeBadge}>
            Cód: {formatInviteCode(campaign.inviteCode)}
          </span>
        )}
      </div>
    </Link>
  )
}
