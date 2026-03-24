import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './firebase'

const googleAuthProvider = new GoogleAuthProvider()
googleAuthProvider.setCustomParameters({ prompt: 'select_account' })

export function getFirebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    switch ((error as { code: string }).code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado.'
      case 'auth/invalid-email':
        return 'E-mail inválido.'
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde alguns minutos.'
      case 'auth/popup-closed-by-user':
        return 'Login com Google cancelado.'
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet.'
      case 'auth/user-disabled':
        return 'Esta conta foi desativada.'
    }
  }
  if (error instanceof Error && error.message) return error.message
  return 'Ocorreu um erro inesperado.'
}

function normalizeError(error: unknown, fallback: string): Error {
  return new Error(getFirebaseErrorMessage(error) || fallback)
}

export async function loginWithGoogle(): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, googleAuthProvider)
  } catch (error) {
    throw normalizeError(error, 'Não foi possível entrar com Google.')
  }
}

export async function registerWithEmailAndPassword(
  name: string,
  surname: string,
  email: string,
  password: string,
): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, {
      displayName: `${name.trim()} ${surname.trim()}`.trim(),
    })
    await sendEmailVerification(credential.user)
    return credential
  } catch (error) {
    throw normalizeError(error, 'Não foi possível criar a conta.')
  }
}

export async function loginWithEmailAndPassword(
  email: string,
  password: string,
  keepLoggedIn: boolean,
): Promise<UserCredential> {
  try {
    await setPersistence(
      auth,
      keepLoggedIn ? browserLocalPersistence : browserSessionPersistence,
    )
    return await firebaseSignInWithEmail(auth, email, password)
  } catch (error) {
    throw normalizeError(error, 'Não foi possível entrar.')
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Nenhum usuário autenticado.')
  try {
    await sendEmailVerification(user)
  } catch (error) {
    throw normalizeError(error, 'Não foi possível reenviar o e-mail.')
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw normalizeError(error, 'Não foi possível enviar o e-mail de recuperação.')
  }
}
