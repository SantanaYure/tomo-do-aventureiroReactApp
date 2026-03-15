import { UserMenu } from '../UserMenu/UserMenu'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <UserMenu />
      </div>
    </header>
  )
}
