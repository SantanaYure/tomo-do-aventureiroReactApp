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
const batchSet = vi.fn()
const batchUpdate = vi.fn()
const batchDelete = vi.fn()
const batchCommit = vi.fn().mockResolvedValue(undefined)
const txGet = vi.fn()
const txUpdate = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => ({ type: 'collection', path }),
  doc: (...path: unknown[]) => ({ type: 'doc', id: 'mock-doc-id', path }),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  deleteDoc: (...args: unknown[]) => deleteDoc(...args),
  writeBatch: () => ({
    set: (...args: unknown[]) => batchSet(...args),
    update: (...args: unknown[]) => batchUpdate(...args),
    delete: (...args: unknown[]) => batchDelete(...args),
    commit: (...args: unknown[]) => batchCommit(...args),
  }),
  arrayUnion: (...values: unknown[]) => ({ type: 'arrayUnion', values }),
  arrayRemove: (...values: unknown[]) => ({ type: 'arrayRemove', values }),
  runTransaction: (_db: unknown, fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      get: (...args: unknown[]) => txGet(...args),
      update: (...args: unknown[]) => txUpdate(...args),
    }),
  query: (...args: unknown[]) => ({ type: 'query', args }),
  where: (...args: unknown[]) => ({ type: 'where', args }),
}))

vi.mock('../services/firebase', () => ({ db: { type: 'firestore-mock' }, auth: {} }))

const {
  createCampaign,
  getCampaign,
  joinCampaignByCode,
  linkCharacterSheetToCampaign,
  unlinkCharacterSheetFromCampaign,
  removeMember,
  duplicateCreatureInCampaign,
  addCreatureToCampaign,
  releaseCharacterSheetFromCampaign,
  releaseMonsterSheetFromCampaign,
  rollCreaturesInitiative,
  setCombatantOutOfCombat,
  endCampaignCombat,
} = await import('./campaignStore')

beforeEach(() => {
  setDoc.mockClear()
  getDoc.mockClear()
  getDocs.mockClear()
  updateDoc.mockClear()
  deleteDoc.mockClear()
  batchSet.mockClear()
  batchUpdate.mockClear()
  batchDelete.mockClear()
  batchCommit.mockReset()
  batchCommit.mockResolvedValue(undefined)
  txGet.mockReset()
  txUpdate.mockClear()
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

describe('vínculo com a ficha real', () => {
  const sheet = {
    character: {
      name: 'Lia',
      avatar: '',
      classes: [{ className: 'Maga', level: 4 }],
      attributes: [],
      skills: {},
      hpCurrent: 18,
      hpMax: 22,
      hpTemp: 0,
      armorClassBase: 13,
      heroicInspiration: 0,
      deathSaves: { success: 0, failure: 0 },
    },
    spellSlots: {},
  } as never

  it('grava membro e ficha no mesmo batch ao vincular', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ characterSheetId: null }),
    })

    await linkCharacterSheetToCampaign('camp-1', 'Mesa 1', 'user-1', 'sheet-1', sheet)

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({ characterSheetId: 'sheet-1', characterName: 'Lia' }),
    )
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({
        campaignId: 'camp-1',
        campaignName: 'Mesa 1',
        'data.campaignId': 'camp-1',
      }),
    )
    expect(batchCommit).toHaveBeenCalledOnce()
  })

  it('limpa membro e ficha no mesmo batch ao desvincular', async () => {
    getDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ characterSheetId: 'sheet-1' }),
      })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({}) })

    await unlinkCharacterSheetFromCampaign('camp-1', 'user-1', 'sheet-1')

    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({ characterSheetId: null, vitals: null }),
    )
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({ campaignId: null, 'data.campaignId': null }),
    )
    expect(batchCommit).toHaveBeenCalledOnce()
  })
})

function campaignSnap(creatures: unknown[]) {
  return {
    id: 'camp-1',
    exists: () => true,
    data: () => ({ dmId: 'dm-1', memberIds: ['dm-1', 'p-1'], creatures }),
  }
}

