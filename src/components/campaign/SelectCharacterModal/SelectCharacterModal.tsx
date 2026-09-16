import { useState, useEffect } from 'react'
import { useCharacterSheets } from '../../../hooks/useCharacterSheets'
import { extractVitalsFromCharacterSheet } from '../../../store/campaignStore'
import type { CharacterVitals } from '../../../types/campaign/campaign'
import styles from './SelectCharacterModal.module.css'

interface SelectCharacterModalProps {
  userId: string
  currentSheetId?: string | null
  onSelect: (characterData: {
    characterSheetId: string | null
    characterName: string | null
    characterClass: string | null
    characterAvatarUrl: string | null
    vitals?: CharacterVitals | null
  }) => Promise<void>
  onClose: () => void
}


export function SelectCharacterModal({
  userId,
  currentSheetId,
  onSelect,
  onClose,
}: SelectCharacterModalProps) {
  const [selectedId, setSelectedId] = useState(currentSheetId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { sheets, isLoading } = useCharacterSheets(userId)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      if (!selectedId) {
        await onSelect({
          characterSheetId: null,
          characterName: null,
          characterClass: null,
          characterAvatarUrl: null,
        })
      } else {
        const found = sheets.find((s) => s.id === selectedId)
        if (found) {
          const char = found.data.character
          const classText = char.classes
            ?.filter((c) => c.className)
            .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
            .join(' · ')
          const vitals = extractVitalsFromCharacterSheet(found.data)
          await onSelect({
            characterSheetId: found.id,
            characterName: char.name || 'Sem nome',
            characterClass: classText || null,
            characterAvatarUrl: char.avatar || null,
            vitals,
          })
        }
      }
      onClose()

    } catch (err) {
      console.error('Erro ao atualizar personagem:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="select-char-title">
        <div className={styles.header}>
          <h2 id="select-char-title" className={styles.title}>
            Vincular Personagem
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className={styles.field}>
            <select
              className={styles.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={isSubmitting || isLoading}
            >
              <option value="">Nenhum (desvincular)</option>
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
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
