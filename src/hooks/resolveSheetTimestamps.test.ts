// A âncora do rascunho local é o `updatedAt` do documento. Se ele for fabricado
// de novo a cada snapshot, a âncora nunca casa e fichas legadas ficam
// permanentemente sem rede de segurança local.

import { describe, expect, it } from 'vitest'
import { resolveSheetTimestamps, UNKNOWN_SHEET_TIMESTAMP } from './resolveSheetTimestamps'

describe('resolveSheetTimestamps', () => {
  it('repassa os valores quando o documento os tem', () => {
    expect(
      resolveSheetTimestamps('2026-01-01T00:00:00.000Z', '2026-02-02T00:00:00.000Z'),
    ).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-02T00:00:00.000Z',
    })
  })

  it('é determinístico para o mesmo documento legado (âncora estável)', () => {
    const first = resolveSheetTimestamps(undefined, undefined)
    const second = resolveSheetTimestamps(undefined, undefined)

    expect(first).toEqual(second)
    expect(first.updatedAt).toBe(UNKNOWN_SHEET_TIMESTAMP)
  })

  it('usa createdAt quando falta apenas updatedAt, em vez de inventar "agora"', () => {
    const resolved = resolveSheetTimestamps('2025-05-05T00:00:00.000Z', null)

    expect(resolved.updatedAt).toBe('2025-05-05T00:00:00.000Z')
    expect(resolveSheetTimestamps('2025-05-05T00:00:00.000Z', null)).toEqual(resolved)
  })

  it('ignora valores vazios ou de outro tipo', () => {
    expect(resolveSheetTimestamps('', 42)).toEqual({
      createdAt: UNKNOWN_SHEET_TIMESTAMP,
      updatedAt: UNKNOWN_SHEET_TIMESTAMP,
    })
  })

  it('devolve sempre ISO válido (a data alimenta exibição e ordenação)', () => {
    const { createdAt, updatedAt } = resolveSheetTimestamps(undefined, undefined)

    expect(Number.isNaN(Date.parse(createdAt))).toBe(false)
    expect(Number.isNaN(Date.parse(updatedAt))).toBe(false)
  })
})
