import { useEffect, useState, useMemo } from 'react'
import { onSnapshot } from 'firebase/firestore'
import {
  getCampaignDoc,
  getMembersCollection,
  normalizeCampaign,
  normalizeCampaignMember,
} from '../store/campaignStore'
import type { Campaign, CampaignMember } from '../types/campaign/campaign'

export function useCampaign(
  campaignId: string | undefined,
  currentUserId: string | null | undefined,
): {
  campaign: Campaign | null
  members: CampaignMember[]
  isDm: boolean
  currentMember: CampaignMember | null
  isLoading: boolean
  error: Error | null
} {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null)
      setMembers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Listener para o documento principal da campanha
    const unsubCampaign = onSnapshot(
      getCampaignDoc(campaignId),
      (docSnap) => {
        if (!docSnap.exists()) {
          setCampaign(null)
          setIsLoading(false)
          return
        }
        setCampaign(normalizeCampaign(docSnap.id, docSnap.data()))
        setIsLoading(false)
      },
      (err) => {
        console.error('Erro ao ouvir campanha:', err)
        setError(err)
        setIsLoading(false)
      },
    )

    // Listener para a subcoleção de membros
    const unsubMembers = onSnapshot(
      getMembersCollection(campaignId),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) =>
          normalizeCampaignMember(docSnap.id, docSnap.data()),
        )
        // Mestre primeiro, depois ordenado por data de entrada
        list.sort((a, b) => {
          if (a.role === 'dm') return -1
          if (b.role === 'dm') return 1
          return a.joinedAt - b.joinedAt
        })
        setMembers(list)
      },
      (err) => {
        console.error('Erro ao ouvir membros da campanha:', err)
      },
    )

    return () => {
      unsubCampaign()
      unsubMembers()
    }
  }, [campaignId])

  const isDm = useMemo(
    () => Boolean(campaign && currentUserId && campaign.dmId === currentUserId),
    [campaign, currentUserId],
  )

  const currentMember = useMemo(
    () => members.find((m) => m.userId === currentUserId) || null,
    [members, currentUserId],
  )

  return {
    campaign,
    members,
    isDm,
    currentMember,
    isLoading,
    error,
  }
}
