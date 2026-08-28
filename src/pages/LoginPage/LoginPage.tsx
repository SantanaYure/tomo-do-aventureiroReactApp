import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND_LOGO_URL } from '../../assets/brandLogo'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'
import styles from './LoginPage.module.css'

const FEATURES = [
  {
    symbol: '📜',
    title: 'Fichas Completas',
    description: 'Atributos, perícias, equipamentos e histórico em um só lugar',
  },
  {
    symbol: '⚔',
    title: 'Combate em Tempo Real',
    description: 'Gerencie HP, magias, ataques e recursos durante a sessão',
  },
  {
    symbol: '☁',
    title: 'Sincronizado em Nuvem',
    description: 'Suas fichas seguras e acessíveis em qualquer dispositivo',
  },
  {
    symbol: '👹',
    title: 'Monstros e NPCs',
    description: 'Crie fichas completas de criaturas para sua campanha',
  },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.eyeButton}
      onClick={onToggle}
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {visible ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, emailVerified, loginWithGoogle, loginWithEmail, sendPasswordReset } = useAuth()

  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate(emailVerified ? '/' : '/verificar-email', { replace: true })
    }
  }, [loading, user, emailVerified, navigate])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await loginWithEmail(email, password, keepLoggedIn)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true)
    setError(null)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar com Google.')
      setIsSubmitting(false)
    }
  }

  async function handlePasswordReset(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Informe seu e-mail.'); return }
    setIsSubmitting(true)
    setError(null)
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className={styles.page}>
      <ThemeToggle className={styles.themeFloat} />

      {/* Coluna esquerda: branding */}
      <aside className={styles.branding} aria-hidden="true">
        <div className={styles.brandingInner}>
          <img src={BRAND_LOGO_URL} alt="Logo do Tomo do Aventureiro" className={styles.brandIcon} />
          <h1 className={styles.brandTitle}>Tomo do Aventureiro</h1>
          <p className={styles.brandSubtitle}>
            Organize seus personagens de histórias, RPGs e narrativas em um só lugar
          </p>

          <ul className={styles.featureList}>
            {FEATURES.map((f) => (
              <li key={f.title} className={styles.featureItem}>
                <span className={styles.featureSymbol}>{f.symbol}</span>
                <div>
                  <strong className={styles.featureName}>{f.title}</strong>
                  <p className={styles.featureDesc}>{f.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className={styles.tagline}>
            ✦ Perfeito para jogadores, mestres e criadores de histórias ✦
          </p>
        </div>
      </aside>

      {/* Coluna direita: formulário */}
      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <header className={styles.cardHeader}>
            <span className={styles.cardIcon} aria-hidden="true">⚔️</span>
            <h2 className={styles.cardTitle}>Tomo do Aventureiro</h2>
            <p className={styles.cardSubtitle}>
              {mode === 'login' ? 'Faça login para continuar' : 'Recuperar senha'}
            </p>
          </header>

          {mode === 'login' ? (
            <form className={styles.form} onSubmit={handleLogin} noValidate>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="login-email">E-mail</label>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="login-password">Senha</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${styles.inputWithEye}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <EyeToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                </div>
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                />
                <span>Manter conectado</span>
              </label>

              {error && <p className={styles.errorMsg} role="alert">{error}</p>}

              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : '→ Entrar'}
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handlePasswordReset} noValidate>
              {resetSent ? (
                <div className={styles.successBox}>
                  <p>E-mail enviado para <strong>{email}</strong>. Verifique sua caixa de entrada e siga as instruções.</p>
                </div>
              ) : (
                <>
                  <p className={styles.resetHint}>
                    Informe seu e-mail para receber um link de recuperação de senha.
                  </p>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="reset-email">E-mail</label>
                    <input
                      id="reset-email"
                      type="email"
                      className={styles.input}
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {error && <p className={styles.errorMsg} role="alert">{error}</p>}
                  <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </>
              )}
            </form>
          )}

          <div className={styles.divider}>
            <span className={styles.dividerText}>ou continue com</span>
          </div>

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <GoogleIcon />
            Entrar com Google
          </button>

          <div className={styles.authLinks}>
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => { setMode('reset'); setError(null); setResetSent(false) }}
                >
                  🔑 Esqueceu sua senha?
                </button>
                <Link to="/cadastro" className={styles.textLink}>
                  👤 Criar nova conta
                </Link>
              </>
            ) : (
              <button
                type="button"
                className={styles.textLink}
                onClick={() => { setMode('login'); setError(null); setResetSent(false) }}
              >
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          © 2025 Tomo do Aventureiro — Todos os direitos reservados
        </footer>
      </div>
    </div>
  )
}
