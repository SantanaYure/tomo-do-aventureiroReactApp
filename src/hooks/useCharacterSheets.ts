import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeCharacterSheet,
  type StoredCharacterSheet,
} from '../store/characterSheetStore'

export function useCharacterSheets(uid: string | null): StoredCharacterSheet[] {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])

  useEffect(() => {
    if (!uid) {
      setSheets([])
      return
    }

    const ref = collection(db, 'users', uid, 'characterSheets')
    const q = query(ref, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    })

    return unsubscribe
  }, [uid])

  return sheets
}
