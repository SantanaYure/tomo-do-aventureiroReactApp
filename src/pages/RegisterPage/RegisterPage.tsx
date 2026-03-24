import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal/PrivacyPolicyModal'
import styles from './RegisterPage.module.css'

interface PasswordChecks {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password),
  }
}

function getStrength(checks: PasswordChecks): 'fraca' | 'media' | 'forte' {
  const passed = Object.values(checks).filter(Boolean).length
  if (passed <= 2) return 'fraca'
  if (passed <= 4) return 'media'
  return 'forte'
}

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
    <button type="button" className={styles.eyeButton} onClick={onToggle} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>
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

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerWithEmail, loginWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordChecks = checkPassword(password)
  const strength = password.length > 0 ? getStrength(passwordChecks) : null
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!termsAccepted) { setError('Aceite os Termos de Uso para continuar.'); return }
    if (!passwordsMatch) { setError('As senhas não coincidem.'); return }
    if (strength === 'fraca') { setError('A senha é muito fraca. Adicione mais variações.'); return }

    setIsSubmitting(true)
    setError(null)
    try {
      await registerWithEmail(name, surname, email, password)
      navigate('/verificar-email', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
      setIsSubmitting(false)
    }
  }

  async function handleGoogleRegister() {
    setIsSubmitting(true)
    setError(null)
    try {
      await loginWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar com Google.')
      setIsSubmitting(false)
    }
  }

  const CHECK_LABELS: Record<keyof PasswordChecks, string> = {
    length: '8 caracteres mínimo',
    uppercase: 'Letra maiúscula',
    lowercase: 'Letra minúscula',
    number: 'Número',
    special: 'Caractere especial',
  }

  const strengthLabel = strength === 'fraca' ? 'Fraca' : strength === 'media' ? 'Média' : 'Forte'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <span className={styles.cardIcon} aria-hidden="true">👤</span>
          <h1 className={styles.cardTitle}>Criar Conta</h1>
          <p className={styles.cardSubtitle}>Junte-se aos aventureiros</p>
        </header>

        <form className={styles.form} onSubmit={handleRegister} noValidate>
          <div className={styles.nameRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-name">Nome</label>
              <input
                id="reg-name"
                type="text"
                className={styles.input}
                placeholder="Seu primeiro nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="reg-surname">Sobrenome</label>
              <input
                id="reg-surname"
                type="text"
                className={styles.input}
                placeholder="Seu sobrenome"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
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
            <label className={styles.label} htmlFor="reg-password">Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputWithEye}`}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <EyeToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </div>

            {strength && (
              <div className={styles.strengthWrapper}>
                <div className={styles.strengthBar}>
                  <div className={`${styles.strengthFill} ${styles[`strength_${strength}`]}`} />
                </div>
                <span className={`${styles.strengthLabel} ${styles[`strength_${strength}`]}`}>
                  {strengthLabel}
                </span>
              </div>
            )}

            {password.length > 0 && (
              <ul className={styles.checkList}>
                {(Object.keys(CHECK_LABELS) as (keyof PasswordChecks)[]).map((key) => (
                  <li key={key} className={`${styles.checkItem} ${passwordChecks[key] ? styles.checkPassed : styles.checkFailed}`}>
                    <span aria-hidden="true">{passwordChecks[key] ? '✓' : '✗'}</span>
                    {CHECK_LABELS[key]}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reg-confirm">Confirmar Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputWithEye} ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? styles.inputValid
                      : styles.inputInvalid
                    : ''
                }`}
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <EyeToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className={styles.fieldError}>As senhas não coincidem.</p>
            )}
          </div>

          <label className={styles.termsLabel}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              Eu aceito os{' '}
              <button
                type="button"
                className={styles.termsLink}
                onClick={() => setIsPolicyModalOpen(true)}
              >
                Termos de Uso e Política de Privacidade
              </button>
            </span>
          </label>

          {error && <p className={styles.errorMsg} role="alert">{error}</p>}

          <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta...' : '👤 Criar Conta'}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>ou cadastre-se com</span>
        </div>

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleRegister}
          disabled={isSubmitting}
        >
          <GoogleIcon />
          Entrar com Google
        </button>

        <p className={styles.loginLink}>
          Já tem uma conta?{' '}
          <Link to="/login" className={styles.textLink}>Faça login</Link>
        </p>
      </div>

      <footer className={styles.footer}>
        © 2025 Tomo do Aventureiro — Todos os direitos reservados
      </footer>

      {isPolicyModalOpen && (
        <PrivacyPolicyModal
          onAccept={() => setTermsAccepted(true)}
          onClose={() => setIsPolicyModalOpen(false)}
        />
      )}
    </div>
  )
}
