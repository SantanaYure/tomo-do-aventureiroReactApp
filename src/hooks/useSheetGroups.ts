import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import { normalizeSheetGroup } from '../store/sheetGroupsStore'
import type { SheetGroup } from '../types/system/dnd/SheetGroup'

export function useSheetGroups(uid: string | null): {
  groups: SheetGroup[]
  isLoading: boolean
  error: Error | null
} {
  const [groups, setGroups] = useState<SheetGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setGroups([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const ref = collection(db, 'users', uid, 'sheetGroups')
    const q = query(ref, orderBy('name', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((docSnap) =>
          normalizeSheetGroup(docSnap.data(), docSnap.id, uid),
        )
        setGroups(results)
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  return { groups, isLoading, error }
}
