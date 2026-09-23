import { useEffect, useRef } from 'react'
import { isCampaignLinkStale } from '../store/campaignStore'

interface LinkedSheet {
  campaignId?: string | null
  campaignName?: string | null
}

/**
 * Ao abrir a própria ficha, confere se o vínculo com a mesa ficou órfão (mesa
 * excluída, jogador removido, instância de monstro fora de cena) e, se sim,
 * limpa o vínculo pelo salvamento automático da página, para que o próximo
 * salvamento não o regrave. Confere uma vez por ficha e mesa.
 */
export function useStaleCampaignLinkCleanup<T extends LinkedSheet>(params: {
  kind: 'character' | 'monster'
  sheet: T | null
  sheetId: string | undefined
  ownerId: string | null | undefined
  enabled: boolean
  commit: (updater: (current: T) => T) => void
}) {
  const { kind, sheet, sheetId, ownerId, enabled, commit } = params
  const campaignId = sheet?.campaignId ?? null
  const checkedRef = useRef<string | null>(null)
  const commitRef = useRef(commit)
  commitRef.current = commit

  useEffect(() => {
    if (!enabled || !campaignId || !sheetId || !ownerId) return
    const key = `${sheetId}:${campaignId}`
    if (checkedRef.current === key) return
    checkedRef.current = key

    let cancelled = false
    isCampaignLinkStale({ kind, campaignId, ownerId, sheetId }).then((stale) => {
      if (cancelled || !stale) return
      commitRef.current((current) =>
        current.campaignId === campaignId
          ? { ...current, campaignId: null, campaignName: null }
          : current,
      )
    })
    return () => {
      cancelled = true
    }
  }, [kind, campaignId, sheetId, ownerId, enabled])
}
