// Regras do Firestore para mesas, membros e fichas vinculadas.
// Cada caso reproduz uma operação real do app (campaignStore.ts) com o
// usuário certo, para pegar regressões de permissão como as que quebraram a
// remoção de jogadores e a entrada pelo código de convite.

import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const CAMPAIGN = 'camp-1'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tomo',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

/** Mesa com mestre `dm`, jogador `p1` (ficha s1 vinculada) e ajudante `helper`. */
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'campaigns', CAMPAIGN), {
      name: 'Strahd',
      dmId: 'dm',
      dmName: 'Mestre',
      inviteCode: 'ABC123',
      memberIds: ['dm', 'p1', 'helper'],
      creatures: [],
      archived: false,
      createdAt: 1,
      updatedAt: 1,
    })
    await setDoc(doc(db, 'campaigns', CAMPAIGN, 'members', 'dm'), {
      userId: 'dm', displayName: 'Mestre', role: 'dm', joinedAt: 1,
    })
    await setDoc(doc(db, 'campaigns', CAMPAIGN, 'members', 'p1'), {
      userId: 'p1', displayName: 'Ana', role: 'player', joinedAt: 2,
      characterSheetId: 's1', characterName: 'Lia', characterClass: null,
      characterAvatarUrl: null, vitals: { hpCurrent: 10, hpMax: 12 },
    })
    await setDoc(doc(db, 'campaigns', CAMPAIGN, 'members', 'helper'), {
      userId: 'helper', displayName: 'Bia', role: 'player', joinedAt: 3, canManageHeroes: true,
    })
    await setDoc(doc(db, 'users', 'p1', 'characterSheets', 's1'), {
      campaignId: CAMPAIGN,
      campaignName: 'Strahd',
      name_lower: 'lia',
      updatedAt: 'x',
      data: {
        campaignId: CAMPAIGN,
        campaignName: 'Strahd',
        character: { name: 'Lia', hpCurrent: 10, hpTemp: 0, heroicInspiration: 0, deathSaves: { success: 0, failure: 0 } },
      },
    })
    await setDoc(doc(db, 'users', 'dm', 'monsterSheets', 'm1'), {
      campaignId: CAMPAIGN,
      campaignName: 'Strahd',
      updatedAt: 'x',
      data: { campaignId: CAMPAIGN, campaignName: 'Strahd', details: { name: 'Goblin' } },
    })
  })
})

const as = (uid: string) => env.authenticatedContext(uid).firestore()
const unlinkFields = {
  campaignId: null,
  campaignName: null,
  'data.campaignId': null,
  'data.campaignName': null,
  updatedAt: 'y',
}

describe('entrar na mesa pelo código', () => {
  it('quem ainda não é membro lê o próprio documento de membro (joinCampaignByCode)', async () => {
    await assertSucceeds(getDoc(doc(as('p2'), 'campaigns', CAMPAIGN, 'members', 'p2')))
  })

  it('não lê o documento de outro membro sem fazer parte da mesa', async () => {
    await assertFails(getDoc(doc(as('p2'), 'campaigns', CAMPAIGN, 'members', 'p1')))
  })

  it('entra como jogador: cria o próprio membro e se adiciona em memberIds', async () => {
    const db = as('p2')
    const batch = writeBatch(db)
    batch.set(doc(db, 'campaigns', CAMPAIGN, 'members', 'p2'), {
      userId: 'p2', displayName: 'Caio', role: 'player', joinedAt: 4,
    })
    batch.update(doc(db, 'campaigns', CAMPAIGN), { memberIds: arrayUnion('p2'), updatedAt: 4 })
    await assertSucceeds(batch.commit())
  })

  it('não entra se promovendo a mestre', async () => {
    await assertFails(
      setDoc(doc(as('p2'), 'campaigns', CAMPAIGN, 'members', 'p2'), {
        userId: 'p2', displayName: 'Caio', role: 'dm', joinedAt: 4,
      }),
    )
  })
})

describe('jogador na própria ficha de membro', () => {
  it('grava a própria iniciativa', async () => {
    await assertSucceeds(updateDoc(doc(as('p1'), 'campaigns', CAMPAIGN, 'members', 'p1'), { initiative: 15 }))
  })

  it('não grava a iniciativa de outro jogador', async () => {
    await assertFails(updateDoc(doc(as('p1'), 'campaigns', CAMPAIGN, 'members', 'helper'), { initiative: 3 }))
  })

  it('não se dá a permissão de ajudante nem vira mestre', async () => {
    const ref = doc(as('p1'), 'campaigns', CAMPAIGN, 'members', 'p1')
    await assertFails(updateDoc(ref, { canManageHeroes: true }))
    await assertFails(updateDoc(ref, { role: 'dm' }))
  })

  it('não altera criaturas nem o turno da mesa', async () => {
    const ref = doc(as('p1'), 'campaigns', CAMPAIGN)
    await assertFails(updateDoc(ref, { creatures: [{ id: 'x', name: 'Dragão' }], updatedAt: 5 }))
    await assertFails(updateDoc(ref, { combat: { round: 9, activeId: null }, updatedAt: 5 }))
  })

  it('sai da mesa: apaga o próprio membro e se tira de memberIds', async () => {
    const db = as('p1')
    const batch = writeBatch(db)
    batch.delete(doc(db, 'campaigns', CAMPAIGN, 'members', 'p1'))
    batch.update(doc(db, 'campaigns', CAMPAIGN), { memberIds: arrayRemove('p1'), updatedAt: 5 })
    await assertSucceeds(batch.commit())
  })
})

