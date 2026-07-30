// A ficha ganhou um campo: `id` estável em cada ataque e cada habilidade, para
// que o estado de UI (resultado de rolagem, linha expandida) pare de ser
// chaveado por índice do array.
//
// A forma do documento só pode GANHAR campo, nunca perder ou renomear, e
// documentos já gravados no Firestore não têm o campo. Estes testes cobrem o
// que pode quebrar em produção:
//
//  - ficha antiga sem `id` recebe id e nada mais muda;
//  - a geração é DETERMINÍSTICA — `normalizeCharacterSheet` roda a cada
//    snapshot do Firestore; um id sorteado mudaria a cada leitura e brigaria
//    com o autosave;
//  - nunca sai `undefined` no campo (o Firestore rejeita `undefined`);
//  - ids já existentes são preservados, inclusive contra colisão;
//  - o `name_lower` continua sendo gerado em toda escrita.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const setDoc = vi.fn().mockResolvedValue(undefined)
const getDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => ({ type: 'collection', path }),
  doc: (...path: unknown[]) => ({ type: 'doc', path }),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  addDoc: vi.fn().mockResolvedValue({ id: 'novo' }),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/firebase', () => ({ db: { type: 'firestore-mock' }, auth: {} }))

const { normalizeCharacterSheet, saveCharacterSheet } = await import('./characterSheetStore')
const { createDefaultCharacterSheet } = await import('./defaultCharacterSheet')

type LegacySheet = ReturnType<typeof createDefaultCharacterSheet>

/**
 * Ficha como o Firestore devolve um documento gravado antes desta mudança:
 * ataques e habilidades sem o campo `id`.
 */
function legacySheet(): LegacySheet {
  return {
    ...createDefaultCharacterSheet(),
    attacks: [
      { name: 'Adaga', attributeKey: 'dex', damages: [] },
      { name: 'Espada', attributeKey: 'str', damages: [] },
      { name: 'Arco', attributeKey: 'dex', damages: [] },
    ],
    resources: [
      { name: 'Fúria', max: 2, current: 2, resetOn: 'long-rest' },
      { name: 'Visão no Escuro', resetOn: 'na' },
    ],
  } as LegacySheet
}

beforeEach(() => {
  setDoc.mockClear()
  getDoc.mockReset()
})

describe('normalizeCharacterSheet — id estável em ataques e habilidades', () => {
  it('gera id para ficha antiga que não tem o campo', () => {
    const normalized = normalizeCharacterSheet(legacySheet())

    expect(normalized.attacks.map((attack) => attack.id)).toEqual([
      'attack-1',
      'attack-2',
      'attack-3',
    ])
    expect(normalized.resources.map((resource) => resource.id)).toEqual([
      'resource-1',
      'resource-2',
    ])
  })

  it('não perde nenhum outro campo da ficha antiga', () => {
    const normalized = normalizeCharacterSheet(legacySheet())

    expect(normalized.attacks.map((attack) => attack.name)).toEqual([
      'Adaga',
      'Espada',
      'Arco',
    ])
    expect(normalized.resources[0]).toMatchObject({
      name: 'Fúria',
      max: 2,
      current: 2,
      resetOn: 'long-rest',
    })
  })

  it('é determinístico: normalizar duas vezes dá o mesmo id', () => {
    const first = normalizeCharacterSheet(legacySheet())
    const second = normalizeCharacterSheet(legacySheet())
    const third = normalizeCharacterSheet(first)

    expect(second.attacks.map((a) => a.id)).toEqual(first.attacks.map((a) => a.id))
    expect(third.attacks.map((a) => a.id)).toEqual(first.attacks.map((a) => a.id))
    expect(third.resources.map((r) => r.id)).toEqual(first.resources.map((r) => r.id))
  })

  it('preserva id já existente e não o renumera pela posição', () => {
    const sheet = {
      ...createDefaultCharacterSheet(),
      attacks: [
        { name: 'Adaga', id: 'uuid-adaga', damages: [] },
        { name: 'Espada', id: 'uuid-espada', damages: [] },
      ],
    } as LegacySheet

    const normalized = normalizeCharacterSheet(sheet)

    expect(normalized.attacks.map((attack) => attack.id)).toEqual([
      'uuid-adaga',
      'uuid-espada',
    ])
  })

  it('não repete id quando o posicional colidiria com um id já gravado', () => {
    // Cenário real: a ficha foi normalizada uma vez (gerando `attack-1`), o
    // primeiro item foi removido e um item sem id entrou na lista.
    const sheet = {
      ...createDefaultCharacterSheet(),
      attacks: [
        { name: 'Sem id', damages: [] },
        { name: 'Já tinha id', id: 'attack-1', damages: [] },
      ],
    } as LegacySheet

    const ids = normalizeCharacterSheet(sheet).attacks.map((attack) => attack.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('attack-1')
  })

  it('nunca devolve id ausente, vazio ou não-string', () => {
    const sheet = {
      ...createDefaultCharacterSheet(),
      attacks: [
        { name: 'Vazio', id: '   ', damages: [] },
        { name: 'Numérico', id: 7, damages: [] },
        { name: 'Sem campo', damages: [] },
      ],
      resources: [{ name: 'Vazio', id: '', resetOn: 'na' }],
    } as unknown as LegacySheet

    const normalized = normalizeCharacterSheet(sheet)

    for (const item of [...normalized.attacks, ...normalized.resources]) {
      expect(typeof item.id).toBe('string')
      expect(item.id).not.toBe('')
    }
  })
})

describe('saveCharacterSheet — o documento gravado carrega os ids e o name_lower', () => {
  it('grava id em todo ataque e habilidade, sem undefined, e mantém name_lower', async () => {
    const sheet = legacySheet()
    sheet.character.name = 'Aldric Pedravinda'

    await saveCharacterSheet('uid-1', 'sheet-1', sheet, '2024-01-01T00:00:00.000Z')

    const calls = setDoc.mock.calls
    const payload = calls[calls.length - 1]?.[1] as {
      name_lower: string
      data: LegacySheet
    }

    expect(payload.name_lower).toBe('aldric pedravinda')
    expect(payload.data.attacks.map((attack) => attack.id)).toEqual([
      'attack-1',
      'attack-2',
      'attack-3',
    ])

    // O Firestore rejeita `undefined`; a serialização precisa manter os ids.
    const serialized = JSON.parse(JSON.stringify(payload.data)) as LegacySheet
    for (const attack of serialized.attacks) expect(attack.id).toBeTruthy()
    for (const resource of serialized.resources) expect(resource.id).toBeTruthy()
  })
})
