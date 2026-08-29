import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BRAND_COLOR_KEY,
  FONT_KEY,
  applyAppearance,
  isValidColor,
  readStoredBrandColor,
  readStoredFont,
  type FontChoice,
} from '../utils/appearance'

export type ThemeMode = 'light' | 'dark' | 'parchment'
export type { FontChoice }

/** Ordem do ciclo do botão de alternância. */
export const THEME_ORDER: ThemeMode[] = ['light', 'dark', 'parchment']

const STORAGE_KEY = 'tomo:theme'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'parchment'
}

interface ThemeContextValue {
  mode: ThemeMode
  /** Avança para o próximo tema no ciclo (claro → escuro → pergaminho → claro). */
  toggle: () => void
  setMode: (mode: ThemeMode) => void
  /** Cor de marca do usuário; `null` = destaque padrão do tema. */
  brandColor: string | null
  setBrandColor: (color: string | null) => void
  /** 'literary' = Cinzel + corpo do tema; 'modern' = sans neutra em tudo. */
  fontChoice: FontChoice
  setFontChoice: (font: FontChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeMode(stored)) return stored
  } catch {
    /* localStorage indisponível — cai no prefers-color-scheme */
  }
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* matchMedia indisponível */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode)
  const [brandColor, setBrandColorState] = useState<string | null>(readStoredBrandColor)
  const [fontChoice, setFontChoiceState] = useState<FontChoice>(readStoredFont)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* persistência indisponível — o tema ainda vale para esta sessão */
    }
  }, [mode])

  useEffect(() => {
    applyAppearance(document.documentElement, brandColor, fontChoice)
    try {
      if (brandColor) localStorage.setItem(BRAND_COLOR_KEY, brandColor)
      else localStorage.removeItem(BRAND_COLOR_KEY)
      localStorage.setItem(FONT_KEY, fontChoice)
    } catch {
      /* persistência indisponível */
    }
  }, [brandColor, fontChoice])

  const setMode = useCallback((next: ThemeMode) => setModeState(next), [])
  const toggle = useCallback(
    () =>
      setModeState((current) => {
        const i = THEME_ORDER.indexOf(current)
        return THEME_ORDER[(i + 1) % THEME_ORDER.length]
      }),
    [],
  )
  const setBrandColor = useCallback((color: string | null) => {
    setBrandColorState(color && isValidColor(color) ? color : null)
  }, [])
  const setFontChoice = useCallback((font: FontChoice) => setFontChoiceState(font), [])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, toggle, setMode, brandColor, setBrandColor, fontChoice, setFontChoice }),
    [mode, toggle, setMode, brandColor, setBrandColor, fontChoice, setFontChoice],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}
