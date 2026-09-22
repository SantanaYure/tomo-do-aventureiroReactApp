import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Ruleset } from '../types/system/dnd/Ruleset'
import { RULESET_KEY, readStoredRuleset } from '../utils/ruleset'

interface RulesetContextValue {
  /** Preferência global de conjunto de regras do usuário. */
  ruleset: Ruleset
  setRuleset: (ruleset: Ruleset) => void
}

const RulesetContext = createContext<RulesetContextValue | null>(null)

export function RulesetProvider({ children }: { children: ReactNode }) {
  const [ruleset, setRulesetState] = useState<Ruleset>(readStoredRuleset)

  useEffect(() => {
    try {
      localStorage.setItem(RULESET_KEY, ruleset)
    } catch {
      /* persistência indisponível — a preferência ainda vale para esta sessão */
    }
  }, [ruleset])

  const setRuleset = useCallback((next: Ruleset) => setRulesetState(next), [])

  const value = useMemo<RulesetContextValue>(
    () => ({ ruleset, setRuleset }),
    [ruleset, setRuleset],
  )

  return <RulesetContext.Provider value={value}>{children}</RulesetContext.Provider>
}

export function useRuleset(): RulesetContextValue {
  const ctx = useContext(RulesetContext)
  if (!ctx) throw new Error('useRuleset deve ser usado dentro de <RulesetProvider>')
  return ctx
}
