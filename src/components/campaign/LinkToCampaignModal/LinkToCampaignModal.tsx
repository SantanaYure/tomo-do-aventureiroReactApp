import { useState, useEffect } from 'react'
import { Link2, Unlink } from 'lucide-react'
import { useCampaigns } from '../../../hooks/useCampaigns'
import {
  linkCharacterSheetToCampaign,
  unlinkCharacterSheetFromCampaign,
  linkMonsterSheetToCampaign,
  unlinkMonsterSheetFromCampaign,
} from '../../../store/campaignStore'
import type { CharacterSheet } from '../../../types/system/dnd/CharacterSheet'
import type { MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import styles from './LinkToCampaignModal.module.css'

interface LinkToCampaignModalProps {
  userId: string
  sheetType: 'character' | 'monster' | 'npc'
  sheetId: string
  sheetName: string
  sheetData: CharacterSheet | MonsterSheet
  currentCampaignId?: string | null
  currentCampaignName?: string | null
  onClose: () => void
  onSuccess?: () => void
}

export function LinkToCampaignModal({
  userId,
  sheetType,
  sheetId,
  sheetName,
  sheetData,
  currentCampaignId,
  currentCampaignName,
  onClose,
  onSuccess,
}: LinkToCampaignModalProps) {
  const { campaigns, isLoading } = useCampaigns(userId)
  const [selectedCampaignId, setSelectedCampaignId] = useState(currentCampaignId || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Para monstros/NPCs, somente campanhas em que o usuário é DM fazem sentido como mesa hospedeira
  const availableCampaigns = sheetType === 'character'
    ? campaigns
    : campaigns.filter((c) => c.dmId === userId)

  async function handleLink(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCampaignId) return

    const target = campaigns.find((c) => c.id === selectedCampaignId)
    if (!target) return

    try {
      setIsSubmitting(true)

      if (sheetType === 'character') {
        await linkCharacterSheetToCampaign(
          target.id,
          target.name,
          userId,
          sheetId,
          sheetData as CharacterSheet,
        )
      } else {
        await linkMonsterSheetToCampaign(
          target.id,
          target.name,
          userId,
          sheetId,
          sheetData as MonsterSheet,
          target.creatures || [],
          sheetName,
        )
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Erro ao vincular ficha à mesa:', err)
      setIsSubmitting(false)
    }
  }

  async function handleUnlink() {
    if (!currentCampaignId) return
    const confirm = window.confirm(
      `Desvincular "${sheetName}" da mesa "${currentCampaignName || 'atual'}"?`,
    )
    if (!confirm) return

    try {
      setIsSubmitting(true)
      if (sheetType === 'character') {
        await unlinkCharacterSheetFromCampaign(currentCampaignId, userId, sheetId)
      } else {
        await unlinkMonsterSheetFromCampaign(currentCampaignId, userId, sheetId)
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Erro ao desvincular ficha:', err)
      setIsSubmitting(false)
    }
  }

  const typeLabel = sheetType === 'character' ? 'Personagem' : sheetType === 'npc' ? 'NPC' : 'Monstro'

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-campaign-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="link-campaign-title" className={styles.title}>
              Vincular {typeLabel} à Mesa
            </h2>
            <p className={styles.subtitle}>{sheetName}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {currentCampaignId && (
          <div className={styles.currentLinkAlert}>
            <span>
              Atualmente vinculado à mesa:{' '}
              <span className={styles.currentLinkName}>
                {currentCampaignName || 'Mesa Ativa'}
              </span>
            </span>
            <button
              type="button"
              className={styles.unlinkQuickBtn}
              onClick={handleUnlink}
              disabled={isSubmitting}
            >
              <Unlink size={12} style={{ display: 'inline', marginRight: 4 }} />
              Desvincular
            </button>
          </div>
        )}

        <form onSubmit={handleLink} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className={styles.field}>
            <label htmlFor="select-campaign" className={styles.label}>
              Selecione a Mesa de Destino
            </label>

            {isLoading ? (
              <p className={styles.emptyCampaigns}>Carregando mesas disponíveis...</p>
            ) : availableCampaigns.length === 0 ? (
              <p className={styles.emptyCampaigns}>
                {sheetType === 'character'
                  ? 'Você ainda não participa de nenhuma mesa ativa.'
                  : 'Você precisa ser Mestre de ao menos uma mesa para vincular monstros/NPCs.'}
              </p>
            ) : (
              <select
                id="select-campaign"
                className={styles.select}
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Selecione uma mesa...</option>
                {availableCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.dmId === userId ? '(Mestre)' : '(Jogador)'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.actions}>
            {currentCampaignId ? (
              <button
                type="button"
                className={styles.unlinkBtn}
                onClick={handleUnlink}
                disabled={isSubmitting}
              >
                Desvincular da Mesa
              </button>
            ) : <div />}

            <div className={styles.rightActions}>
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
                disabled={isSubmitting || !selectedCampaignId || selectedCampaignId === currentCampaignId}
              >
                <Link2 size={14} style={{ display: 'inline', marginRight: 6 }} />
                {isSubmitting ? 'Salvando...' : 'Confirmar Vínculo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
