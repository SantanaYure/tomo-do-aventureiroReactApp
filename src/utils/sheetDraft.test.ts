// Testes do espelho local: limpeza conservadora e decisão de âncora.

import { beforeEach, describe, expect, it } from 'vitest'
import {
  getSheetDraftKey,
  isSheetDraftBasedOnRemote,
  purgeStaleSheetDrafts,
  purgeUnusableSheetDrafts,
  readSheetDraft,
  writeSheetDraft,
  SHEET_DRAFT_PREFIX,
  SHEET_DRAFT_SCHEMA_VERSION,
  type StoredSheetDraft,
} from './sheetDraft'

const UID = 'uid-1'
const ID = 'ficha-1'
const OITO_DIAS_MS = 8 * 24 * 60 * 60 * 1000
const CONTEUDO = { conteudo: 'trabalho não salvo' }
const ANCORAS = { baseUpdatedAt: '2026-01-01T00:00:00.000Z', inFlightUpdatedAt: null }

/**
 * Grava usando o ESCRITOR DE PRODUÇÃO. Nenhum teste deste arquivo monta o
 * envelope à mão: um teste que constrói sua própria versão do dado fixa o
 * formato do helper de teste, não o do produtor real — e foi assim que a purga
 * chegou a depender da ordem das chaves sem nenhum teste perceber.
 */
function gravarRascunho(id = ID, savedAt?: string) {
  return writeSheetDraft('pj', UID, id, CONTEUDO, ANCORAS, savedAt)
}

/** Chave de uma versão de formato que este build não conhece. */
function chaveDeOutraVersao(id: string) {
  return getSheetDraftKey('pj', UID, id).replace(
    `v${SHEET_DRAFT_SCHEMA_VERSION}:`,
    `v${SHEET_DRAFT_SCHEMA_VERSION + 1}:`,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('R3-D — ida e volta pelo produtor de produção', () => {
  it('rascunho recém-gravado sobrevive à purga de boot e volta legível', () => {
    expect(gravarRascunho()).toBe('ok')

    const removidos = purgeUnusableSheetDrafts()

    expect(removidos).toBe(0)
    const draft = readSheetDraft('pj', UID, ID)
    expect(draft).not.toBeNull()
    expect(draft?.data).toEqual(CONTEUDO)
    expect(draft?.baseUpdatedAt).toBe(ANCORAS.baseUpdatedAt)
    expect(draft?.inFlightUpdatedAt).toBeNull()
    expect(draft?.version).toBe(SHEET_DRAFT_SCHEMA_VERSION)
  })

  it('vários rascunhos gravados pelo produtor sobrevivem juntos', () => {
    gravarRascunho('ficha-1')
    gravarRascunho('ficha-2')
    expect(writeSheetDraft('monstro', UID, 'monstro-1', CONTEUDO, ANCORAS)).toBe('ok')

    expect(purgeUnusableSheetDrafts()).toBe(0)

    expect(readSheetDraft('pj', UID, 'ficha-1')).not.toBeNull()
    expect(readSheetDraft('pj', UID, 'ficha-2')).not.toBeNull()
    expect(readSheetDraft('monstro', UID, 'monstro-1')).not.toBeNull()
  })

  it('a purga não depende de nada do conteúdo do envelope', () => {
    gravarRascunho()
    const gravado = window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))

    purgeUnusableSheetDrafts()

    // Byte a byte intacto: a purga só olha nomes de chave.
    expect(window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))).toBe(gravado)
  })
})

describe('D14 — limpeza de inicialização é conservadora', () => {
  it('preserva rascunho antigo com conteúdo (pode ser a única cópia)', () => {
    gravarRascunho(ID, new Date(Date.now() - OITO_DIAS_MS).toISOString())

    const removed = purgeUnusableSheetDrafts()

    expect(removed).toBe(0)
    expect(readSheetDraft('pj', UID, ID)).not.toBeNull()
  })

  it('preserva rascunho cujo savedAt está no passado por relógio errado', () => {
    gravarRascunho(ID, '2001-01-01T00:00:00.000Z')

    purgeUnusableSheetDrafts()

    expect(readSheetDraft('pj', UID, ID)).not.toBeNull()
  })

  it('remove apenas o que este build não consegue usar', () => {
    gravarRascunho(ID)

    // Entradas que o build atual não produz: versão de formato desconhecida e
    // chave legada sem versão nenhuma.
    const outraVersao = chaveDeOutraVersao('ficha-2')
    const chaveLegada = `${SHEET_DRAFT_PREFIX}pj:${UID}:ficha-3`
    window.localStorage.setItem(outraVersao, '{"seja o que for":1}')
    window.localStorage.setItem(chaveLegada, '{"version":1,"data":{}}')
    window.localStorage.setItem('tomo:recentlyOpened', '{"a":"b"}')

    const removed = purgeUnusableSheetDrafts()

    expect(removed).toBe(2)
    expect(readSheetDraft('pj', UID, ID)).not.toBeNull()
    expect(window.localStorage.getItem(outraVersao)).toBeNull()
    expect(window.localStorage.getItem(chaveLegada)).toBeNull()
    // Não mexe em chaves que não são rascunho.
    expect(window.localStorage.getItem('tomo:recentlyOpened')).toBe('{"a":"b"}')
  })

  it('a limpeza por idade continua disponível, mas só para a válvula de cota', () => {
    gravarRascunho(ID, new Date(Date.now() - OITO_DIAS_MS).toISOString())

    expect(purgeStaleSheetDrafts()).toBe(1)
    expect(readSheetDraft('pj', UID, ID)).toBeNull()
  })
})

describe('leitura valida o envelope (defesa em profundidade)', () => {
  it('rejeita valor com versão divergente sob chave da versão atual', () => {
    // Único caso que exige montar o dado à mão: por definição o produtor deste
    // build não emite envelope de outra versão.
    const foraDeForma: StoredSheetDraft = {
      version: SHEET_DRAFT_SCHEMA_VERSION + 1,
      data: CONTEUDO,
      savedAt: new Date().toISOString(),
      baseUpdatedAt: null,
      inFlightUpdatedAt: null,
    }
    window.localStorage.setItem(getSheetDraftKey('pj', UID, ID), JSON.stringify(foraDeForma))

    expect(readSheetDraft('pj', UID, ID)).toBeNull()
    expect(window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))).toBeNull()
  })

  it('rejeita e remove valor corrompido', () => {
    window.localStorage.setItem(getSheetDraftKey('pj', UID, ID), 'nem json é')

    expect(readSheetDraft('pj', UID, ID)).toBeNull()
    expect(window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))).toBeNull()
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
