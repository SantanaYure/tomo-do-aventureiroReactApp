import { useEffect, useId, useState, type CSSProperties } from 'react'
import { Moon, ScrollText, Sun } from 'lucide-react'
import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import { BRAND_PRESETS, isValidColor, toHex } from '../../utils/appearance'
import styles from './AppearancePanel.module.css'

const THEME_META: Record<ThemeMode, { label: string; Icon: typeof Sun }> = {
  light: { label: 'Claro', Icon: Sun },
  parchment: { label: 'Pergaminho', Icon: ScrollText },
  dark: { label: 'Escuro', Icon: Moon },
}

const THEME_BUTTONS: ThemeMode[] = ['light', 'parchment', 'dark']

export function AppearancePanel() {
  const { mode, setMode, brandColor, setBrandColor, fontChoice, setFontChoice } = useTheme()
  const colorInputId = useId()
  const [draft, setDraft] = useState(brandColor ?? '')
  const draftInvalid = draft.trim() !== '' && !isValidColor(draft)

  // Mantém o campo de texto em sincronia quando a cor muda por outro caminho
  // (preset, caixa de cores, reset).
  useEffect(() => {
    setDraft(brandColor ?? '')
  }, [brandColor])

  function commitDraft(value: string) {
    setDraft(value)
    const trimmed = value.trim()
    if (trimmed === '') setBrandColor(null)
    else if (isValidColor(trimmed)) setBrandColor(trimmed)
  }

  const effectiveHex = toHex(brandColor ?? '#8b5cf6')
  const activePreset = BRAND_PRESETS.find(
    (p) => brandColor && p.value.toLowerCase() === brandColor.toLowerCase(),
  )

  return (
    <section className={styles.panel} aria-label="Aparência">
      <p className={styles.eyebrow}>Aparência</p>

      {/* ── Tema ── */}
      <div className={styles.group} role="group" aria-label="Tema">
        <span className={styles.groupLabel}>Tema</span>
        <div className={styles.themeRow}>
          {THEME_BUTTONS.map((theme) => {
            const { label, Icon } = THEME_META[theme]
            const selected = mode === theme
            return (
              <button
                key={theme}
                type="button"
                className={`${styles.themeBtn} ${selected ? styles.selected : ''}`}
                aria-pressed={selected}
                onClick={() => setMode(theme)}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Cor de marca ── */}
      <div className={styles.group} role="group" aria-label="Cor de marca">
        <span className={styles.groupLabel}>Cor de marca</span>
        <div className={styles.swatchRow}>
          <button
            type="button"
            className={`${styles.resetSwatch} ${brandColor === null ? styles.selected : ''}`}
            aria-pressed={brandColor === null}
            onClick={() => setBrandColor(null)}
          >
            Padrão
          </button>
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`${styles.swatch} ${activePreset?.value === preset.value ? styles.selected : ''}`}
              style={{ '--sw': preset.value } as CSSProperties}
              aria-label={preset.name}
              aria-pressed={activePreset?.value === preset.value}
              onClick={() => setBrandColor(preset.value)}
            />
          ))}
          <label className={styles.pickerSwatch} htmlFor={colorInputId}>
            <span
              className={styles.pickerDot}
              style={{ '--sw': effectiveHex } as CSSProperties}
              aria-hidden="true"
            />
            <input
              id={colorInputId}
              type="color"
              className={styles.colorInput}
              value={effectiveHex}
              onChange={(e) => setBrandColor(e.target.value)}
              aria-label="Escolher cor personalizada"
            />
          </label>
        </div>
        <input
          type="text"
          className={`${styles.hexInput} ${draftInvalid ? styles.invalid : ''}`}
          value={draft}
          placeholder="#8b5cf6, rgb(139 92 246) ou rgba(...)"
          spellCheck={false}
          autoComplete="off"
          aria-label="Cor de marca em hexadecimal, rgb ou rgba"
          aria-invalid={draftInvalid}
          onChange={(e) => commitDraft(e.target.value)}
        />
      </div>

      {/* ── Tipografia ── */}
      <div className={styles.group} role="group" aria-label="Tipografia">
        <span className={styles.groupLabel}>Tipografia</span>
        <div className={styles.typoRow}>
          <button
            type="button"
            className={`${styles.typoBtn} ${fontChoice === 'literary' ? styles.selected : ''}`}
            aria-pressed={fontChoice === 'literary'}
            onClick={() => setFontChoice('literary')}
          >
            <span className={styles.typoSample} data-variant="literary" aria-hidden="true">Aa</span>
            <span className={styles.typoText}>
              <strong>Literária</strong>
              <small>Serifa clássica</small>
            </span>
          </button>
          <button
            type="button"
            className={`${styles.typoBtn} ${fontChoice === 'modern' ? styles.selected : ''}`}
            aria-pressed={fontChoice === 'modern'}
            onClick={() => setFontChoice('modern')}
          >
            <span className={styles.typoSample} data-variant="modern" aria-hidden="true">Aa</span>
            <span className={styles.typoText}>
              <strong>Moderna</strong>
              <small>Sem serifa neutra</small>
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