function lastTxCreatures() {
  const call = txUpdate.mock.calls[txUpdate.mock.calls.length - 1]
  return (call?.[1] as { creatures: Array<Record<string, unknown>> }).creatures
}

describe('removeMember', () => {
  it('remove o jogador mesmo quando a ficha dele não pode ser lida (ex.: excluída)', async () => {
    getDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ dmId: 'dm-1' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ characterSheetId: 'sheet-x' }) })
      .mockRejectedValueOnce(Object.assign(new Error('denied'), { code: 'permission-denied' }))

    await removeMember('camp-1', 'p-1')

    expect(batchDelete).toHaveBeenCalledOnce()
    expect(batchUpdate).toHaveBeenCalledTimes(1)
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({ memberIds: { type: 'arrayRemove', values: ['p-1'] } }),
    )
    expect(batchCommit).toHaveBeenCalledOnce()
  })

  it('se a limpeza da ficha for recusada no commit, grava só o essencial', async () => {
    getDoc
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ dmId: 'dm-1' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ characterSheetId: 'sheet-1' }) })
      .mockResolvedValueOnce({ exists: () => true, data: () => ({}) })
    batchCommit
      .mockRejectedValueOnce(Object.assign(new Error('denied'), { code: 'permission-denied' }))
      .mockResolvedValueOnce(undefined)

    await removeMember('camp-1', 'p-1')

    expect(batchCommit).toHaveBeenCalledTimes(2)
    // 1ª tentativa: membro + memberIds + ficha; 2ª: só membro + memberIds.
    expect(batchDelete).toHaveBeenCalledTimes(2)
    expect(batchUpdate).toHaveBeenCalledTimes(3)
  })

  it('não deixa remover o mestre', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ dmId: 'dm-1' }) })
    await expect(removeMember('camp-1', 'dm-1')).rejects.toThrow(/mestre/)
    expect(batchCommit).not.toHaveBeenCalled()
  })
})

describe('réplica de criaturas', () => {
  it('duplica com PV cheio, sem condições e com o próximo número', async () => {
    txGet.mockResolvedValueOnce(
      campaignSnap([
        { id: 'g1', name: 'Goblin', hpCurrent: 2, hpMax: 7, hpTemp: 3, armorClass: 15, conditions: ['Caído'], initiative: 14, initiativeBonus: 2, addedAt: 1 },
        { id: 'w1', name: 'Lobo', hpCurrent: 11, hpMax: 11, hpTemp: 0, armorClass: 13, conditions: [], addedAt: 2 },
      ]),
    )

    const created = await duplicateCreatureInCampaign('camp-1', 'g1', 2)

    expect(created.map((c) => c.name)).toEqual(['Goblin 2', 'Goblin 3'])
    expect(created[0]).toMatchObject({ hpCurrent: 7, hpTemp: 0, conditions: [], initiative: null, initiativeBonus: 2 })
    expect(new Set(created.map((c) => c.id)).size).toBe(2)
    // As cópias ficam logo depois da original.
    expect(lastTxCreatures().map((c) => c.name)).toEqual(['Goblin', 'Goblin 2', 'Goblin 3', 'Lobo'])
  })

  it('adiciona várias criaturas avulsas de uma vez, numeradas', async () => {
    txGet.mockResolvedValueOnce(campaignSnap([]))

    await addCreatureToCampaign(
      'camp-1',
      { name: 'Bandido', hpCurrent: 11, hpMax: 11, hpTemp: 0, armorClass: 12, conditions: [] },
      3,
    )

    expect(lastTxCreatures().map((c) => c.name)).toEqual(['Bandido 1', 'Bandido 2', 'Bandido 3'])
  })
})

describe('iniciativa das criaturas', () => {
  it('com onlyMissing, mantém quem já rolou', async () => {
    txGet.mockResolvedValueOnce(
      campaignSnap([
        { id: 'a', name: 'A', initiative: 17, initiativeBonus: 0 },
        { id: 'b', name: 'B', initiativeBonus: 3 },
      ]),
    )

    await rollCreaturesInitiative('camp-1', { onlyMissing: true, random: () => 0 })

    const list = lastTxCreatures()
    expect(list[0].initiative).toBe(17)
    expect(list[1].initiative).toBe(4)
  })
})

