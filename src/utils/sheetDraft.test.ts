// Testes do espelho local: limpeza conservadora e decisão de âncora.

import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSheetDraftKey,
  isSheetDraftBasedOnRemote,
  purgeStaleSheetDrafts,
  purgeUnusableSheetDrafts,
  readSheetDraft,
  writeSheetDraft,
  SHEET_DRAFT_SCHEMA_VERSION,
  type StoredSheetDraft,
} from './sheetDraft'

const UID = 'uid-1'
const ID = 'ficha-1'
const OITO_DIAS_MS = 8 * 24 * 60 * 60 * 1000

function makeDraft(overrides: Partial<StoredSheetDraft> = {}): StoredSheetDraft {
  return {
    version: SHEET_DRAFT_SCHEMA_VERSION,
    data: { conteudo: 'trabalho não salvo' },
    savedAt: new Date().toISOString(),
    baseUpdatedAt: '2026-01-01T00:00:00.000Z',
    inFlightUpdatedAt: null,
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('D14 — limpeza de inicialização é conservadora', () => {
  it('preserva rascunho antigo com conteúdo (pode ser a única cópia)', () => {
    const key = getSheetDraftKey('pj', UID, ID)
    window.localStorage.setItem(
      key,
      JSON.stringify(makeDraft({ savedAt: new Date(Date.now() - OITO_DIAS_MS).toISOString() })),
    )

    const removed = purgeUnusableSheetDrafts()

    expect(removed).toBe(0)
    expect(readSheetDraft('pj', UID, ID)).not.toBeNull()
  })

  it('preserva rascunho cujo savedAt está no passado por relógio errado', () => {
    window.localStorage.setItem(
      getSheetDraftKey('pj', UID, ID),
      JSON.stringify(makeDraft({ savedAt: '2001-01-01T00:00:00.000Z' })),
    )

    purgeUnusableSheetDrafts()

    expect(readSheetDraft('pj', UID, ID)).not.toBeNull()
  })

  it('remove apenas o que este build não consegue usar', () => {
    const usable = getSheetDraftKey('pj', UID, ID)
    const outraVersao = getSheetDraftKey('pj', UID, 'ficha-2')
    const lixo = getSheetDraftKey('monstro', UID, 'ficha-3')

    window.localStorage.setItem(usable, JSON.stringify(makeDraft()))
    window.localStorage.setItem(
      outraVersao,
      JSON.stringify(makeDraft({ version: SHEET_DRAFT_SCHEMA_VERSION + 1 })),
    )
    window.localStorage.setItem(lixo, 'nem json é')
    window.localStorage.setItem('tomo:recentlyOpened', '{"a":"b"}')

    const removed = purgeUnusableSheetDrafts()

    expect(removed).toBe(2)
    expect(window.localStorage.getItem(usable)).not.toBeNull()
    expect(window.localStorage.getItem(outraVersao)).toBeNull()
    expect(window.localStorage.getItem(lixo)).toBeNull()
    // Não mexe em chaves que não são rascunho.
    expect(window.localStorage.getItem('tomo:recentlyOpened')).toBe('{"a":"b"}')
  })

  it('a limpeza por idade continua disponível, mas só para a válvula de cota', () => {
    window.localStorage.setItem(
      getSheetDraftKey('pj', UID, ID),
      JSON.stringify(makeDraft({ savedAt: new Date(Date.now() - OITO_DIAS_MS).toISOString() })),
    )

    expect(purgeStaleSheetDrafts()).toBe(1)
    expect(readSheetDraft('pj', UID, ID)).toBeNull()
  })
})

describe('âncoras', () => {
  it('aceita o rascunho quando o remoto está na âncora confirmada', () => {
    writeSheetDraft('pj', UID, ID, { a: 1 }, {
      baseUpdatedAt: 'U1',
      inFlightUpdatedAt: null,
    })
    const draft = readSheetDraft('pj', UID, ID)

    expect(draft).not.toBeNull()
    expect(isSheetDraftBasedOnRemote(draft as StoredSheetDraft, 'U1')).toBe(true)
    expect(isSheetDraftBasedOnRemote(draft as StoredSheetDraft, 'U2')).toBe(false)
  })

  it('aceita o rascunho quando o remoto está na âncora em voo (ack em trânsito)', () => {
    writeSheetDraft('pj', UID, ID, { a: 1 }, {
      baseUpdatedAt: 'U1',
      inFlightUpdatedAt: 'U2',
    })
    const draft = readSheetDraft('pj', UID, ID) as StoredSheetDraft

    expect(isSheetDraftBasedOnRemote(draft, 'U1')).toBe(true)
    expect(isSheetDraftBasedOnRemote(draft, 'U2')).toBe(true)
    // Escrita de terceiro: nenhuma das duas âncoras casa.
    expect(isSheetDraftBasedOnRemote(draft, 'U3')).toBe(false)
  })

  it('recusa quando não há âncora utilizável', () => {
    writeSheetDraft('pj', UID, ID, { a: 1 }, {
      baseUpdatedAt: null,
      inFlightUpdatedAt: null,
    })
    const draft = readSheetDraft('pj', UID, ID) as StoredSheetDraft

    expect(isSheetDraftBasedOnRemote(draft, 'U1')).toBe(false)
    expect(isSheetDraftBasedOnRemote(draft, null)).toBe(false)
  })
})
