import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import styles from './DeleteCampaignModal.module.css'

interface DeleteCampaignModalProps {
  campaignName: string
  memberCount: number
  creatureCount: number
  /** Deve lançar em caso de falha, para o modal mostrar o erro sem fechar. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

/**
 * Confirmação da exclusão de uma mesa. Como não tem volta, pede para digitar
 * o nome da mesa antes de liberar o botão.
 */
export function DeleteCampaignModal({
  campaignName,
  memberCount,
  creatureCount,
  onConfirm,
  onClose,
}: DeleteCampaignModalProps) {
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = typed.trim().toLocaleLowerCase('pt-BR') === campaignName.trim().toLocaleLowerCase('pt-BR')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isDeleting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isDeleting])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!matches || isDeleting) return
    try {
      setIsDeleting(true)
      setError(null)
      await onConfirm()
    } catch (err) {
      console.error('Erro ao excluir mesa:', err)
      const code = (err as { code?: string } | null)?.code
      setError(
        code === 'permission-denied'
          ? 'Permissão negada pelo servidor. Confira se as regras do Firestore estão publicadas.'
          : 'Não foi possível excluir a mesa. Tente novamente.',
      )
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => event.target === event.currentTarget && !isDeleting && onClose()}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-campaign-title"
        aria-describedby="delete-campaign-desc"
      >
        <h2 id="delete-campaign-title" className={styles.title}>
          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Excluir mesa
        </h2>

        <div id="delete-campaign-desc" className={styles.body}>
          <p>
            A mesa <strong>{campaignName}</strong> será apagada para todos, junto com{' '}
            {memberCount === 1 ? '1 integrante' : `${memberCount} integrantes`} e{' '}
            {creatureCount === 1 ? '1 criatura em cena' : `${creatureCount} criaturas em cena`}.
            Isso não pode ser desfeito.
          </p>
          <p>As fichas de PJ, monstros e NPCs continuam na biblioteca de cada um, só sem o vínculo com a mesa.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="delete-campaign-confirm" className={styles.label}>
            Digite o nome da mesa para confirmar
          </label>
          <input
            ref={inputRef}
            id="delete-campaign-confirm"
            type="text"
            className={styles.input}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={campaignName}
            autoComplete="off"
            disabled={isDeleting}
          />

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isDeleting}>
              Cancelar
            </button>
            <button type="submit" className={styles.dangerBtn} disabled={!matches || isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
