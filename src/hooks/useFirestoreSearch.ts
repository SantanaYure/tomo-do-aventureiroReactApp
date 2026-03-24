import { useEffect, useRef, useState } from 'react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import { normalizeCharacterSheet, type StoredCharacterSheet } from '../store/characterSheetStore'
import { normalizeMonsterSheet, type StoredMonsterSheet } from '../store/monsterSheetStore'

export interface FirestoreSearchResult {
  characters: StoredCharacterSheet[]
  monsters: StoredMonsterSheet[]
  /** true enquanto o debounce está pendente OU a query está em andamento */
  isSearching: boolean
  searchError: Error | null
  retrySearch: () => void
}

const DEBOUNCE_MS = 300
const RESULTS_LIMIT = 20

export function useFirestoreSearch(uid: string | null, rawTerm: string): FirestoreSearchResult {
  // ── Estado da busca ──────────────────────────────────────────────────────
  const [characters, setCharacters] = useState<StoredCharacterSheet[]>([])
  const [monsters, setMonsters] = useState<StoredMonsterSheet[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<Error | null>(null)

  // ── Controle de corrida ──────────────────────────────────────────────────
  // Cada query recebe um ID; respostas cujo ID não bate com o atual são descartadas
  const requestIdRef = useRef(0)

  // ── Term debounced ───────────────────────────────────────────────────────
  const [debouncedTerm, setDebouncedTerm] = useState('')

  useEffect(() => {
    const normalized = rawTerm.trim().toLowerCase()

    if (normalized === debouncedTerm) return

    // Enquanto o debounce está pendente, sinaliza busca em andamento
    if (normalized) setIsSearching(true)

    const timerId = setTimeout(() => setDebouncedTerm(normalized), DEBOUNCE_MS)
    return () => clearTimeout(timerId)
  }, [rawTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Executor da query ────────────────────────────────────────────────────
  // Separado para permitir retry sem alterar debouncedTerm
  const runQuery = (uid: string, term: string) => {
    const currentId = ++requestIdRef.current

    setIsSearching(true)
    setSearchError(null)

    const termEnd = term + '\uf8ff'

    const charQ = query(
      collection(db, 'users', uid, 'characterSheets'),
      orderBy('name_lower'),
      where('name_lower', '>=', term),
      where('name_lower', '<=', termEnd),
      limit(RESULTS_LIMIT),
    )

    const monsterQ = query(
      collection(db, 'users', uid, 'monsterSheets'),
      orderBy('name_lower'),
      where('name_lower', '>=', term),
      where('name_lower', '<=', termEnd),
      limit(RESULTS_LIMIT),
    )

    Promise.all([getDocs(charQ), getDocs(monsterQ)])
      .then(([charSnap, monsterSnap]) => {
        // Descarta resposta obsoleta (condição de corrida)
        if (currentId !== requestIdRef.current) return

        setCharacters(
          charSnap.docs.map((doc) => {
            const raw = doc.data()
            return {
              id: doc.id,
              data: normalizeCharacterSheet(raw.data ?? {}),
              createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
              updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
            }
          }),
        )

        setMonsters(
          monsterSnap.docs.map((doc) => {
            const raw = doc.data()
            return {
              id: doc.id,
              data: normalizeMonsterSheet(raw.data ?? {}),
              createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
              updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
            }
          }),
        )

        setIsSearching(false)
      })
      .catch((err) => {
        if (currentId !== requestIdRef.current) return
        setSearchError(err instanceof Error ? err : new Error(String(err)))
        setIsSearching(false)
      })
  }

  // ── Dispara query quando o termo debounced muda ──────────────────────────
  useEffect(() => {
    if (!uid || !debouncedTerm) {
      // Limpa resultados quando não há busca ativa
      requestIdRef.current++ // invalida qualquer request em voo
      setCharacters([])
      setMonsters([])
      setIsSearching(false)
      setSearchError(null)
      return
    }

    runQuery(uid, debouncedTerm)
  }, [uid, debouncedTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retry manual ─────────────────────────────────────────────────────────
  function retrySearch() {
    if (!uid || !debouncedTerm) return
    runQuery(uid, debouncedTerm)
  }

  return { characters, monsters, isSearching, searchError, retrySearch }
}
