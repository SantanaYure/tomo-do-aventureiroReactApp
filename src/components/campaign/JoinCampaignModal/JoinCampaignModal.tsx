import { useState, useEffect, useRef } from 'react'
import { joinCampaignByCode } from '../../../store/campaignStore'
import { useCharacterSheets } from '../../../hooks/useCharacterSheets'
import { normalizeInviteCode, isValidInviteCode } from '../../../utils/inviteCode'
import type { Campaign, CampaignMember } from '../../../types/campaign/campaign'
import styles from './JoinCampaignModal.module.css'

interface JoinCampaignModalProps {
  userId: string
  userDisplayName: string
  userPhotoURL?: string | null
  onJoined: (result: { campaign: Campaign; member: CampaignMember }) => void
  onClose: () => void
}

export function JoinCampaignModal({
  userId,
  userDisplayName,
  userPhotoURL,
  onJoined,
  onClose,
}: JoinCampaignModalProps) {
  const [code, setCode] = useState('')
  const [selectedSheetId, setSelectedSheetId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { sheets, isLoading: sheetsLoading } = useCharacterSheets(userId)

  // Foco no campo de código
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Tecla ESC fecha
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Trava scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanCode = normalizeInviteCode(code)
    if (!isValidInviteCode(cleanCode)) {
      setError('O código de convite deve ter 6 caracteres válidos.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      let characterData: {
        characterSheetId?: string | null
        characterName?: string | null
        characterClass?: string | null
        characterAvatarUrl?: string | null
      } = {}

      if (selectedSheetId) {
        const selectedSheet = sheets.find((s) => s.id === selectedSheetId)
        if (selectedSheet) {
          const char = selectedSheet.data.character
          const classText = char.classes
            ?.filter((c) => c.className)
            .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
            .join(' · ')
          characterData = {
            characterSheetId: selectedSheet.id,
            characterName: char.name || 'Sem nome',
            characterClass: classText || null,
            characterAvatarUrl: char.avatar || null,
          }
        }
      }

      const result = await joinCampaignByCode(
        userId,
        userDisplayName,
        userPhotoURL,
        {
          inviteCode: cleanCode,
          ...characterData,
        },
      )

      onJoined(result)
    } catch (err: unknown) {
      console.error('Erro ao entrar na mesa:', err)
      setError(
        err instanceof Error ? err.message : 'Não foi possível entrar na mesa. Verifique o código.',
      )
      setIsSubmitting(false)
    }
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-campaign-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Participar de uma Sessão</p>
            <h2 id="join-campaign-title" className={styles.title}>
              Entrar em Mesa
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="campaign-code" className={styles.label}>
              Código de Convite (6 dígitos) *
            </label>
            <input
              ref={inputRef}
              id="campaign-code"
              type="text"
              className={styles.codeInput}
              placeholder="EX.: TM7K9P"
              value={code}
              onChange={(e) => {
                setCode(normalizeInviteCode(e.target.value).slice(0, 6))
                setError(null)
              }}
              disabled={isSubmitting}
              maxLength={7}
              required
            />
            <p className={styles.hint}>Peça o código de 6 caracteres ao seu Mestre.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="character-select" className={styles.label}>
              Vincular Personagem (Opcional)
            </label>
            <select
              id="character-select"
              className={styles.select}
              value={selectedSheetId}
              onChange={(e) => setSelectedSheetId(e.target.value)}
              disabled={isSubmitting || sheetsLoading}
            >
              <option value="">Entrar sem personagem (definir depois)</option>
              {sheets.map((sheet) => {
                const char = sheet.data.character
                const classText = char.classes
                  ?.filter((c) => c.className)
                  .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
                  .join(' · ')
                const label = `${char.name || 'Sem nome'}${classText ? ` (${classText})` : ''}`
                return (
                  <option key={sheet.id} value={sheet.id}>
                    {label}
                  </option>
                )
              })}
            </select>
            <p className={styles.hint}>
              Você poderá escolher ou trocar de personagem a qualquer momento.
            </p>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || normalizeInviteCode(code).length < 6}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar na Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
