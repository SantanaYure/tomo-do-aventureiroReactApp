import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import styles from './ThemeToggle.module.css'

// Glifos monocromáticos (não emoji): renderizam na mesma fonte do resto da UI,
// como os ícones da Sidebar (⌂ ⚔ ⇥). Emoji coloridos puxavam uma fonte à parte.
const META: Record<ThemeMode, { icon: string; label: string }> = {
  light: { icon: '☼', label: 'Modo claro' },
  dark: { icon: '☾', label: 'Modo escuro' },
  parchment: { icon: '❧', label: 'Modo pergaminho' },
}

const NEXT: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'parchment',
  parchment: 'light',
}

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme()
  const current = META[mode]
  const next = META[NEXT[mode]]

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ''}`}
      onClick={toggle}
      aria-label={`Tema: ${current.label}. Trocar para ${next.label}.`}
      title={`Trocar para ${next.label}`}
    >
      <span className={styles.icon} aria-hidden="true">{current.icon}</span>
      <span>{current.label}</span>
    </button>
  )
}
