import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuth } from '../../context/AuthContext'
import { BRAND_LOGO_URL } from '../../assets/brandLogo'
import { UserAvatar } from '../UserAvatar/UserAvatar'
import { SettingsModal } from '../SettingsModal/SettingsModal'
import styles from './Sidebar.module.css'

interface NavItem {
  to: string
  label: string
  icon: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: '⌂', exact: true },
  { to: '/fichas', label: 'Fichas', icon: '⚔' },
]

export function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

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

        {/* Configurações — foto (provedor → e-mail → inicial) + rótulo */}
        {user && (
          <button
            type="button"
            className={styles.settingsButton}
            onClick={() => setSettingsOpen(true)}
            aria-haspopup="dialog"
          >
            <UserAvatar
              photoURL={user.photoURL}
              email={user.email}
              displayName={user.displayName}
            />
            <span className={styles.settingsLabel}>Configurações</span>
          </button>
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
                onClick={() => setSettingsOpen(true)}
                aria-haspopup="dialog"
              >
                <span className={styles.bottomIcon} aria-hidden="true">⚙</span>
                <span className={styles.bottomLabel}>Ajustes</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {user && settingsOpen && (
        <SettingsModal
          displayName={user.displayName}
          email={user.email}
          photoURL={user.photoURL}
          onLogout={() => {
            setSettingsOpen(false)
            handleLogout()
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
