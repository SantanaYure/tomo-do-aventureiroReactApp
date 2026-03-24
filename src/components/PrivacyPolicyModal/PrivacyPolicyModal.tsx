import { useEffect, useRef } from 'react'
import { PRIVACY_SECTIONS, PRIVACY_LAST_UPDATED } from './privacySections'
import styles from './PrivacyPolicyModal.module.css'

type Props = {
  onAccept: () => void
  onClose: () => void
}

export function PrivacyPolicyModal({ onAccept, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Fecha ao pressionar ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Foca o botão de fechar ao abrir
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Bloqueia scroll do body enquanto modal está aberto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleAccept() {
    onAccept()
    onClose()
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        {/* ── Cabeçalho ── */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerIcon} aria-hidden="true">📜</span>
            <div>
              <h2 id="privacy-modal-title" className={styles.title}>
                Política de Privacidade
              </h2>
              <p className={styles.lastUpdated}>
                Última atualização: {PRIVACY_LAST_UPDATED}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar política de privacidade"
          >
            ✕
          </button>
        </div>

        {/* ── Conteúdo rolável ── */}
        <div className={styles.body}>
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.id} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <div className={styles.sectionBody}>{section.content}</div>
            </section>
          ))}
        </div>

        {/* ── Rodapé com ações ── */}
        <div className={styles.footer}>
          <p className={styles.footerHint}>
            Ao clicar em <strong>Aceitar</strong>, você confirma que leu e concorda com esta
            Política de Privacidade nos termos da LGPD (Lei nº 13.709/2018).
          </p>
          <div className={styles.footerActions}>
            <button type="button" className={styles.closeAction} onClick={onClose}>
              Fechar
            </button>
            <button type="button" className={styles.acceptButton} onClick={handleAccept}>
              ✓ Aceitar e fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
