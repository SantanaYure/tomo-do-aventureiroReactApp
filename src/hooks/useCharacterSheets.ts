import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeCharacterSheet,
  type StoredCharacterSheet,
} from '../store/characterSheetStore'

export function useCharacterSheets(uid: string | null): {
  sheets: StoredCharacterSheet[]
  loading: boolean
  error: Error | null
} {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setSheets([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', uid, 'characterSheets')
    const q = query(ref, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: StoredCharacterSheet[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data()
          return {
            id: docSnap.id,
            data: normalizeCharacterSheet(raw.data ?? {}),
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
          }
        })
        setSheets(results)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  return { sheets, loading, error }
}
