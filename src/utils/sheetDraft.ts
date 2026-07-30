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
export const SHEET_DRAFT_SCHEMA_VERSION = 2

/** Escopo do rascunho — separa fichas de PJ das de monstro/NPC. */
export type SheetDraftScope = 'pj' | 'monstro'

/**
 * Estados do documento remoto sobre os quais o rascunho pode ser aplicado.
 *
 * São dois porque existe uma janela real: o servidor pode já ter aplicado a
 * escrita em voo enquanto o ack ainda está em trânsito. Nesse instante o remoto
 * está em `inFlightUpdatedAt`, não em `baseUpdatedAt` — e o `updatedAt` é gerado
 * no cliente antes de a escrita sair, então esse valor é conhecido de antemão.
 */
export interface SheetDraftAnchors {
  /** `updatedAt` da última escrita CONFIRMADA que o estado local conhece. */
  baseUpdatedAt: string | null
  /** `updatedAt` que a escrita em voo vai gravar (ou `null` se não há escrita em voo). */
  inFlightUpdatedAt: string | null
}

export interface StoredSheetDraft extends SheetDraftAnchors {
  version: number
  /** Conteúdo não confiável: precisa passar por `normalize*` antes de ser usado. */
  data: unknown
  /** ISO timestamp de quando o rascunho foi gravado (relógio local). */
  savedAt: string
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

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === 'string'
}

function isStoredDraft(value: unknown): value is StoredSheetDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.savedAt === 'string' &&
    candidate.data !== undefined &&
    candidate.data !== null &&
    isNullableString(candidate.baseUpdatedAt) &&
    isNullableString(candidate.inFlightUpdatedAt)
  )
}

/**
 * Limpeza de inicialização: remove APENAS o que este build não consegue usar
 * (envelope de outra versão de formato ou string que não é sequer um envelope).
 *
 * Deliberadamente não apaga por idade: um rascunho antigo pode ser a única cópia
 * de trabalho não salvo, e apagá-lo em silêncio no boot seria perda de dados.
 * Também não faz `JSON.parse` integral — lê só o prefixo da string para achar a
 * versão, porque isso roda antes do primeiro render e as fichas podem ter
 * centenas de KB de avatar.
 */
export function purgeUnusableSheetDrafts(): number {
  const storage = getStorage()
  if (!storage) return 0

  const doomed: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || !key.startsWith(SHEET_DRAFT_PREFIX)) continue

    let versionTag: number | null = null
    try {
      // O envelope é serializado com `version` como primeira chave, então o
      // prefixo basta e não é preciso desserializar a ficha inteira.
      const prefix = (storage.getItem(key) ?? '').slice(0, 64)
      const match = /^\{"version":(\d+)/.exec(prefix)
      versionTag = match ? Number(match[1]) : null
    } catch {
      versionTag = null
    }

    if (versionTag !== SHEET_DRAFT_SCHEMA_VERSION) doomed.push(key)
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
 * Remove rascunhos inválidos, de versão desconhecida ou antigos (por padrão, mais
 * de 7 dias). Usado SOMENTE como válvula de escape quando a cota do localStorage
 * estoura — nesse ponto a alternativa é não conseguir gravar nada.
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
  anchors: SheetDraftAnchors,
  savedAt = new Date().toISOString(),
): SheetDraftWriteResult {
  const storage = getStorage()
  if (!storage) return 'unavailable'

  const key = getSheetDraftKey(scope, uid, id)
  let serialized: string

  try {
    // `version` precisa continuar sendo a primeira chave: `purgeUnusableSheetDrafts`
    // depende disso para descobrir a versão sem desserializar a ficha inteira.
    const envelope: StoredSheetDraft = {
      version: SHEET_DRAFT_SCHEMA_VERSION,
      data,
      savedAt,
      baseUpdatedAt: anchors.baseUpdatedAt,
      inFlightUpdatedAt: anchors.inFlightUpdatedAt,
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
 * outro dispositivo, com outro relógio — comparar os dois não prova nada.
 *
 * O rascunho é aplicável quando o remoto está em um dos dois estados que as
 * NOSSAS escritas produzem: a última confirmada (`baseUpdatedAt`) ou a que
 * estava em voo quando o rascunho foi gravado (`inFlightUpdatedAt`) — o servidor
 * pode ter aplicado essa última sem que o ack tenha chegado. Qualquer outro
 * `updatedAt` é escrita de terceiro (outra aba ou aparelho), e aí o remoto vence.
 */
export function isSheetDraftBasedOnRemote(
  draft: StoredSheetDraft,
  remoteUpdatedAt: string | null,
): boolean {
  if (typeof remoteUpdatedAt !== 'string' || remoteUpdatedAt.length === 0) return false

  const anchors = [draft.baseUpdatedAt, draft.inFlightUpdatedAt]

  return anchors.some(
    (anchor) => typeof anchor === 'string' && anchor.length > 0 && anchor === remoteUpdatedAt,
  )
}
