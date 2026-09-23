import { beforeEach, describe, expect, it, vi } from 'vitest'

const deleteCharacterSheet = vi.fn(async (_uid: string, _id: string) => {})
const deleteMonsterSheet = vi.fn(async (_uid: string, _id: string) => {})
const releaseCharacter = vi.fn(async (_c: string, _u: string, _id: string) => {})
const releaseMonster = vi.fn(async (_c: string, _u: string, _id: string) => {})

vi.mock('../store/characterSheetStore', () => ({
  deleteCharacterSheet: (uid: string, id: string) => deleteCharacterSheet(uid, id),
}))
vi.mock('../store/monsterSheetStore', () => ({
  deleteMonsterSheet: (uid: string, id: string) => deleteMonsterSheet(uid, id),
}))
vi.mock('../store/campaignStore', () => ({
  releaseCharacterSheetFromCampaign: (c: string, u: string, id: string) => releaseCharacter(c, u, id),
  releaseMonsterSheetFromCampaign: (c: string, u: string, id: string) => releaseMonster(c, u, id),
}))

const { deleteSheets, sheetKey, summarizeDelete } = await import('./deleteSheets')
import type { SheetDeleteTarget } from './deleteSheets'

const pj = (id: string, campaignId: string | null = null): SheetDeleteTarget => ({
  type: 'character', id, name: `PJ ${id}`, campaignId,
})
const mon = (id: string, campaignId: string | null = null): SheetDeleteTarget => ({
  type: 'monster', id, name: `Monstro ${id}`, campaignId,
})

beforeEach(() => {
  for (const fn of [deleteCharacterSheet, deleteMonsterSheet, releaseCharacter, releaseMonster]) fn.mockClear()
})

describe('sheetKey', () => {
  it('separa o mesmo id em coleções diferentes', () => {
    expect(sheetKey('character', 'x')).not.toBe(sheetKey('monster', 'x'))
  })
})

describe('deleteSheets', () => {
  it('exclui cada ficha na coleção certa, em sequência, avisando o progresso', async () => {
    const progress = vi.fn()
    const outcomes = await deleteSheets('u', [pj('1'), mon('2'), mon('3')], progress)

    expect(deleteCharacterSheet).toHaveBeenCalledWith('u', '1')
    expect(deleteMonsterSheet.mock.calls.map((c) => c[1])).toEqual(['2', '3'])
    expect(progress.mock.calls.map(([done, total]) => [done, total])).toEqual([[0, 3], [1, 3], [2, 3]])
    expect(outcomes.every((o) => o.ok)).toBe(true)
  })

  it('libera a ficha da mesa antes de excluir', async () => {
    const order: string[] = []
    releaseCharacter.mockImplementationOnce(async () => { order.push('liberar') })
    deleteCharacterSheet.mockImplementationOnce(async () => { order.push('excluir') })

    await deleteSheets('u', [pj('1', 'mesa-1'), mon('2', 'mesa-2')])

    expect(order).toEqual(['liberar', 'excluir'])
    expect(releaseCharacter).toHaveBeenCalledWith('mesa-1', 'u', '1')
    expect(releaseMonster).toHaveBeenCalledWith('mesa-2', 'u', '2')
  })

  it('uma falha não interrompe as outras', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteMonsterSheet.mockRejectedValueOnce(new Error('offline'))

    const outcomes = await deleteSheets('u', [mon('1'), mon('2'), pj('3')])

    expect(outcomes.map((o) => o.ok)).toEqual([false, true, true])
    error.mockRestore()
  })
})

describe('summarizeDelete', () => {
  const ok = (t: SheetDeleteTarget) => ({ target: t, ok: true })
  const fail = (t: SheetDeleteTarget) => ({ target: t, ok: false })

  it('não avisa nada quando uma ficha só sai com sucesso', () => {
    expect(summarizeDelete([ok(pj('1'))])).toBeNull()
  })

  it('explica quando uma ficha só não sai', () => {
    const summary = summarizeDelete([fail(pj('1'))])
    expect(summary?.message).toBe('Não conseguimos excluir "PJ 1" agora. Confira sua internet e tente de novo.')
    expect(summary?.tone).toBe('error')
  })

  it('confirma quando todas saem', () => {
    expect(summarizeDelete([ok(pj('1')), ok(mon('2')), ok(mon('3'))])?.message).toBe(
      'Pronto! 3 fichas foram excluídas.',
    )
  })

  it('com parte, diz quantas saíram e lista as que ficaram', () => {
    const summary = summarizeDelete([ok(pj('1')), ok(mon('2')), fail(mon('3'))])
    expect(summary?.message).toBe('2 de 3 fichas foram excluídas. Veja o que aconteceu com a outra:')
    expect(summary?.problems).toEqual([
      { fileName: 'Monstro 3', reason: 'não conseguimos excluir agora; confira sua internet e tente de novo' },
    ])
  })

  it('fica em tom de erro quando nenhuma sai', () => {
    const summary = summarizeDelete([fail(pj('1')), fail(mon('2'))])
    expect(summary?.message).toBe('Não conseguimos excluir essas fichas. Veja o que aconteceu com cada uma:')
    expect(summary?.tone).toBe('error')
  })
})
