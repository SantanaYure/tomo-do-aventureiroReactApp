import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeMonsterSheet,
  type StoredMonsterSheet,
} from '../store/monsterSheetStore'

export function useMonsterSheets(uid: string | null): {
  monsters: StoredMonsterSheet[]
  loading: boolean
  error: Error | null
} {
  const [monsters, setMonsters] = useState<StoredMonsterSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setMonsters([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'users', uid, 'monsterSheets')
    const q = query(ref, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: StoredMonsterSheet[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data()
          return {
            id: docSnap.id,
            data: normalizeMonsterSheet(raw.data ?? {}),
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
            updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
          }
        })
        setMonsters(results)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  return { monsters, loading, error }
}
