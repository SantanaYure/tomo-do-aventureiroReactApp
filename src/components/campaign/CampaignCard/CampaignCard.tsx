import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, MoreVertical, Pencil, Shield, Trash2, Users } from 'lucide-react'
import type { Campaign } from '../../../types/campaign/campaign'
import { formatInviteCode } from '../../../utils/inviteCode'
import styles from './CampaignCard.module.css'

interface CampaignCardProps {
  campaign: Campaign
  currentUserId: string | null | undefined
  /** Só aparecem para o mestre da mesa. */
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, currentUserId, onEdit, onDelete }: CampaignCardProps) {
  const isDm = campaign.dmId === currentUserId
  const memberCount = campaign.memberIds ? campaign.memberIds.length : 1
  const hasActions = isDm && Boolean(onEdit || onDelete)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  function runAction(action?: (campaign: Campaign) => void) {
    setMenuOpen(false)
    action?.(campaign)
  }

  return (
    <article className={styles.card}>
      <div>
        <div className={styles.cardTop}>
          <h3 className={styles.title}>
            {/* O link se estende pelo card inteiro (::after), sem envolver o menu. */}
            <Link to={`/mesas/${campaign.id}`} className={styles.cardLink}>
              {campaign.name}
            </Link>
          </h3>

          <div className={styles.topRight}>
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

            {hasActions && (
              <div className={styles.menu} ref={menuRef}>
                <button
                  type="button"
                  className={styles.menuTrigger}
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label={`Ações da mesa ${campaign.name}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <MoreVertical size={15} strokeWidth={1.75} aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div className={styles.dropdown} role="menu">
                    {onEdit && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={() => runAction(onEdit)}
                      >
                        <Pencil size={13} strokeWidth={1.75} aria-hidden="true" />
                        Editar mesa
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        onClick={() => runAction(onDelete)}
                      >
                        <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                        Excluir mesa
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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
    </article>
  )
}
