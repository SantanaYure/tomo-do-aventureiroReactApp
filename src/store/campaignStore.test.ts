import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeCampaign,
  normalizeCampaignMember,
} from './campaignStore'

const setDoc = vi.fn().mockResolvedValue(undefined)
const getDoc = vi.fn()
const getDocs = vi.fn()
const updateDoc = vi.fn().mockResolvedValue(undefined)
const deleteDoc = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => ({ type: 'collection', path }),
  doc: (...path: unknown[]) => ({ type: 'doc', id: 'mock-doc-id', path }),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  deleteDoc: (...args: unknown[]) => deleteDoc(...args),
  query: (...args: unknown[]) => ({ type: 'query', args }),
  where: (...args: unknown[]) => ({ type: 'where', args }),
}))

vi.mock('../services/firebase', () => ({ db: { type: 'firestore-mock' }, auth: {} }))

const { createCampaign, getCampaign, joinCampaignByCode } = await import('./campaignStore')

beforeEach(() => {
  setDoc.mockClear()
  getDoc.mockClear()
  getDocs.mockClear()
  updateDoc.mockClear()
  deleteDoc.mockClear()
})

describe('normalizeCampaign', () => {
  it('preenche campos faltantes com valores seguros', () => {
    const raw = {}
    const campaign = normalizeCampaign('camp-1', raw)

    expect(campaign.id).toBe('camp-1')
    expect(campaign.name).toBe('Nova Mesa')
    expect(campaign.system).toBe('dnd5e_2024')
    expect(campaign.dmId).toBe('')
    expect(campaign.dmName).toBe('Mestre')
    expect(campaign.archived).toBe(false)
    expect(typeof campaign.createdAt).toBe('number')
  })

  it('preserva dados válidos da campanha', () => {
    const raw = {
      name: 'Mesa de Baldur',
      description: 'Campanha de investigação',
      system: 'dnd5e_2024',
      dmId: 'dm-123',
      dmName: 'Mestre Yoda',
      inviteCode: 'BALDUR',
      bannerUrl: 'https://example.com/banner.png',
      createdAt: 1000,
      updatedAt: 2000,
      archived: false,
    }
    const campaign = normalizeCampaign('camp-2', raw)

    expect(campaign.id).toBe('camp-2')
    expect(campaign.name).toBe('Mesa de Baldur')
    expect(campaign.description).toBe('Campanha de investigação')
    expect(campaign.dmName).toBe('Mestre Yoda')
    expect(campaign.inviteCode).toBe('BALDUR')
    expect(campaign.bannerUrl).toBe('https://example.com/banner.png')
    expect(campaign.createdAt).toBe(1000)
    expect(campaign.updatedAt).toBe(2000)
  })
})

describe('normalizeCampaignMember', () => {
  it('normaliza membro padrão com fallback', () => {
    const member = normalizeCampaignMember('user-1', {})

    expect(member.userId).toBe('user-1')
    expect(member.displayName).toBe('Aventureiro')
    expect(member.role).toBe('player')
    expect(member.characterSheetId).toBeNull()
  })

  it('preserva papel de DM e dados de personagem vinculado', () => {
    const raw = {
      displayName: 'Valeros',
      photoURL: 'https://example.com/avatar.png',
      role: 'dm',
      characterSheetId: 'sheet-99',
      characterName: 'Valeros, o Bravo',
      characterClass: 'Guerreiro 5',
    }
    const member = normalizeCampaignMember('dm-user', raw)

    expect(member.role).toBe('dm')
    expect(member.displayName).toBe('Valeros')
    expect(member.characterSheetId).toBe('sheet-99')
    expect(member.characterName).toBe('Valeros, o Bravo')
    expect(member.characterClass).toBe('Guerreiro 5')
  })
})

describe('createCampaign & joinCampaignByCode', () => {
  it('cria a campanha e salva o membro DM', async () => {
    const result = await createCampaign(
      'dm-1',
      'Mestre dos Magos',
      { name: 'Campanha Épica' },
      'https://foto.com/dm.png',
    )

    expect(setDoc).toHaveBeenCalledTimes(2)
    expect(result.dmId).toBe('dm-1')
    expect(result.name).toBe('Campanha Épica')
    expect(result.inviteCode).toHaveLength(6)
  })

  it('rejeita entrar em campanha com código inexistente', async () => {
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] })

    await expect(
      joinCampaignByCode('user-player', 'Gimli', null, { inviteCode: 'INEXIST' }),
    ).rejects.toThrow('Mesa não encontrada')
  })
})
