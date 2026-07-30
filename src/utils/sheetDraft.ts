// src/utils/sheetDraft.ts
// Espelho local (localStorage) das edições de ficha ainda não confirmadas no Firestore.
//
// Motivação: o autosave remoto é assíncrono e o navegador pode encerrar a página
// antes de a escrita completar (fechar aba, dormir, perder conexão). O rascunho
// local é gravado de forma síncrona, então sobrevive a esses casos.
//
// O conteúdo do rascunho é DADO NÃO CONFIÁVEL: pode vir de uma versão anterior do
// app, de outra aba ou estar corrompido. Por isso `readSheetDraft` devolve
// `data: unknown` — quem lê é obrigado a normalizar/validar antes de usar, do
// mesmo modo que os dados vindos do Firestore.

export const SHEET_DRAFT_PREFIX = 'tomo:draft:'

/**
 * Versão do formato do envelope. Rascunho com versão diferente é descartado em
 * vez de adotado — trocar o formato do rascunho nunca deve travar uma ficha.
 */
export const SHEET_DRAFT_SCHEMA_VERSION = 1

/** Escopo do rascunho — separa fichas de PJ das de monstro/NPC. */
export type SheetDraftScope = 'pj' | 'monstro'

export interface StoredSheetDraft {
  version: number
  /** Conteúdo não confiável: precisa passar por `normalize*` antes de ser usado. */
  data: unknown
  /** ISO timestamp de quando o rascunho foi gravado (relógio local). */
  savedAt: string
  /**
   * `updatedAt` do documento remoto conhecido quando o rascunho foi criado.
   * É a âncora usada para decidir se o rascunho ainda é aplicável: se o remoto
   * avançou além dela, alguém escreveu depois e o rascunho está obsoleto.
   */
  baseUpdatedAt: string | null
}

/** Resultado da tentativa de gravar o rascunho. */
export type SheetDraftWriteResult = 'ok' | 'quota' | 'unavailable'

export function getSheetDraftKey(
  scope: SheetDraftScope,
  uid: string,
  id: string,
): string {
  return `${SHEET_DRAFT_PREFIX}${scope}:${uid}:${id}`
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function isStoredDraft(value: unknown): value is StoredSheetDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.savedAt === 'string' &&
    candidate.data !== undefined &&
    candidate.data !== null &&
    (candidate.baseUpdatedAt === null || typeof candidate.baseUpdatedAt === 'string')
  )
}

/**
 * Remove rascunhos inválidos, de versão desconhecida ou antigos (por padrão, mais
 * de 7 dias). Usado na inicialização (rascunhos órfãos) e como válvula de escape
 * quando a cota do localStorage estoura.
 */
export function purgeStaleSheetDrafts(maxAgeMs = 7 * 24 * 60 * 60 * 1000): number {
  const storage = getStorage()
  if (!storage) return 0

  const now = Date.now()
  const doomed: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || !key.startsWith(SHEET_DRAFT_PREFIX)) continue

    try {
      const parsed: unknown = JSON.parse(storage.getItem(key) ?? 'null')
      if (!isStoredDraft(parsed) || parsed.version !== SHEET_DRAFT_SCHEMA_VERSION) {
        doomed.push(key)
        continue
      }
      const savedAtMs = Date.parse(parsed.savedAt)
      if (Number.isNaN(savedAtMs) || now - savedAtMs > maxAgeMs) {
        doomed.push(key)
      }
    } catch {
      doomed.push(key)
    }
  }

  for (const key of doomed) {
    try {
      storage.removeItem(key)
    } catch {
      // ignora
    }
  }

  return doomed.length
}

/**
 * Grava o rascunho de forma síncrona.
 *
 * Em caso de cota estourada, limpa rascunhos inválidos/antigos e tenta de novo.
 * NÃO apaga rascunhos recentes de outras fichas: eles podem conter trabalho não
 * salvo, e trocar uma perda por outra em silêncio é pior do que avisar. Quando
 * nem assim couber, devolve `'quota'` para que a interface possa alertar.
 */
export function writeSheetDraft(
  scope: SheetDraftScope,
  uid: string,
  id: string,
  data: unknown,
  baseUpdatedAt: string | null,
  savedAt = new Date().toISOString(),
): SheetDraftWriteResult {
  const storage = getStorage()
  if (!storage) return 'unavailable'

  const key = getSheetDraftKey(scope, uid, id)
  let serialized: string

  try {
    const envelope: StoredSheetDraft = {
      version: SHEET_DRAFT_SCHEMA_VERSION,
      data,
      savedAt,
      baseUpdatedAt,
    }
    serialized = JSON.stringify(envelope)
  } catch {
    return 'unavailable'
  }

  try {
    storage.setItem(key, serialized)
    return 'ok'
  } catch {
    purgeStaleSheetDrafts()
    try {
      storage.setItem(key, serialized)
      return 'ok'
    } catch {
      return 'quota'
    }
  }
}

/**
 * Lê o rascunho. Envelope inválido ou de versão desconhecida é removido e tratado
 * como inexistente — nunca é devolvido para adoção.
 */
export function readSheetDraft(
  scope: SheetDraftScope,
  uid: string,
  id: string,
): StoredSheetDraft | null {
  const storage = getStorage()
  if (!storage) return null

  const key = getSheetDraftKey(scope, uid, id)

  try {
    const raw = storage.getItem(key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)

    if (!isStoredDraft(parsed) || parsed.version !== SHEET_DRAFT_SCHEMA_VERSION) {
      storage.removeItem(key)
      return null
    }

    return parsed
  } catch {
    try {
      storage.removeItem(key)
    } catch {
      // ignora
    }
    return null
  }
}

export function clearSheetDraft(
  scope: SheetDraftScope,
  uid: string,
  id: string,
): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(getSheetDraftKey(scope, uid, id))
  } catch {
    // ignora
  }
}

/**
 * Decide se o rascunho ainda pode ser aplicado sobre o documento remoto atual.
 *
 * A decisão é por ÂNCORA, não por comparação de timestamps: `savedAt` vem do
 * relógio de quem gravou o rascunho e `updatedAt` pode ter sido escrito por
 * outro dispositivo, com outro relógio — comparar os dois não prova nada. O
 * rascunho só é aplicável quando o remoto continua exatamente no ponto em que
 * estava quando o rascunho foi criado. Se avançou, houve escrita posterior
 * (outra aba ou outro aparelho) e o remoto vence.
 */
export function isSheetDraftBasedOnRemote(
  draft: StoredSheetDraft,
  remoteUpdatedAt: string | null,
): boolean {
  if (typeof draft.baseUpdatedAt !== 'string' || draft.baseUpdatedAt.length === 0) {
    return false
  }
  return draft.baseUpdatedAt === remoteUpdatedAt
}