describe('exclusão de fichas vinculadas', () => {
  it('libera o herói na mesa quando a ficha excluída é a vinculada', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ characterSheetId: 'sheet-1' }) })

    await releaseCharacterSheetFromCampaign('camp-1', 'p-1', 'sheet-1')

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      expect.objectContaining({ characterSheetId: null, vitals: null, initiative: null }),
    )
  })

  it('não mexe no membro se ele usa outra ficha', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ characterSheetId: 'outra' }) })
    await releaseCharacterSheetFromCampaign('camp-1', 'p-1', 'sheet-1')
    expect(updateDoc).not.toHaveBeenCalled()
  })

  it('mantém as instâncias do monstro em cena, sem o link para a ficha', async () => {
    txGet.mockResolvedValueOnce(
      campaignSnap([
        { id: 'g1', name: 'Goblin', monsterSheetId: 'm-1', ownerId: 'dm-1' },
        { id: 'o1', name: 'Orc', monsterSheetId: 'm-2', ownerId: 'dm-1' },
      ]),
    )

    await releaseMonsterSheetFromCampaign('camp-1', 'dm-1', 'm-1')

    const list = lastTxCreatures()
    expect(list).toHaveLength(2)
    expect(list[0].monsterSheetId).toBeNull()
    expect(list[1].monsterSheetId).toBe('m-2')
  })

  it('nunca lança, mesmo se a mesa recusar a escrita', async () => {
    txGet.mockRejectedValueOnce(new Error('offline'))
    await expect(releaseMonsterSheetFromCampaign('camp-1', 'dm-1', 'm-1')).resolves.toBeUndefined()
  })
})

describe('mestre que também joga', () => {
  it('participatesAsPlayer só vale para o mestre', () => {
    expect(normalizeCampaignMember('dm-1', { role: 'dm', participatesAsPlayer: true }).participatesAsPlayer).toBe(true)
    expect(normalizeCampaignMember('dm-1', { role: 'dm' }).participatesAsPlayer).toBe(false)
    expect(normalizeCampaignMember('p-1', { role: 'player', participatesAsPlayer: true }).participatesAsPlayer).toBe(false)
  })
})

describe('tirar da iniciativa', () => {
  it('marca a criatura como fora do combate mantendo a iniciativa e grava o novo turno', async () => {
    txGet.mockResolvedValueOnce(campaignSnap([{ id: 'g1', name: 'Goblin', initiative: 14 }]))

    await setCombatantOutOfCombat('camp-1', { kind: 'creature', refId: 'g1' }, true, { round: 2, activeId: 'hero:p-1' })

    const call = txUpdate.mock.calls[txUpdate.mock.calls.length - 1][1] as Record<string, unknown>
    expect((call.creatures as Array<Record<string, unknown>>)[0]).toMatchObject({ outOfCombat: true, initiative: 14 })
    expect(call.combat).toEqual({ round: 2, activeId: 'hero:p-1' })
  })

  it('herói fora do combate não é rolado de novo e volta ao encerrar', async () => {
    txGet.mockResolvedValueOnce(campaignSnap([{ id: 'g1', name: 'Goblin', outOfCombat: true, initiative: 5 }]))

    await endCampaignCombat('camp-1', ['p-1'])

    expect(lastTxCreatures()[0]).toMatchObject({ outOfCombat: false, initiative: null })
    expect(batchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'doc' }),
      { initiative: null, outOfCombat: false },
    )
  })

  it('rolagem das criaturas ignora quem está fora do combate', async () => {
    txGet.mockResolvedValueOnce(campaignSnap([
      { id: 'a', name: 'A', outOfCombat: true },
      { id: 'b', name: 'B', initiativeBonus: 1 },
    ]))

    await rollCreaturesInitiative('camp-1', { random: () => 0 })

    const list = lastTxCreatures()
    expect(list[0].initiative).toBeNull()
    expect(list[1].initiative).toBe(2)
  })
})
