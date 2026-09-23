import { useEffect, useRef } from 'react'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { AppearancePanel } from '../AppearancePanel/AppearancePanel'
import styles from './SettingsModal.module.css'

interface SettingsModalProps {
  displayName: string | null
  email: string | null
  photoURL: string | null
  /** Encerra a sessão. O disparo de navegação fica com quem monta o modal. */
  onLogout: () => void
  onClose: () => void
}

export function SettingsModal({
  displayName,
  email,
  photoURL,
  onLogout,
  onClose,
}: SettingsModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // ESC fecha
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Foca o botão de fechar ao abrir
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Trava a rolagem do body enquanto o modal está aberto
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const name = displayName?.trim() || 'Aventureiro'

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Conta</p>
            <h2 id="settings-modal-title" className={styles.title}>
              Configurações
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar configurações"
          >
            ✕
          </button>
        </div>

        <div className={styles.identity}>
          <UserAvatar
            photoURL={photoURL}
            email={email}
            displayName={displayName}
            size="lg"
          />
          <div className={styles.identityText}>
            <span className={styles.name}>{name}</span>
            {email && <span className={styles.email}>{email}</span>}
          </div>
        </div>

        <AppearancePanel />

        <details className={styles.credits}>
          <summary className={styles.creditsSummary}>Créditos e licenças</summary>
          <div className={styles.creditsBody}>
            <p>
              Os modelos de monstros prontos usam conteúdo do System Reference Document,
              traduzido e adaptado para o português. Nomes, textos e medidas foram
              ajustados; as estatísticas seguem o original.
            </p>
            <p lang="en">
              This work includes material taken from the System Reference Document 5.1
              (&ldquo;SRD 5.1&rdquo;) by Wizards of the Coast LLC and available at{' '}
              <a
                href="https://dnd.wizards.com/resources/systems-reference-document"
                target="_blank"
                rel="noreferrer"
              >
                dnd.wizards.com/resources/systems-reference-document
              </a>
              . The SRD 5.1 is licensed under the Creative Commons Attribution 4.0
              International License.
            </p>
            <p lang="en">
              This work includes material from the System Reference Document 5.2
              (&ldquo;SRD 5.2&rdquo;) by Wizards of the Coast LLC, available at{' '}
              <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">
                dndbeyond.com/srd
              </a>
              . The SRD 5.2 is licensed under the Creative Commons Attribution 4.0
              International License.
            </p>
            <p>
              Licença:{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/legalcode"
                target="_blank"
                rel="noreferrer"
              >
                CC-BY-4.0
              </a>
              . Tomo do Aventureiro não é afiliado à Wizards of the Coast.
            </p>
          </div>
        </details>

        <div className={styles.divider} aria-hidden="true" />

        <button type="button" className={styles.logoutBtn} onClick={onLogout}>
          <span className={styles.logoutIcon} aria-hidden="true">
            ⇥
          </span>
          <span>Sair do sistema</span>
        </button>
      </div>
    </div>
  )
}