describe('mestre', () => {
  it('lê a ficha vinculada do jogador; quem é de fora não lê', async () => {
    await assertSucceeds(getDoc(doc(as('dm'), 'users', 'p1', 'characterSheets', 's1')))
    await assertFails(getDoc(doc(as('p2'), 'users', 'p1', 'characterSheets', 's1')))
  })

  it('remove o jogador: apaga o membro, tira de memberIds e limpa o vínculo da ficha', async () => {
    const db = as('dm')
    const batch = writeBatch(db)
    batch.delete(doc(db, 'campaigns', CAMPAIGN, 'members', 'p1'))
    batch.update(doc(db, 'campaigns', CAMPAIGN), { memberIds: arrayRemove('p1'), updatedAt: 6 })
    batch.update(doc(db, 'users', 'p1', 'characterSheets', 's1'), unlinkFields)
    await assertSucceeds(batch.commit())
  })

  it('não mexe no resto da ficha do jogador', async () => {
    await assertFails(
      updateDoc(doc(as('dm'), 'users', 'p1', 'characterSheets', 's1'), { 'data.character.name': 'Outro' }),
    )
  })

  it('espelha PV do herói na ficha (updateMemberVitals)', async () => {
    const db = as('dm')
    const batch = writeBatch(db)
    batch.update(doc(db, 'campaigns', CAMPAIGN, 'members', 'p1'), { vitals: { hpCurrent: 4, hpMax: 12 } })
    batch.update(doc(db, 'users', 'p1', 'characterSheets', 's1'), {
      'data.character.hpCurrent': 4,
      'data.character.hpTemp': 0,
      'data.character.heroicInspiration': 0,
      'data.character.deathSaves.success': 0,
      'data.character.deathSaves.failure': 0,
      updatedAt: 'z',
    })
    await assertSucceeds(batch.commit())
  })

  it('controla criaturas, iniciativa e turno da mesa', async () => {
    await assertSucceeds(
      updateDoc(doc(as('dm'), 'campaigns', CAMPAIGN), {
        creatures: [{ id: 'g1', name: 'Goblin', initiative: 12, outOfCombat: false }],
        combat: { round: 1, activeId: 'creature:g1' },
        updatedAt: 7,
      }),
    )
    await assertSucceeds(updateDoc(doc(as('dm'), 'campaigns', CAMPAIGN, 'members', 'p1'), { initiative: 8, outOfCombat: true }))
  })

  it('exclui a mesa: membros e mesa no mesmo batch (deleteCampaign)', async () => {
    const db = as('dm')
    const batch = writeBatch(db)
    for (const uid of ['dm', 'p1', 'helper']) batch.delete(doc(db, 'campaigns', CAMPAIGN, 'members', uid))
    batch.delete(doc(db, 'campaigns', CAMPAIGN))
    await assertSucceeds(batch.commit())
  })

  it('limpa o vínculo da própria ficha de monstro', async () => {
    await assertSucceeds(updateDoc(doc(as('dm'), 'users', 'dm', 'monsterSheets', 'm1'), unlinkFields))
  })
})

describe('outros usuários', () => {
  it('jogador não exclui a mesa nem edita nome/descrição', async () => {
    await assertFails(deleteDoc(doc(as('p1'), 'campaigns', CAMPAIGN)))
    await assertFails(updateDoc(doc(as('p1'), 'campaigns', CAMPAIGN), { name: 'Minha', updatedAt: 8 }))
  })

  it('jogador não remove outro jogador', async () => {
    await assertFails(deleteDoc(doc(as('p1'), 'campaigns', CAMPAIGN, 'members', 'helper')))
  })

  it('ajudante desvincula o herói de outro jogador, mas não mexe em mais nada', async () => {
    const ref = doc(as('helper'), 'campaigns', CAMPAIGN, 'members', 'p1')
    await assertSucceeds(
      updateDoc(ref, {
        characterSheetId: null,
        characterName: null,
        characterClass: null,
        characterAvatarUrl: null,
        vitals: null,
        initiative: null,
      }),
    )
    await assertFails(updateDoc(ref, { displayName: 'Hackeado' }))
  })

  it('ninguém de fora lê a ficha de monstro vinculada; o jogador da mesa lê', async () => {
    await assertFails(getDoc(doc(as('p2'), 'users', 'dm', 'monsterSheets', 'm1')))
    await assertSucceeds(getDoc(doc(as('p1'), 'users', 'dm', 'monsterSheets', 'm1')))
  })
})
