import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './ProtectedRoute.module.css'

export function ProtectedRoute() {
  const { user, loading, emailVerified } = useAuth()

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <span className={styles.spinner} aria-hidden="true">✦</span>
          <p className={styles.status}>Abrindo o tomo...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!emailVerified) return <Navigate to="/verificar-email" replace />

  return <Outlet />
}
