import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  normalizeCharacterSheet,
  type StoredCharacterSheet,
} from '../store/characterSheetStore'

export function useCharacterSheets(uid: string | null): {
  sheets: StoredCharacterSheet[]
  isLoading: boolean
  loading: boolean
  error: Error | null
} {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setSheets([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

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

        // Migra documentos sem name_lower (criados antes da Etapa 1)
        const needsMigration = snapshot.docs.filter((d) => typeof d.data().name_lower !== 'string')
        if (needsMigration.length > 0) {
          const batch = writeBatch(db)
          needsMigration.forEach((d) => {
            const raw = d.data()
            const name = normalizeCharacterSheet(raw.data ?? {}).character.name
            batch.update(doc(db, 'users', uid, 'characterSheets', d.id), {
              name_lower: name.trim().toLocaleLowerCase('pt-BR'),
            })
          })
          batch.commit().catch(() => {/* silent — não bloqueia UI */})
        }

        setSheets(results)
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  return { sheets, isLoading, loading: isLoading, error }
}
