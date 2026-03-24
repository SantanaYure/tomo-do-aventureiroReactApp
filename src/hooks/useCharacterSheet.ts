import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { doc } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeCharacterSheet,
  type StoredCharacterSheet,
} from '../store/characterSheetStore'

type Status = 'loading' | 'found' | 'not-found'

export function useCharacterSheet(
  uid: string | null,
  id: string | null,
): { sheet: StoredCharacterSheet | null; status: Status } {
  const [sheet, setSheet] = useState<StoredCharacterSheet | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!uid || !id) {
      setSheet(null)
      setStatus('not-found')
      return
    }

    setStatus('loading')

    const docRef = doc(db, 'users', uid, 'characterSheets', id)

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        setSheet(null)
        setStatus('not-found')
        return
      }

      const raw = docSnap.data()
      setSheet({
        id: docSnap.id,
        data: normalizeCharacterSheet(raw.data ?? {}),
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      })
      setStatus('found')
    })

    return unsubscribe
  }, [uid, id])

  return { sheet, status }
}
