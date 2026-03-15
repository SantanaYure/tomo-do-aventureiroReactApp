import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../services/firebase'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const initial = user.displayName?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName ?? 'avatar'}
          className={styles.avatar}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={styles.avatarFallback} aria-hidden="true">
          {initial}
        </div>
      )}
      <span className={styles.name}>{user.displayName}</span>
      <button type="button" className={styles.logoutButton} onClick={handleLogout}>
        Sair
      </button>
    </div>
  )
}
