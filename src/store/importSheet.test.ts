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

  it('continua recusando conteúdo que não é ficha, dizendo o motivo', async () => {
    expect(await importCharacterSheetFromJSON('uid-1', '{"data":{"foo":1}}')).toMatchObject({
      errors: 1,
      reason: 'not-a-sheet',
    })
    expect(await importCharacterSheetFromJSON('uid-1', 'não é json')).toMatchObject({
      errors: 1,
      reason: 'invalid-json',
    })
  })

  it('aceita ficha incompleta e completa o resto com os valores padrão', async () => {
    const result = await importCharacterSheetFromJSON(
      'uid-1',
      JSON.stringify({ character: { name: 'Mira' } }),
    )
    expect(result.imported).toBe(1)
    const saved = savedPayload() as unknown as { data: { character: { name: string }; inventory: unknown[] } }
    expect(saved.data.character.name).toBe('Mira')
    expect(Array.isArray(saved.data.inventory)).toBe(true)
  })

  it('descarta lista dentro de lista, que o Firestore recusa gravar', async () => {
    await importCharacterSheetFromJSON(
      'uid-1',
      JSON.stringify({ data: { ...character(), extra: [[1, 2], 3] } }),
    )
    const saved = savedPayload() as unknown as { data: { extra: unknown } }
    expect(saved.data.extra).toEqual([3])
  })

  it('recusa antes de gravar quando o documento passaria de 1 MiB', async () => {
    const sheet = character()
    sheet.character.avatar = `data:image/png;base64,${'A'.repeat(1_100_000)}`

    const result = await importCharacterSheetFromJSON('uid-1', JSON.stringify({ data: sheet }))

    expect(result).toMatchObject({ imported: 0, errors: 1, reason: 'document-too-large' })
    expect(setDoc).not.toHaveBeenCalled()
  })

  it('informa falha ao salvar quando o Firestore recusa a escrita', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    setDoc.mockRejectedValueOnce(new Error('permission-denied'))
    const result = await importCharacterSheetFromJSON('uid-1', JSON.stringify({ data: character() }))
    expect(result).toMatchObject({ imported: 0, errors: 1, reason: 'save-failed' })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
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

  it('aceita monstro incompleto e entende "NPC" escrito em maiúsculas', async () => {
    const result = await importMonsterSheetFromJSON(
      'uid-1',
      JSON.stringify({ details: { name: 'Guarda', kind: 'NPC' } }),
    )
    expect(result.imported).toBe(1)
    const saved = savedPayload() as unknown as { data: { details: { kind: string }; actions: unknown[] } }
    expect(saved.data.details.kind).toBe('npc')
    expect(Array.isArray(saved.data.actions)).toBe(true)
  })

  it('mantém um id válido', async () => {
    await importMonsterSheetFromJSON('uid-1', JSON.stringify({ id: ' lobo-1 ', data: monster() }))
    expect(savedPayload().id).toBe('lobo-1')
  })
})
