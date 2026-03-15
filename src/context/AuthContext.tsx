import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { loginWithGoogle as loginWithGoogleService } from '../services/authService'

type AuthContextValue = {
    user: User | null
    loading: boolean
    loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeAuthError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
        return error
    }

    return new Error(fallbackMessage)
}

type AuthProviderProps = {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (nextUser) => {
                setUser(nextUser)
                setLoading(false)
            },
            () => {
                setUser(null)
                setLoading(false)
            },
        )

        return unsubscribe
    }, [])

    async function loginWithGoogle(): Promise<void> {
        try {
            await loginWithGoogleService()
        } catch (error) {
            throw normalizeAuthError(error, 'Nao foi possivel autenticar com Google.')
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider.')
    }

    return context
}