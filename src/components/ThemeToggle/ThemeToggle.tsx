import { useTheme } from '../../context/ThemeContext'
import styles from './ThemeToggle.module.css'

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ''}`}
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Modo escuro' : 'Modo claro'}</span>
    </button>
  )
}
