import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { BRAND_LOGO_URL } from '../../assets/brandLogo'
import styles from './Sidebar.module.css'

interface NavItem {
  to: string
  label: string
  icon: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: '⌂', exact: true },
  { to: '/fichas', label: 'Personagens', icon: '⚔' },
]

function UserAvatar({ photoURL, displayName }: { photoURL: string | null; displayName: string | null }) {
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.avatarWrapper} aria-hidden="true">
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName ?? 'avatar'}
          className={styles.avatarImg}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={styles.avatarFallback}>{initial}</div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Erro ao sair:', err)
    }
  }

  return (
    <>
      {/* Desktop: barra lateral */}
      <aside className={styles.sidebar} aria-label="Navegação principal">
        {/* Logo */}
        <div className={styles.logoArea}>
          <img src={BRAND_LOGO_URL} alt="Logo do Tomo do Aventureiro" className={styles.logoIcon} />
          <span className={styles.logoText}>Tomo do Aventureiro</span>
        </div>

        <div className={styles.ornamentLine} aria-hidden="true" />

        {/* Navegação */}
        <nav className={styles.nav} aria-label="Menu">
          <ul className={styles.navList} role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.spacer} />

        <div className={styles.ornamentLine} aria-hidden="true" />

        {/* Usuário */}
        {user && (
          <div className={styles.userArea}>
            <div className={styles.userInfo}>
              <UserAvatar photoURL={user.photoURL} displayName={user.displayName} />
              <div className={styles.userText}>
                <span className={styles.userName}>
                  {user.displayName ?? 'Aventureiro'}
                </span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Sair do sistema"
            >
              <span className={styles.logoutIcon} aria-hidden="true">⇥</span>
              <span>Sair do sistema</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile: barra inferior */}
      <nav className={styles.bottomBar} aria-label="Navegação principal">
        <ul className={styles.bottomList} role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className={styles.bottomItem}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `${styles.bottomLink} ${isActive ? styles.bottomLinkActive : ''}`
                }
              >
                <span className={styles.bottomIcon} aria-hidden="true">{item.icon}</span>
                <span className={styles.bottomLabel}>{item.label}</span>
              </NavLink>
            </li>
          ))}

          {user && (
            <li className={styles.bottomItem}>
              <button
                type="button"
                className={styles.bottomLink}
                onClick={handleLogout}
                aria-label="Sair do sistema"
              >
                <span className={styles.bottomIcon} aria-hidden="true">⇥</span>
                <span className={styles.bottomLabel}>Sair</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  )
}
