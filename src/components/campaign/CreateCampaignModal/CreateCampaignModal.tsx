import { useState, useEffect, useRef } from 'react'
import { createCampaign } from '../../../store/campaignStore'
import type { Campaign } from '../../../types/campaign/campaign'
import styles from './CreateCampaignModal.module.css'

interface CreateCampaignModalProps {
  dmId: string
  dmName: string
  dmPhotoURL?: string | null
  onCreated: (campaign: Campaign) => void
  onClose: () => void
}

export function CreateCampaignModal({
  dmId,
  dmName,
  dmPhotoURL,
  onCreated,
  onClose,
}: CreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Foco inicial
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
    if (!name.trim()) {
      setError('Por favor, informe o nome da mesa.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const campaign = await createCampaign(
        dmId,
        dmName,
        {
          name: name.trim(),
          description: description.trim() || undefined,
        },
        dmPhotoURL,
      )
      onCreated(campaign)
    } catch (err) {
      console.error('Erro ao criar mesa:', err)
      const message = err instanceof Error ? err.message : ''
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('permissão')) {
        setError('Permissão negada no Firestore: você precisa publicar as novas regras de segurança (firestore.rules) no Firebase.')
      } else {
        setError(message || 'Não foi possível criar a mesa. Tente novamente.')
      }
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
        aria-labelledby="create-campaign-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Mestre da Mesa</p>
            <h2 id="create-campaign-title" className={styles.title}>
              Nova Mesa
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
            <label htmlFor="campaign-name" className={styles.label}>
              Nome da Mesa *
            </label>
            <input
              ref={inputRef}
              id="campaign-name"
              type="text"
              className={styles.input}
              placeholder="Ex.: A Maldição de Strahd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={80}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="campaign-desc" className={styles.label}>
              Descrição ou Sinopse
            </label>
            <textarea
              id="campaign-desc"
              className={styles.textarea}
              placeholder="Breve resumo da aventura, dias de jogo ou avisos para o grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
            />
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
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Criando...' : 'Criar Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
