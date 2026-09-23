import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { CampaignCreature } from '../types/campaign/campaign'

// Cache por sessão: a mesma ficha aparece em várias réplicas e em várias
// renderizações; lê cada ficha uma vez só.
const avatarCache = new Map<string, Promise<string | null>>()

export function creatureAvatarKey(creature: Pick<CampaignCreature, 'ownerId' | 'monsterSheetId'>): string | null {
  return creature.ownerId && creature.monsterSheetId
    ? `${creature.ownerId}/${creature.monsterSheetId}`
    : null
}

function loadAvatar(key: string): Promise<string | null> {
  const cached = avatarCache.get(key)
  if (cached) return cached
  const [ownerId, sheetId] = key.split('/')
  const promise = getDoc(doc(db, 'users', ownerId, 'monsterSheets', sheetId))
    .then((snap) => {
      const avatar = snap.exists() ? (snap.data()?.data?.details?.avatar as unknown) : null
      return typeof avatar === 'string' && avatar ? avatar : null
    })
    .catch(() => {
      // Sem permissão ou offline: mostra o marcador padrão e tenta de novo
      // numa próxima montagem.
      avatarCache.delete(key)
      return null
    })
  avatarCache.set(key, promise)
  return promise
}

/**
 * Avatares das criaturas com ficha, lidos das fichas de monstro/NPC. As
 * criaturas da mesa não guardam imagem em base64 (limite de 1 MB do
 * documento da mesa); a imagem vem da ficha na hora de exibir.
 */
export function useCreatureAvatars(creatures: CampaignCreature[]): Record<string, string | null> {
  const keys = useMemo(() => {
    const unique = new Set<string>()
    for (const creature of creatures) {
      const key = creatureAvatarKey(creature)
      if (key) unique.add(key)
    }
    return [...unique].sort()
  }, [creatures])
  const keysSignature = keys.join('|')

  const [avatars, setAvatars] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all(keys.map(async (key) => [key, await loadAvatar(key)] as const)).then((entries) => {
      if (!cancelled) setAvatars(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
    // keysSignature resume `keys`; evita refazer a busca a cada snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature])

  return avatars
}

/** Só para testes: limpa o cache entre casos. */
export function __resetCreatureAvatarCache() {
  avatarCache.clear()
}
