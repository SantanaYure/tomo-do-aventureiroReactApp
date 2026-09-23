import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const isCampaignLinkStale = vi.fn()
vi.mock('../store/campaignStore', () => ({
  isCampaignLinkStale: (...args: unknown[]) => isCampaignLinkStale(...args),
}))

const { useStaleCampaignLinkCleanup } = await import('./useStaleCampaignLinkCleanup')

type Sheet = { campaignId: string | null; campaignName: string | null; name: string }

beforeEach(() => isCampaignLinkStale.mockReset())

describe('useStaleCampaignLinkCleanup', () => {
  it('limpa o vínculo pelo commit quando está órfão', async () => {
    isCampaignLinkStale.mockResolvedValue(true)
    const commit = vi.fn()
    const sheet: Sheet = { campaignId: 'camp-1', campaignName: 'Strahd', name: 'Lia' }
    renderHook(() =>
      useStaleCampaignLinkCleanup({ kind: 'character', sheet, sheetId: 's-1', ownerId: 'u-1', enabled: true, commit }),
    )
    await waitFor(() => expect(commit).toHaveBeenCalledOnce())
    const updater = commit.mock.calls[0][0] as (s: Sheet) => Sheet
    expect(updater(sheet)).toEqual({ campaignId: null, campaignName: null, name: 'Lia' })
    // Se nesse meio-tempo a ficha foi vinculada a outra mesa, não mexe.
    const relinked = { ...sheet, campaignId: 'camp-2' }
    expect(updater(relinked)).toBe(relinked)
  })

  it('não faz nada para quem só está vendo a ficha de outro', async () => {
    const commit = vi.fn()
    renderHook(() =>
      useStaleCampaignLinkCleanup({
        kind: 'character',
        sheet: { campaignId: 'camp-1', campaignName: 'X', name: 'Lia' },
        sheetId: 's-1',
        ownerId: 'u-1',
        enabled: false,
        commit,
      }),
    )
    await new Promise((r) => setTimeout(r, 10))
    expect(isCampaignLinkStale).not.toHaveBeenCalled()
  })

  it('vínculo válido fica como está', async () => {
    isCampaignLinkStale.mockResolvedValue(false)
    const commit = vi.fn()
    renderHook(() =>
      useStaleCampaignLinkCleanup({
        kind: 'monster',
        sheet: { campaignId: 'camp-1', campaignName: 'X', name: 'Goblin' },
        sheetId: 'm-1',
        ownerId: 'dm',
        enabled: true,
        commit,
      }),
    )
    await waitFor(() => expect(isCampaignLinkStale).toHaveBeenCalledOnce())
    expect(commit).not.toHaveBeenCalled()
  })
})
