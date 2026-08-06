import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { resolveSheetTimestamps } from './resolveSheetTimestamps'
import {
  normalizeCharacterSheet,
  type StoredCharacterSheet,
} from '../store/characterSheetStore'

export function useCharacterSheet(
  uid: string | null,
  id: string | null,
): {
  sheet: StoredCharacterSheet | null
  loading: boolean
  notFound: boolean
  error: Error | null
} {
  const [sheet, setSheet] = useState<StoredCharacterSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid || !id) {
      setSheet(null)
      setLoading(false)
      setNotFound(true)
      return
    }

    setLoading(true)
    setNotFound(false)
    setError(null)

    const docRef = doc(db, 'users', uid, 'characterSheets', id)

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setSheet(null)
          setNotFound(true)
        } else {
          const raw = docSnap.data()
          setSheet({
            id: docSnap.id,
            data: normalizeCharacterSheet(raw.data ?? {}),
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
  }, [uid, id])

  return { sheet, loading, notFound, error }
}
