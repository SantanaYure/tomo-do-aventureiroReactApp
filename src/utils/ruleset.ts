// Preferência de conjunto de regras (D&D 5E 2014 / D&D 5.5 2024 / Ambos),
// usada para filtrar conteúdo importado do SRD (monstros, e no futuro
// magias e itens). Persiste em localStorage e segue o mesmo padrão de
// src/utils/appearance.ts.

import type { Ruleset } from '../types/system/dnd/Ruleset'

export const RULESET_KEY = 'tomo:ruleset'

export const RULESET_LABELS: Record<Ruleset, string> = {
  '2014': 'D&D 5E (2014)',
  '2024': 'D&D 5.5 (2024)',
  all: 'Ambos',
}

export const RULESET_ORDER: Ruleset[] = ['2014', '2024', 'all']

function isRuleset(value: unknown): value is Ruleset {
  return value === '2014' || value === '2024' || value === 'all'
}

export function readStoredRuleset(): Ruleset {
  try {
    const stored = localStorage.getItem(RULESET_KEY)
    if (isRuleset(stored)) return stored
  } catch {
    /* localStorage indisponível — cai no padrão */
  }
  return 'all'
}

/** Um item de conteúdo do SRD é visível se a preferência for 'all' ou igual ao seu ruleset. */
export function matchesRuleset(preference: Ruleset, itemRuleset: Exclude<Ruleset, 'all'>): boolean {
  return preference === 'all' || preference === itemRuleset
}
