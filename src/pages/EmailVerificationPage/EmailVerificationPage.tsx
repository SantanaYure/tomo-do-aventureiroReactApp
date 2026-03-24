import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import styles from './EmailVerificationPage.module.css'

const RESEND_COOLDOWN = 30

export function EmailVerificationPage() {
  const navigate = useNavigate()
  const { user, emailVerified, resendVerificationEmail, refreshUser } = useAuth()

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [sendFeedback, setSendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (emailVerified) navigate('/', { replace: true })
  }, [emailVerified, navigate])

  useEffect(() => {
    if (canResend) return
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, canResend])

  const handleResend = useCallback(async () => {
    if (!canResend || isSending) return
    setIsSending(true)
    setSendFeedback(null)
    try {
      await resendVerificationEmail()
      setSendFeedback({ type: 'success', message: 'E-mail de verificação reenviado com sucesso.' })
      setCanResend(false)
      setCountdown(RESEND_COOLDOWN)
    } catch (err) {
      setSendFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível reenviar o e-mail.',
      })
    } finally {
      setIsSending(false)
    }
  }, [canResend, isSending, resendVerificationEmail])

  async function handleCheckVerification() {
    setIsChecking(true)
    setSendFeedback(null)
    try {
      const verified = await refreshUser()
      if (!verified) {
        setSendFeedback({
          type: 'error',
          message: 'E-mail ainda não verificado. Clique no link que enviamos.',
        })
      }
    } catch {
      setSendFeedback({ type: 'error', message: 'Não foi possível verificar. Tente novamente.' })
    } finally {
      setIsChecking(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
    } catch {
      // ignore
    } finally {
      navigate('/login', { replace: true })
    }
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <span className={styles.icon}>✉</span>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Verifique seu e-mail</h1>
          <p className={styles.subtitle}>
            Enviamos um link de confirmação para{' '}
            <strong className={styles.email}>{user.email}</strong>
          </p>
          <p className={styles.hint}>
            Clique no link do e-mail e depois retorne aqui para continuar.
          </p>
        </header>

        {sendFeedback && (
          <p
            className={sendFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}
            role="alert"
          >
            {sendFeedback.message}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCheckVerification}
            disabled={isChecking}
          >
            {isChecking ? 'Verificando...' : '✓ Já verifiquei meu e-mail'}
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleResend}
            disabled={!canResend || isSending}
          >
            {isSending
              ? 'Enviando...'
              : canResend
                ? '↩ Reenviar e-mail'
                : `↩ Reenviar em ${countdown}s`}
          </button>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerText}>ou</span>
        </div>

        <button type="button" className={styles.signOutButton} onClick={handleSignOut}>
          Sair da conta
        </button>
      </div>

      <footer className={styles.footer}>
        © 2025 Tomo do Aventureiro — Todos os direitos reservados
      </footer>
    </div>
  )
}
