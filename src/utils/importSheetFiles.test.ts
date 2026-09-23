import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImportResult } from '../store/characterSheetStore'

const importCharacter = vi.fn<(uid: string, json: string) => Promise<ImportResult>>()
const importMonster = vi.fn<(uid: string, json: string) => Promise<ImportResult>>()

vi.mock('../store/characterSheetStore', () => ({
  importCharacterSheetFromJSON: (uid: string, json: string) => importCharacter(uid, json),
}))
vi.mock('../store/monsterSheetStore', () => ({
  importMonsterSheetFromJSON: (uid: string, json: string) => importMonster(uid, json),
}))
vi.mock('./importAvatarCompression', () => ({
  compressOversizedAvatarIfNeeded: vi.fn(async () => {}),
}))

const {
  detectImportedSheetType,
  importSheetFile,
  importSheetFiles,
  summarizeImport,
  MAX_IMPORT_FILE_BYTES,
} = await import('./importSheetFiles')

const ok: ImportResult = { imported: 1, skipped: 0, errors: 0 }
const skipped: ImportResult = { imported: 0, skipped: 1, errors: 0 }

function jsonFile(name: string, content: unknown): File {
  return new File([typeof content === 'string' ? content : JSON.stringify(content)], name, {
    type: 'application/json',
  })
}

const pj = (name: string) => ({ data: { character: { name } } })
const npc = (name: string) => ({ data: { details: { name, kind: 'NPC' } } })

beforeEach(() => {
  importCharacter.mockReset().mockResolvedValue(ok)
  importMonster.mockReset().mockResolvedValue(ok)
})

describe('detectImportedSheetType', () => {
  it('reconhece PJ, monstro e NPC nos formatos aceitos', () => {
    expect(detectImportedSheetType(pj('Valeros'))).toBe('character')
    expect(detectImportedSheetType({ details: { name: 'Lobo' } })).toBe('monster')
    expect(detectImportedSheetType(npc('Guarda'))).toBe('npc')
    expect(detectImportedSheetType({ foo: 1, bar: 2 })).toBe('unknown')
  })
})

describe('importSheetFile', () => {
  it('manda PJ para o store de PJ e monstro/NPC para o de monstros', async () => {
    await importSheetFile('u', jsonFile('a.json', pj('Valeros')))
    await importSheetFile('u', jsonFile('b.json', npc('Guarda')))
    expect(importCharacter).toHaveBeenCalledTimes(1)
    expect(importMonster).toHaveBeenCalledTimes(1)
  })

  it('devolve o motivo sem chamar o store quando o arquivo não serve', async () => {
    expect((await importSheetFile('u', jsonFile('x.json', '{quebrado'))).result.reason).toBe('invalid-json')
    expect((await importSheetFile('u', jsonFile('y.json', { foo: 1, bar: 2 }))).result.reason).toBe('not-a-sheet')

    const huge = jsonFile('z.json', pj('Z'))
    Object.defineProperty(huge, 'size', { value: MAX_IMPORT_FILE_BYTES + 1 })
    expect((await importSheetFile('u', huge)).result.reason).toBe('too-large')

    expect(importCharacter).not.toHaveBeenCalled()
    expect(importMonster).not.toHaveBeenCalled()
  })
})

describe('importSheetFiles', () => {
  it('importa em sequência, avisando o progresso de cada arquivo', async () => {
    const order: string[] = []
    importCharacter.mockImplementation(async (_uid, json) => {
      order.push(JSON.parse(json).data.character.name)
      return ok
    })
    const progress = vi.fn()
    const files = [jsonFile('1.json', pj('A')), jsonFile('2.json', pj('B')), jsonFile('3.json', pj('C'))]

    const outcomes = await importSheetFiles('u', files, progress)

    expect(order).toEqual(['A', 'B', 'C'])
    expect(progress.mock.calls.map(([done, total, file]) => [done, total, file.name])).toEqual([
      [0, 3, '1.json'],
      [1, 3, '2.json'],
      [2, 3, '3.json'],
    ])
    expect(outcomes).toHaveLength(3)
  })

  it('um arquivo com problema não interrompe os outros', async () => {
    const files = [jsonFile('bom.json', pj('A')), jsonFile('ruim.json', '{'), jsonFile('npc.json', npc('G'))]

    const outcomes = await importSheetFiles('u', files)

    expect(outcomes.map((o) => o.result.imported)).toEqual([1, 0, 1])
  })
})

describe('summarizeImport', () => {
  it('com um arquivo, mantém a mensagem detalhada de sempre', () => {
    const summary = summarizeImport([{ fileName: 'a.json', scope: 'npc', result: ok }])
    expect(summary.message).toBe('NPC importado com sucesso.')
    expect(summary.problems).toEqual([])
    expect(summary.tone).toBe('ok')
  })

  it('com vários, resume a contagem e lista o que não entrou', () => {
    const summary = summarizeImport([
      { fileName: 'a.json', scope: 'character', result: ok },
      { fileName: 'b.json', scope: 'monster', result: ok },
      { fileName: 'c.json', scope: 'npc', result: skipped },
      { fileName: 'd.json', scope: 'unknown', result: { imported: 0, skipped: 0, errors: 1, reason: 'invalid-json' } },
    ])

    expect(summary.message).toBe('2 fichas importadas, 1 já existia, 1 com erro de 4 arquivos.')
    expect(summary.problems).toEqual([
      { fileName: 'c.json', reason: 'já existe, não foi sobrescrito' },
      { fileName: 'd.json', reason: 'JSON inválido' },
    ])
    expect(summary.tone).toBe('ok')
  })

  it('fica em tom de erro quando nada foi importado', () => {
    const fail: ImportResult = { imported: 0, skipped: 0, errors: 1, reason: 'save-failed' }
    const summary = summarizeImport([
      { fileName: 'a.json', scope: 'npc', result: fail },
      { fileName: 'b.json', scope: 'npc', result: fail },
    ])
    expect(summary.message).toBe('0 fichas importadas, 2 com erro de 2 arquivos.')
    expect(summary.tone).toBe('error')
  })
})
