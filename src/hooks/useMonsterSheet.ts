import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { resolveSheetTimestamps } from './resolveSheetTimestamps'
import {
  normalizeMonsterSheet,
  type StoredMonsterSheet,
} from '../store/monsterSheetStore'

export function useMonsterSheet(
  uid: string | null,
  id: string | null,
  ownerUid?: string | null,
): {
  monster: StoredMonsterSheet | null
  loading: boolean
  notFound: boolean
  error: Error | null
} {
  const [monster, setMonster] = useState<StoredMonsterSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const effectiveUid = ownerUid || uid
    if (!effectiveUid || !id) {
      setMonster(null)
      setLoading(false)
      setNotFound(true)
      return
    }

    setLoading(true)
    setNotFound(false)
    setError(null)

    const docRef = doc(db, 'users', effectiveUid, 'monsterSheets', id)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setMonster(null)
          setNotFound(true)
        } else {
          const raw = docSnap.data()
          setMonster({
            id: docSnap.id,
            data: normalizeMonsterSheet(raw.data ?? {}),
            ...resolveSheetTimestamps(raw.createdAt, raw.updatedAt),
          })
          setNotFound(false)
        }
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [uid, id, ownerUid])

  return { monster, loading, notFound, error }
}
