import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CampaignCreature } from '../types/campaign/campaign'

const getDoc = vi.fn()
vi.mock('firebase/firestore', () => ({
  doc: (...path: unknown[]) => ({ path }),
  getDoc: (...args: unknown[]) => getDoc(...args),
}))

const { useCreatureAvatars, __resetCreatureAvatarCache } = await import('./useCreatureAvatars')

function creature(partial: Partial<CampaignCreature>): CampaignCreature {
  return { id: 'c', name: 'X', hpCurrent: 1, hpMax: 1, hpTemp: 0, armorClass: 10, conditions: [], addedAt: 0, ...partial }
}

beforeEach(() => {
  getDoc.mockReset()
  __resetCreatureAvatarCache()
})

describe('useCreatureAvatars', () => {
  it('lê o avatar da ficha uma vez por ficha, mesmo com várias réplicas', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ data: { details: { avatar: 'data:image/png;base64,AAA' } } }) })
    const list = [
      creature({ id: 'g1', ownerId: 'dm', monsterSheetId: 'm-1' }),
      creature({ id: 'g2', ownerId: 'dm', monsterSheetId: 'm-1' }),
      creature({ id: 'x', monsterSheetId: null }),
    ]

    const { result } = renderHook(() => useCreatureAvatars(list))

    await waitFor(() => expect(result.current['dm/m-1']).toBe('data:image/png;base64,AAA'))
    expect(getDoc).toHaveBeenCalledTimes(1)
  })

  it('sem permissão, fica sem avatar em vez de quebrar', async () => {
    getDoc.mockRejectedValue(Object.assign(new Error('denied'), { code: 'permission-denied' }))
    const { result } = renderHook(() =>
      useCreatureAvatars([creature({ ownerId: 'dm', monsterSheetId: 'm-2' })]),
    )
    await waitFor(() => expect(result.current).toHaveProperty('dm/m-2', null))
  })
})
