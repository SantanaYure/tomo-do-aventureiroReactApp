import { GoogleAuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth'
import { auth } from './firebase'

const googleAuthProvider = new GoogleAuthProvider()

googleAuthProvider.setCustomParameters({ prompt: 'select_account' })

function normalizeAuthError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error) {
        return error
    }

    return new Error(fallbackMessage)
}

export async function loginWithGoogle(): Promise<UserCredential> {
    try {
        return await signInWithPopup(auth, googleAuthProvider)
    } catch (error) {
        throw normalizeAuthError(error, 'Nao foi possivel entrar com Google.')
    }
}