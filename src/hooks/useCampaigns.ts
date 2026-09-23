import { useEffect, useState, useMemo } from 'react'
import { onSnapshot, query, where } from 'firebase/firestore'
import { getCampaignsCollection, normalizeCampaign } from '../store/campaignStore'
import type { Campaign } from '../types/campaign/campaign'

export function useCampaigns(uid: string | null | undefined): {
  campaigns: Campaign[]
  dmCampaigns: Campaign[]
  playerCampaigns: Campaign[]
  isLoading: boolean
  error: Error | null
} {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!uid) {
      setCampaigns([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Busca todas as campanhas em que o usuário é membro ou DM
    const q = query(
      getCampaignsCollection(),
      where('memberIds', 'array-contains', uid),
      where('archived', '==', false),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) =>
          normalizeCampaign(docSnap.id, docSnap.data()),
        )
        // Ordena por data de atualização decrescente
        list.sort((a, b) => b.updatedAt - a.updatedAt)
        setCampaigns(list)
        setIsLoading(false)
      },
      (err) => {
        console.error('Erro ao ouvir campanhas:', err)
        setError(err)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [uid])

  const dmCampaigns = useMemo(
    () => campaigns.filter((c) => c.dmId === uid),
    [campaigns, uid],
  )

  const playerCampaigns = useMemo(
    () => campaigns.filter((c) => c.dmId !== uid),
    [campaigns, uid],
  )

  return {
    campaigns,
    dmCampaigns,
    playerCampaigns,
    isLoading,
    error,
  }
}
