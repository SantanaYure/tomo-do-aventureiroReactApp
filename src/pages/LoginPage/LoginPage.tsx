import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './LoginPage.module.css'

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return 'Nao foi possivel entrar com Google.'
}

export function LoginPage() {
    const navigate = useNavigate()
    const { user, loading, loginWithGoogle } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && user) {
            navigate('/', { replace: true })
        }
    }, [loading, navigate, user])

    async function handleGoogleLogin() {
        try {
            setIsSubmitting(true)
            setErrorMessage(null)
            await loginWithGoogle()
            // navegação acontece via useEffect quando user for atualizado
        } catch (error) {
            setErrorMessage(getErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <main className={styles.page}>
                <section className={styles.card}>
                    <p className={styles.status}>Verificando autenticacao...</p>
                </section>
            </main>
        )
    }

    if (user) {
        return null
    }

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.eyebrow}>Tomo do Aventureiro</p>
                <h1 className={styles.title}>Acesse sua mesa</h1>
                <p className={styles.description}>
                    Entre com sua conta Google para sincronizar seu progresso e continuar suas fichas.
                </p>

                <button
                    type="button"
                    className={styles.loginButton}
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Entrando...' : 'Entrar com Google'}
                </button>

                {errorMessage ? (
                    <p className={styles.errorMessage} role="alert" aria-live="polite">
                        {errorMessage}
                    </p>
                ) : null}
            </section>
        </main>
    )
}