// Importação de fichas por JSON: id ausente ou inválido vira um id
// automático do Firestore, em vez de recusar o arquivo.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const setDoc = vi.fn().mockResolvedValue(undefined)
const getDoc = vi.fn()

type Ref = { type: string; path: unknown[]; id?: string }

vi.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]): Ref => ({ type: 'collection', path }),
  doc: (...args: unknown[]): Ref => {
    const first = args[0] as Ref | undefined
    // doc(collectionRef) sem id: o Firestore sorteia um id automático.
    if (args.length === 1 && first?.type === 'collection') {
      return { type: 'doc', path: [...first.path, 'AUTO_ID'], id: 'AUTO_ID' }
    }
    return { type: 'doc', path: args, id: String(args[args.length - 1]) }
  },
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
}))

vi.mock('../services/firebase', () => ({ db: { type: 'firestore-mock' }, auth: {} }))

const { importCharacterSheetFromJSON } = await import('./characterSheetStore')
const { createDefaultCharacterSheet } = await import('./defaultCharacterSheet')
const { importMonsterSheetFromJSON, createDefaultMonsterSheet } = await import('./monsterSheetStore')

function savedRef(): Ref {
  return setDoc.mock.calls[setDoc.mock.calls.length - 1]?.[0] as Ref
}
function savedPayload(): { id: string } {
  return setDoc.mock.calls[setDoc.mock.calls.length - 1]?.[1] as { id: string }
}

beforeEach(() => {
  setDoc.mockClear()
  getDoc.mockReset()
  getDoc.mockResolvedValue({ exists: () => false })
})

const character = () => {
  const sheet = createDefaultCharacterSheet()
  sheet.character.name = 'Valeros'
  return sheet
}
const monster = () => {
  const sheet = createDefaultMonsterSheet()
  sheet.details.name = 'Lobo Sombrio'
  return sheet
}

describe('importCharacterSheetFromJSON', () => {
  it('gera um id quando o arquivo não traz id', async () => {
    const result = await importCharacterSheetFromJSON('uid-1', JSON.stringify({ data: character() }))

    expect(result).toEqual({ imported: 1, skipped: 0, errors: 0 })
    expect(savedRef().id).toBe('AUTO_ID')
    expect(savedPayload().id).toBe('AUTO_ID')
  })

  it('gera um id quando o id do arquivo é inválido para o Firestore', async () => {
    for (const id of ['', '   ', 'pasta/ficha', '__x__', 42, null]) {
      setDoc.mockClear()
      const result = await importCharacterSheetFromJSON(
        'uid-1',
        JSON.stringify({ id, data: character() }),
      )
      expect(result.imported).toBe(1)
      expect(savedPayload().id).toBe('AUTO_ID')
    }
  })

  it('aceita a ficha crua, sem o envelope { id, data }', async () => {
    const result = await importCharacterSheetFromJSON('uid-1', JSON.stringify(character()))
    expect(result.imported).toBe(1)
    expect(savedPayload().id).toBe('AUTO_ID')
  })

  it('mantém um id válido e não sobrescreve ficha existente', async () => {
    const json = JSON.stringify({ id: 'ficha-1', data: character() })

    expect(await importCharacterSheetFromJSON('uid-1', json)).toEqual({ imported: 1, skipped: 0, errors: 0 })
    expect(savedPayload().id).toBe('ficha-1')

    setDoc.mockClear()
    getDoc.mockResolvedValue({ exists: () => true })
    expect(await importCharacterSheetFromJSON('uid-1', json)).toEqual({ imported: 0, skipped: 1, errors: 0 })
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('continua recusando conteúdo que não é ficha', async () => {
    expect((await importCharacterSheetFromJSON('uid-1', '{"data":{"foo":1}}')).errors).toBe(1)
    expect((await importCharacterSheetFromJSON('uid-1', 'não é json')).errors).toBe(1)
  })
})

describe('importMonsterSheetFromJSON', () => {
  it('gera um id quando falta ou é inválido', async () => {
    expect((await importMonsterSheetFromJSON('uid-1', JSON.stringify({ data: monster() }))).imported).toBe(1)
    expect(savedPayload().id).toBe('AUTO_ID')

    expect(
      (await importMonsterSheetFromJSON('uid-1', JSON.stringify({ id: 'a/b', data: monster() }))).imported,
    ).toBe(1)
    expect(savedPayload().id).toBe('AUTO_ID')

    expect((await importMonsterSheetFromJSON('uid-1', JSON.stringify(monster()))).imported).toBe(1)
    expect(savedPayload().id).toBe('AUTO_ID')
  })

  it('mantém um id válido', async () => {
    await importMonsterSheetFromJSON('uid-1', JSON.stringify({ id: ' lobo-1 ', data: monster() }))
    expect(savedPayload().id).toBe('lobo-1')
  })
})
