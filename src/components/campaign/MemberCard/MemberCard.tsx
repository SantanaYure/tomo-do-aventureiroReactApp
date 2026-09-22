import { Link } from 'react-router-dom'
import { Crown, Trash2, User, ExternalLink, ShieldCheck } from 'lucide-react'
import { UserAvatar } from '../../UserAvatar/UserAvatar'
import type { CampaignMember } from '../../../types/campaign/campaign'
import styles from './MemberCard.module.css'

interface MemberCardProps {
  member: CampaignMember
  campaignId?: string
  isDm: boolean
  canManageHeroes?: boolean
  currentUserId: string | null | undefined
  onRemove?: (memberId: string) => void
  onChangeCharacter?: (member: CampaignMember) => void
  onUnlinkCharacter?: (memberId: string, sheetId?: string | null) => void
  onToggleAuthorization?: (memberId: string, canManage: boolean) => void
}

export function MemberCard({
  member,
  campaignId,
  isDm,
  canManageHeroes = false,
  currentUserId,
  onRemove,
  onChangeCharacter,
  onUnlinkCharacter,
  onToggleAuthorization,
}: MemberCardProps) {
  const isSelf = member.userId === currentUserId
  const isMemberDm = member.role === 'dm'
  const canRemove = isDm && !isMemberDm
  const canUnlink = (isDm || canManageHeroes || isSelf) && Boolean(member.characterSheetId)

  const sheetUrl = member.characterSheetId
    ? `/ficha/${member.characterSheetId}?owner=${member.userId}&campaign=${campaignId || ''}`
    : null

  function handleUnlink() {
    if (window.confirm(`Desvincular o personagem de ${member.displayName}?`)) {
      onUnlinkCharacter?.(member.userId, member.characterSheetId)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <UserAvatar
            photoURL={member.photoURL}
            displayName={member.displayName}
            size="md"
          />
          <div className={styles.userNames}>
            <p className={styles.displayName}>
              {member.displayName} {isSelf && '(Você)'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                className={`${styles.roleTag} ${isMemberDm ? styles.dmTag : ''}`}
              >
                {isMemberDm ? (
                  <>
                    <Crown size={12} strokeWidth={1.75} aria-hidden="true" />
                    Mestre
                  </>
                ) : (
                  <>
                    <User size={12} strokeWidth={1.75} aria-hidden="true" />
                    Jogador
                  </>
                )}
              </span>

              {member.canManageHeroes && (
                <span className={styles.authBadge} title="Autorizado pelo Mestre a gerenciar heróis">
                  <ShieldCheck size={11} strokeWidth={2} /> Ajudante
                </span>
              )}
            </div>

            {isDm && !isMemberDm && onToggleAuthorization && (
              <button
                type="button"
                className={styles.authToggleBtn}
                onClick={() => onToggleAuthorization(member.userId, !member.canManageHeroes)}
              >
                {member.canManageHeroes ? 'Revogar autorização' : 'Autorizar como ajudante'}
              </button>
            )}
          </div>
        </div>

        {canRemove && onRemove && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onRemove(member.userId)}
            aria-label={`Remover ${member.displayName} da mesa`}
            title="Remover jogador da mesa"
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div className={styles.characterBox}>
        {sheetUrl ? (
          <Link to={sheetUrl} title="Abrir ficha">
            {member.characterAvatarUrl ? (
              <img
                src={member.characterAvatarUrl}
                alt=""
                className={styles.characterAvatar}
              />
            ) : (
              <div className={styles.characterAvatarFallback}>
                {member.characterName ? member.characterName[0]?.toUpperCase() : '?'}
              </div>
            )}
          </Link>
        ) : member.characterAvatarUrl ? (
          <img
            src={member.characterAvatarUrl}
            alt=""
            className={styles.characterAvatar}
          />
        ) : (
          <div className={styles.characterAvatarFallback}>
            {member.characterName ? member.characterName[0]?.toUpperCase() : '?'}
          </div>
        )}

        <div className={styles.characterInfo}>
          {member.characterName ? (
            <>
              <p className={styles.characterName}>
                {sheetUrl ? (
                  <Link to={sheetUrl} className={styles.charLink} title="Abrir ficha de personagem">
                    {member.characterName}
                    <ExternalLink size={12} strokeWidth={2} />
                  </Link>
                ) : (
                  member.characterName
                )}
              </p>
              <p className={styles.characterClass}>
                {member.characterClass || 'Classe não definida'}
              </p>
            </>
          ) : (
            <span className={styles.noCharacter}>
              {isMemberDm ? 'Mestre sem ficha vinculada' : 'Nenhum personagem vinculado'}
            </span>
          )}

          <div className={styles.charActions}>
            {isSelf && onChangeCharacter && (
              <button
                type="button"
                className={styles.changeCharBtn}
                onClick={() => onChangeCharacter(member)}
              >
                {member.characterName ? 'Trocar Personagem' : 'Vincular Personagem'}
              </button>
            )}

            {canUnlink && (
              <button
                type="button"
                className={styles.unlinkBtn}
                onClick={handleUnlink}
              >
                Desvincular
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
