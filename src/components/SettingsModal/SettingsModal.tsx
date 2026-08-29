import { useEffect, useRef } from 'react'
import { useTheme, THEME_ORDER, type ThemeMode } from '../../context/ThemeContext'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import styles from './SettingsModal.module.css'

const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Claro',
  dark: 'Escuro',
  parchment: 'Pergaminho',
}

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
  const { mode, setMode } = useTheme()
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

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Tema</span>
          <select
            className={styles.select}
            value={mode}
            onChange={(event) => setMode(event.target.value as ThemeMode)}
          >
            {THEME_ORDER.map((theme) => (
              <option key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </option>
            ))}
          </select>
        </label>

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
