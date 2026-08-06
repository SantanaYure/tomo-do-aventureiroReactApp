// Testes de escrita eficiente (P3): o autosave não deve fazer um `getDoc`
// antes de cada `setDoc` só para preservar o `createdAt`.

import { beforeEach, describe, expect, it, vi } from 'vitest'

const setDoc = vi.fn().mockResolvedValue(undefined)
const getDoc = vi.fn()
const addDoc = vi.fn().mockResolvedValue({ id: 'novo' })
const deleteDoc = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => ({
  collection: (...path: unknown[]) => ({ type: 'collection', path }),
  doc: (...path: unknown[]) => ({ type: 'doc', path }),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  addDoc: (...args: unknown[]) => addDoc(...args),
  deleteDoc: (...args: unknown[]) => deleteDoc(...args),
}))

vi.mock('../services/firebase', () => ({ db: { type: 'firestore-mock' }, auth: {} }))

const { saveCharacterSheet } = await import('./characterSheetStore')
const { createDefaultCharacterSheet } = await import('./defaultCharacterSheet')
const { saveMonsterSheet, createDefaultMonsterSheet } = await import('./monsterSheetStore')

type SavedPayload = {
  id: string
  name_lower: string
  createdAt: string
  updatedAt: string
  data: unknown
}

function lastPayload(): SavedPayload {
  const calls = setDoc.mock.calls
  const call = calls[calls.length - 1]
  return call?.[1] as SavedPayload
}

beforeEach(() => {
  setDoc.mockClear()
  getDoc.mockClear()
})

describe('saveCharacterSheet', () => {
  it('não faz leitura extra quando o createdAt é conhecido', async () => {
    const sheet = createDefaultCharacterSheet()
    sheet.character.name = 'Aldric Pedravinda'

    await saveCharacterSheet('uid-1', 'ficha-1', sheet, '2026-01-01T00:00:00.000Z')

    expect(getDoc).not.toHaveBeenCalled()
    expect(setDoc).toHaveBeenCalledTimes(1)

    const payload = lastPayload()
    expect(payload.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(payload.id).toBe('ficha-1')
    // O campo de busca continua sendo gerado em toda escrita.
    expect(payload.name_lower).toBe('aldric pedravinda')
    expect(typeof payload.updatedAt).toBe('string')
  })

  it('recorre ao getDoc apenas quando o createdAt não é informado', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ createdAt: '2025-06-06T00:00:00.000Z' }),
    })

    await saveCharacterSheet('uid-1', 'ficha-1', createDefaultCharacterSheet())

    expect(getDoc).toHaveBeenCalledTimes(1)
    expect(lastPayload().createdAt).toBe('2025-06-06T00:00:00.000Z')
  })

  it('usa o timestamp atual quando o documento ainda não existe', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => undefined })

    await saveCharacterSheet('uid-1', 'ficha-nova', createDefaultCharacterSheet())

    const payload = lastPayload()
    expect(payload.createdAt).toBe(payload.updatedAt)
  })

  it('ignora createdAt vazio e cai no fallback', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ createdAt: '2025-01-01T00:00:00.000Z' }),
    })

    await saveCharacterSheet('uid-1', 'ficha-1', createDefaultCharacterSheet(), '   ')

    expect(getDoc).toHaveBeenCalledTimes(1)
    expect(lastPayload().createdAt).toBe('2025-01-01T00:00:00.000Z')
  })
})

describe('saveMonsterSheet', () => {
  it('não faz leitura extra quando o createdAt é conhecido e mantém name_lower', async () => {
    const monster = createDefaultMonsterSheet()
    monster.details.name = 'Dragão Vermelho Ancião'

    await saveMonsterSheet('uid-1', 'monstro-1', monster, '2026-02-02T00:00:00.000Z')

    expect(getDoc).not.toHaveBeenCalled()
    expect(setDoc).toHaveBeenCalledTimes(1)

    const payload = lastPayload()
    expect(payload.createdAt).toBe('2026-02-02T00:00:00.000Z')
    expect(payload.name_lower).toBe('dragão vermelho ancião')
  })

  it('recorre ao getDoc apenas quando o createdAt não é informado', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ createdAt: '2025-03-03T00:00:00.000Z' }),
    })

    await saveMonsterSheet('uid-1', 'monstro-1', createDefaultMonsterSheet())

    expect(getDoc).toHaveBeenCalledTimes(1)
    expect(lastPayload().createdAt).toBe('2025-03-03T00:00:00.000Z')
  })
})
