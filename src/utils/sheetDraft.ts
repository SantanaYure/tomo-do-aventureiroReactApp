// src/utils/sheetDraft.ts
// Espelho local (localStorage) das edições de ficha ainda não confirmadas no Firestore.
//
// Motivação: o autosave remoto é assíncrono e o navegador pode encerrar a página
// antes de a escrita completar (fechar aba, dormir, perder conexão). O rascunho
// local é gravado de forma síncrona, então sobrevive a esses casos e é restaurado
// na próxima abertura da ficha.

export const SHEET_DRAFT_PREFIX = 'tomo:draft:'

/** Escopo do rascunho — separa fichas de PJ das de monstro/NPC. */
export type SheetDraftScope = 'pj' | 'monstro'

export interface SheetDraftEnvelope<T> {
  /** Cópia integral da ficha no momento da gravação. */
  data: T
  /** ISO timestamp de quando o rascunho foi gravado (relógio local). */
  savedAt: string
  /** `updatedAt` do documento remoto conhecido quando o rascunho foi criado. */
  baseUpdatedAt: string | null
}

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

function isEnvelope(value: unknown): value is SheetDraftEnvelope<unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.savedAt === 'string' &&
    candidate.data !== undefined &&
    candidate.data !== null
  )
}

/**
 * Remove rascunhos antigos (por padrão, mais de 7 dias) de qualquer ficha.
 * Usado como válvula de escape quando o localStorage está cheio.
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
      if (!isEnvelope(parsed)) {
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
 * Grava o rascunho de forma síncrona. Retorna `true` quando conseguiu gravar.
 * Em caso de cota estourada, faz uma limpeza de rascunhos antigos e tenta de novo.
 */
export function writeSheetDraft<T>(
  scope: SheetDraftScope,
  uid: string,
  id: string,
  data: T,
  baseUpdatedAt: string | null,
  savedAt = new Date().toISOString(),
): boolean {
  const storage = getStorage()
  if (!storage) return false

  const key = getSheetDraftKey(scope, uid, id)
  let serialized: string

  try {
    const envelope: SheetDraftEnvelope<T> = { data, savedAt, baseUpdatedAt }
    serialized = JSON.stringify(envelope)
  } catch {
    return false
  }

  try {
    storage.setItem(key, serialized)
    return true
  } catch {
    // Cota estourada: limpa rascunhos velhos e tenta uma última vez.
    purgeStaleSheetDrafts()
    try {
      storage.setItem(key, serialized)
      return true
    } catch {
      return false
    }
  }
}

export function readSheetDraft<T>(
  scope: SheetDraftScope,
  uid: string,
  id: string,
): SheetDraftEnvelope<T> | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(getSheetDraftKey(scope, uid, id))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isEnvelope(parsed)) return null
    return parsed as SheetDraftEnvelope<T>
  } catch {
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
 * Um rascunho só é restaurado quando é mais recente que o documento remoto.
 * Ambos os timestamps são gerados pelo mesmo relógio (o cliente), então a
 * comparação é válida.
 */
export function isSheetDraftNewerThanRemote(
  draft: SheetDraftEnvelope<unknown>,
  remoteUpdatedAt: string | null,
): boolean {
  const draftMs = Date.parse(draft.savedAt)
  if (Number.isNaN(draftMs)) return false
  if (!remoteUpdatedAt) return true

  const remoteMs = Date.parse(remoteUpdatedAt)
  if (Number.isNaN(remoteMs)) return true

  return draftMs > remoteMs
}
