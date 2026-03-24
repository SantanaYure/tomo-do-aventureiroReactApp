import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import {
  loginWithGoogle as googleService,
  registerWithEmailAndPassword as registerService,
  loginWithEmailAndPassword as loginEmailService,
  resendVerificationEmail as resendService,
  sendPasswordReset as resetService,
  getFirebaseErrorMessage,
} from '../services/authService'

type AuthContextValue = {
  user: User | null
  uid: string | null
  loading: boolean
  emailVerified: boolean
  loginWithGoogle: () => Promise<void>
  registerWithEmail: (name: string, surname: string, email: string, password: string) => Promise<void>
  loginWithEmail: (email: string, password: string, keepLoggedIn: boolean) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  refreshUser: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function wrapError(error: unknown, fallback: string): Error {
  return new Error(getFirebaseErrorMessage(error) || fallback)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setEmailVerified(nextUser?.emailVerified ?? false)
        setLoading(false)
      },
      () => {
        setUser(null)
        setEmailVerified(false)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const uid = user?.uid ?? null

  async function loginWithGoogle(): Promise<void> {
    try { await googleService() }
    catch (error) { throw wrapError(error, 'Não foi possível autenticar com Google.') }
  }

  async function registerWithEmail(name: string, surname: string, email: string, password: string): Promise<void> {
    try { await registerService(name, surname, email, password) }
    catch (error) { throw wrapError(error, 'Não foi possível criar a conta.') }
  }

  async function loginWithEmail(email: string, password: string, keepLoggedIn: boolean): Promise<void> {
    try { await loginEmailService(email, password, keepLoggedIn) }
    catch (error) { throw wrapError(error, 'Não foi possível entrar.') }
  }

  async function resendVerificationEmail(): Promise<void> {
    try { await resendService() }
    catch (error) { throw wrapError(error, 'Não foi possível reenviar o e-mail.') }
  }

  async function sendPasswordReset(email: string): Promise<void> {
    try { await resetService(email) }
    catch (error) { throw wrapError(error, 'Não foi possível enviar o e-mail de recuperação.') }
  }

  async function refreshUser(): Promise<boolean> {
    if (!auth.currentUser) return false
    await auth.currentUser.reload()
    const verified = auth.currentUser.emailVerified
    setEmailVerified(verified)
    setUser(auth.currentUser)
    return verified
  }

  return (
    <AuthContext.Provider value={{
      user, uid, loading, emailVerified,
      loginWithGoogle, registerWithEmail, loginWithEmail,
      resendVerificationEmail, sendPasswordReset, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
