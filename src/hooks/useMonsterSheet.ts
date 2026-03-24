import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeMonsterSheet,
  type StoredMonsterSheet,
} from '../store/monsterSheetStore'

type Status = 'loading' | 'found' | 'not-found'

export function useMonsterSheet(
  uid: string | null,
  id: string | null,
): { monster: StoredMonsterSheet | null; status: Status } {
  const [monster, setMonster] = useState<StoredMonsterSheet | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!uid || !id) {
      setMonster(null)
      setStatus('not-found')
      return
    }

    setStatus('loading')

    const docRef = doc(db, 'users', uid, 'monsterSheets', id)

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        setMonster(null)
        setStatus('not-found')
        return
      }

      const raw = docSnap.data()
      setMonster({
        id: docSnap.id,
        data: normalizeMonsterSheet(raw.data ?? {}),
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      })
      setStatus('found')
    })

    return unsubscribe
  }, [uid, id])

  return { monster, status }
}
