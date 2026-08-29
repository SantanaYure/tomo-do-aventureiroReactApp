// Aparência do usuário além do tema: cor de marca e tipografia.
//
// A cor de marca sobrescreve, em runtime, os tokens de destaque
// (--chip-violet-*, e por consequência --accent) via `color-mix`, para todos os
// temas. A tipografia "moderna" troca display + corpo por uma sans neutra.
// Ambas persistem em localStorage e são reaplicadas no primeiro paint por um
// script inline em index.html (anti-flash) — manter as duas cópias em sincronia.

export type FontChoice = 'literary' | 'modern'

export const BRAND_COLOR_KEY = 'tomo:brand-color'
export const FONT_KEY = 'tomo:font'

/** Sans neutra para o modo "Moderna" — mesma família do --font-body atual. */
export const SANS_STACK =
  "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

/** Presets de cor de marca — legíveis sobre fundo claro e escuro. */
export const BRAND_PRESETS = [
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22a06b' },
  { name: 'Âmbar', value: '#e0913a' },
  { name: 'Rosa', value: '#f43f5e' },
] as const

/** Tokens de destaque derivados da cor de marca. */
export function brandTokens(color: string): Record<string, string> {
  return {
    '--brand': color,
    '--chip-violet-text': color,
    '--chip-violet-bg': `color-mix(in oklab, ${color} 16%, transparent)`,
    '--chip-violet-bg-hover': `color-mix(in oklab, ${color} 26%, transparent)`,
    '--chip-violet-border': `color-mix(in oklab, ${color} 42%, transparent)`,
  }
}

const BRAND_PROPS = Object.keys(brandTokens('#000'))

/** Aceita hex (#rgb/#rrggbb/#rrggbbaa), rgb() e rgba(). */
export function isValidColor(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', v)
  }
  // Fallback p/ ambientes sem CSS.supports (ex.: jsdom antigo).
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ||
    /^rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+\s*([/,]\s*[\d.]+%?\s*)?\)$/i.test(v)
}

/** Reduz qualquer cor válida a `#rrggbb` (para o <input type="color">). */
export function toHex(value: string): string {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase()
  }
  if (/^#[0-9a-f]{8}$/i.test(v)) return v.slice(0, 7).toLowerCase()
  const m = v.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  if (m) {
    const h = (n: string) => Math.max(0, Math.min(255, +n)).toString(16).padStart(2, '0')
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`
  }
  return '#8b5cf6'
}

/**
 * Aplica cor de marca e tipografia no elemento raiz. `brandColor` nulo/​vazio
 * volta ao destaque padrão do tema; `font` 'literary' remove os overrides.
 */
export function applyAppearance(
  root: HTMLElement,
  brandColor: string | null,
  font: FontChoice,
): void {
  if (brandColor && isValidColor(brandColor)) {
    const tokens = brandTokens(brandColor)
    for (const [prop, val] of Object.entries(tokens)) root.style.setProperty(prop, val)
  } else {
    for (const prop of BRAND_PROPS) root.style.removeProperty(prop)
  }

  if (font === 'modern') {
    root.style.setProperty('--font-display', SANS_STACK)
    root.style.setProperty('--font-body', SANS_STACK)
  } else {
    root.style.removeProperty('--font-display')
    root.style.removeProperty('--font-body')
  }
}

export function readStoredBrandColor(): string | null {
  try {
    const v = localStorage.getItem(BRAND_COLOR_KEY)
    return v && isValidColor(v) ? v : null
  } catch {
    return null
  }
}

export function readStoredFont(): FontChoice {
  try {
    return localStorage.getItem(FONT_KEY) === 'modern' ? 'modern' : 'literary'
  } catch {
    return 'literary'
  }
}
