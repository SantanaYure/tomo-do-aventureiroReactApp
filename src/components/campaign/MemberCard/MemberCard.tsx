import { Crown, Trash2, User } from 'lucide-react'
import { UserAvatar } from '../../UserAvatar/UserAvatar'
import type { CampaignMember } from '../../../types/campaign/campaign'
import styles from './MemberCard.module.css'

interface MemberCardProps {
  member: CampaignMember
  isDm: boolean
  currentUserId: string | null | undefined
  onRemove?: (memberId: string) => void
  onChangeCharacter?: (member: CampaignMember) => void
}

export function MemberCard({
  member,
  isDm,
  currentUserId,
  onRemove,
  onChangeCharacter,
}: MemberCardProps) {
  const isSelf = member.userId === currentUserId
  const isMemberDm = member.role === 'dm'
  const canRemove = isDm && !isMemberDm

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
          </div>
        </div>

        {canRemove && onRemove && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onRemove(member.userId)}
            aria-label={`Remover ${member.displayName} da mesa`}
            title="Remover jogador"
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {!isMemberDm && (
        <div className={styles.characterBox}>
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

          <div className={styles.characterInfo}>
            {member.characterName ? (
              <>
                <p className={styles.characterName}>{member.characterName}</p>
                <p className={styles.characterClass}>
                  {member.characterClass || 'Classe não definida'}
                </p>
              </>
            ) : (
              <span className={styles.noCharacter}>Nenhum personagem vinculado</span>
            )}

            {isSelf && onChangeCharacter && (
              <button
                type="button"
                className={styles.changeCharBtn}
                onClick={() => onChangeCharacter(member)}
              >
                {member.characterName ? 'Trocar Personagem' : 'Vincular Personagem'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
