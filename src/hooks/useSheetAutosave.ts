// src/hooks/useSheetAutosave.ts
// Camada de estado + persistência compartilhada pelas fichas de PJ e de monstro/NPC.
//
// Responsabilidades:
//  1. Guardar a cópia local editável da ficha (adotada do snapshot do Firestore).
//  2. Autosave com debounce de 800ms E teto de espera (maxWait) de 3s — digitação
//     contínua sem pausa ainda resulta em escrita periódica.
//  3. Espelho local em localStorage gravado de forma síncrona, para que fechar a
//     aba / perder conexão não perca trabalho (o flush remoto pode não completar).
//  4. Status de salvamento honesto (`pending` ≠ `saving` ≠ `saved`) e retry com
//     backoff limitado em caso de falha de escrita.
//  5. Histórico de undo/redo agrupado por pausa, com atalhos Ctrl/Cmd+Z.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SavingStatus } from '../types/savingStatus'
import {
  clearSheetDraft,
  isSheetDraftNewerThanRemote,
  readSheetDraft,
  writeSheetDraft,
  type SheetDraftScope,
} from '../utils/sheetDraft'

/** Espera após a última edição antes de escrever (decisão documentada no CLAUDE.md). */
export const SAVE_DEBOUNCE_MS = 800
/** Teto de espera: digitação contínua sem pausa ainda salva a cada 3s. */
export const SAVE_MAX_WAIT_MS = 3000
/** Intervalo mínimo entre gravações do rascunho local durante digitação. */
export const DRAFT_THROTTLE_MS = 500
/** Número máximo de snapshots no histórico de undo. */
export const HISTORY_LIMIT = 50
/** Edições dentro dessa janela viram UMA única entrada de histórico. */
export const HISTORY_GROUP_MS = 700
/** Backoff das tentativas automáticas após falha de escrita. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000]

export interface RemoteSheetSnapshot<T> {
  data: T
  createdAt: string
  updatedAt: string
}

export type SheetSaveFn<T> = (
  uid: string,
  id: string,
  data: T,
  createdAt?: string,
) => Promise<void>

export interface UseSheetAutosaveOptions<T> {
  uid: string | null
  id: string | null
  /** Snapshot vindo do `onSnapshot` do Firestore (ou `null` enquanto carrega). */
  remote: RemoteSheetSnapshot<T> | null
  scope: SheetDraftScope
  save: SheetSaveFn<T>
  debounceMs?: number
  maxWaitMs?: number
  historyLimit?: number
  historyGroupMs?: number
  retryDelaysMs?: number[]
}

export interface UseSheetAutosaveResult<T> {
  sheet: T | null
  /** Aplica uma edição: atualiza o estado local, o rascunho e agenda a escrita. */
  commit: (updater: T | ((current: T) => T)) => void
  savingStatus: SavingStatus
  /** Força a escrita do que está pendente agora (sem esperar o debounce). */
  flushNow: () => void
  /** Nova tentativa manual depois de um erro de escrita. */
  retry: () => void
  /** Descarta edições pendentes e o rascunho local (usado antes de excluir a ficha). */
  discardPending: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** ISO timestamp do rascunho recuperado no carregamento, ou `null`. */
  recoveredDraftAt: string | null
  dismissRecovery: () => void
}

type HistoryStacks<T> = { past: T[]; future: T[] }

function isUpdaterFn<T>(value: T | ((current: T) => T)): value is (current: T) => T {
  return typeof value === 'function'
}

export function useSheetAutosave<T>(
  options: UseSheetAutosaveOptions<T>,
): UseSheetAutosaveResult<T> {
  const {
    uid,
    id,
    remote,
    scope,
    save,
    debounceMs = SAVE_DEBOUNCE_MS,
    maxWaitMs = SAVE_MAX_WAIT_MS,
    historyLimit = HISTORY_LIMIT,
    historyGroupMs = HISTORY_GROUP_MS,
    retryDelaysMs = RETRY_DELAYS_MS,
  } = options

  const [sheet, setSheetState] = useState<T | null>(null)
  const [savingStatus, setSavingStatusState] = useState<SavingStatus>('idle')
  const [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0 })
  const [recoveredDraftAt, setRecoveredDraftAt] = useState<string | null>(null)

  // ── Refs (acesso síncrono ao estado mais recente em listeners e timers) ────
  const sheetRef = useRef<T | null>(null)
  const pendingRef = useRef<T | null>(null)
  const draftDataRef = useRef<T | null>(null)
  const inFlightRef = useRef(false)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)
  const adoptedRef = useRef(false)
  const createdAtRef = useRef<string | null>(null)
  const baseUpdatedAtRef = useRef<string | null>(null)
  const historyRef = useRef<HistoryStacks<T>>({ past: [], future: [] })
  const lastHistoryAtRef = useRef(0)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const uidRef = useRef(uid)
  const idRef = useRef(id)
  const scopeRef = useRef(scope)
  const saveRef = useRef(save)
  uidRef.current = uid
  idRef.current = id
  scopeRef.current = scope
  saveRef.current = save

  const configRef = useRef({ debounceMs, maxWaitMs, historyLimit, historyGroupMs, retryDelaysMs })
  configRef.current = { debounceMs, maxWaitMs, historyLimit, historyGroupMs, retryDelaysMs }

  // ── Helpers básicos ────────────────────────────────────────────────────────

  const setStatus = useCallback((next: SavingStatus) => {
    if (!mountedRef.current) return
    setSavingStatusState((current) => (current === next ? current : next))
  }, [])

  const applyLocal = useCallback((next: T | null) => {
    sheetRef.current = next
    if (mountedRef.current) setSheetState(next)
  }, [])

  const syncHistoryCounts = useCallback(() => {
    if (!mountedRef.current) return
    const { past, future } = historyRef.current
    setHistoryCounts((current) =>
      current.past === past.length && current.future === future.length
        ? current
        : { past: past.length, future: future.length },
    )
  }, [])

  const clearSaveTimers = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (maxWaitTimerRef.current !== null) {
      clearTimeout(maxWaitTimerRef.current)
      maxWaitTimerRef.current = null
    }
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  // ── Rascunho local ─────────────────────────────────────────────────────────

  const writeDraftNow = useCallback((data: T) => {
    const currentUid = uidRef.current
    const currentId = idRef.current
    if (!currentUid || !currentId) return
    writeSheetDraft(scopeRef.current, currentUid, currentId, data, baseUpdatedAtRef.current)
  }, [])

  /**
   * Grava o rascunho na borda de subida (primeira edição da rajada) e depois no
   * máximo a cada `DRAFT_THROTTLE_MS`. Isso evita serializar a ficha inteira
   * (que pode conter avatar base64) a cada tecla e travar a interface.
   */
  const writeDraftThrottled = useCallback(
    (data: T) => {
      draftDataRef.current = data

      if (draftTimerRef.current !== null) return

      writeDraftNow(data)
      draftTimerRef.current = setTimeout(() => {
        draftTimerRef.current = null
        const latest = draftDataRef.current
        if (latest !== null && latest !== data) writeDraftNow(latest)
      }, DRAFT_THROTTLE_MS)
    },
    [writeDraftNow],
  )

  const clearDraft = useCallback(() => {
    const currentUid = uidRef.current
    const currentId = idRef.current
    if (!currentUid || !currentId) return
    clearSheetDraft(scopeRef.current, currentUid, currentId)
  }, [])

  // ── Escrita remota ─────────────────────────────────────────────────────────

  const runSave = useCallback(() => {
    clearSaveTimers()

    const data = pendingRef.current
    const currentUid = uidRef.current
    const currentId = idRef.current

    if (data === null || !currentUid || !currentId) return

    // Já existe uma escrita em voo: o handler de conclusão reagenda o pendente.
    if (inFlightRef.current) return

    pendingRef.current = null
    inFlightRef.current = true
    setStatus('saving')

    // IIFE async: normaliza retornos não-Promise e erros lançados de forma
    // síncrona pela função de save.
    void (async () =>
      saveRef.current(currentUid, currentId, data, createdAtRef.current ?? undefined))()
      .then(() => {
        inFlightRef.current = false
        retryCountRef.current = 0

        if (pendingRef.current !== null) {
          setStatus('pending')
          scheduleSaveRef.current()
          return
        }

        clearDraft()
        setStatus('saved')
      })
      .catch(() => {
        inFlightRef.current = false

        // Nada é descartado: o dado volta para a fila e o rascunho local fica.
        if (pendingRef.current === null) {
          pendingRef.current = data
          draftDataRef.current = data
        }
        const queued = pendingRef.current
        if (queued !== null) writeDraftNow(queued)

        const delays = configRef.current.retryDelaysMs
        if (retryCountRef.current < delays.length) {
          const delay = delays[retryCountRef.current]
          retryCountRef.current += 1
          setStatus('saving')
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null
            runSaveRef.current()
          }, delay)
          return
        }

        setStatus('error')
      })
  }, [clearDraft, clearSaveTimers, setStatus, writeDraftNow])

  const runSaveRef = useRef(runSave)
  runSaveRef.current = runSave

  const scheduleSave = useCallback(() => {
    const { debounceMs: debounce, maxWaitMs: maxWait } = configRef.current

    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      runSaveRef.current()
    }, debounce)

    // O teto NÃO é reiniciado a cada edição — é isso que garante escrita durante
    // digitação contínua sem nenhuma pausa de `debounce`.
    if (maxWaitTimerRef.current === null) {
      maxWaitTimerRef.current = setTimeout(() => {
        maxWaitTimerRef.current = null
        runSaveRef.current()
      }, maxWait)
    }
  }, [])

  const scheduleSaveRef = useRef(scheduleSave)
  scheduleSaveRef.current = scheduleSave

  // ── Histórico ──────────────────────────────────────────────────────────────

  /**
   * Empilha o estado anterior apenas quando a edição inicia uma nova "rajada".
   * Sem isso, cada caractere digitado geraria uma entrada e o undo ficaria
   * inútil (50 undos = 50 letras).
   *
   * Nota sobre memória: os snapshots são cópias rasas encadeadas — o avatar
   * base64 é a MESMA referência de string em todos eles, então o histórico
   * custa a espinha de objetos, não N cópias da imagem.
   */
  const pushHistory = useCallback(
    (previous: T) => {
      const now = Date.now()
      const { historyLimit: limit, historyGroupMs: groupMs } = configRef.current

      if (now - lastHistoryAtRef.current > groupMs) {
        const { past } = historyRef.current
        past.push(previous)
        while (past.length > limit) past.shift()
        historyRef.current.future = []
        syncHistoryCounts()
      }

      lastHistoryAtRef.current = now
    },
    [syncHistoryCounts],
  )

  const commit = useCallback(
    (updater: T | ((current: T) => T)) => {
      const current = sheetRef.current
      if (current === null) return
      if (!uidRef.current || !idRef.current) return

      const next = isUpdaterFn(updater) ? updater(current) : updater
      if (next === current) return

      pushHistory(current)
      applyLocal(next)
      pendingRef.current = next
      // Uma nova edição merece um novo orçamento de tentativas, mesmo que a
      // escrita anterior tenha esgotado o backoff.
      retryCountRef.current = 0
      setStatus('pending')
      writeDraftThrottled(next)
      scheduleSaveRef.current()
    },
    [applyLocal, pushHistory, setStatus, writeDraftThrottled],
  )

  const applyHistoryState = useCallback(
    (next: T) => {
      applyLocal(next)
      pendingRef.current = next
      setStatus('pending')
      // Undo/redo entram no mesmo debounce: uma sequência rápida de undos gera
      // uma única escrita, não uma tempestade.
      writeDraftThrottled(next)
      scheduleSaveRef.current()
      // Próxima edição do usuário inicia um novo grupo de histórico.
      lastHistoryAtRef.current = 0
      syncHistoryCounts()
    },
    [applyLocal, setStatus, syncHistoryCounts, writeDraftThrottled],
  )

  const undo = useCallback(() => {
    const { past, future } = historyRef.current
    if (past.length === 0) return

    const previous = past.pop() as T
    const current = sheetRef.current
    if (current !== null) future.push(current)

    applyHistoryState(previous)
  }, [applyHistoryState])

  const redo = useCallback(() => {
    const { past, future } = historyRef.current
    if (future.length === 0) return

    const next = future.pop() as T
    const current = sheetRef.current
    if (current !== null) past.push(current)

    applyHistoryState(next)
  }, [applyHistoryState])

  // ── Flush / retry / descarte ───────────────────────────────────────────────

  const flushNow = useCallback(() => {
    // Ordem importa: o rascunho local é síncrono e é a única garantia real
    // quando o navegador encerra a página antes de a escrita remota completar.
    const data = pendingRef.current ?? draftDataRef.current
    if (data !== null) writeDraftNow(data)
    if (pendingRef.current !== null) runSaveRef.current()
  }, [writeDraftNow])

  const flushRef = useRef(flushNow)
  flushRef.current = flushNow

  const retry = useCallback(() => {
    retryCountRef.current = 0
    if (pendingRef.current === null) {
      const fallback = sheetRef.current
      if (fallback === null) return
      pendingRef.current = fallback
    }
    runSaveRef.current()
  }, [])

  const discardPending = useCallback(() => {
    clearSaveTimers()
    if (draftTimerRef.current !== null) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    pendingRef.current = null
    draftDataRef.current = null
    clearDraft()
  }, [clearDraft, clearSaveTimers])

  const dismissRecovery = useCallback(() => setRecoveredDraftAt(null), [])

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  // Troca de ficha: zera todo o estado de persistência.
  useEffect(() => {
    adoptedRef.current = false
    clearSaveTimers()
    if (draftTimerRef.current !== null) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    pendingRef.current = null
    draftDataRef.current = null
    inFlightRef.current = false
    retryCountRef.current = 0
    historyRef.current = { past: [], future: [] }
    lastHistoryAtRef.current = 0
    createdAtRef.current = null
    baseUpdatedAtRef.current = null
    sheetRef.current = null
    setSheetState(null)
    setSavingStatusState('idle')
    setHistoryCounts({ past: 0, future: 0 })
    setRecoveredDraftAt(null)
  }, [uid, id, clearSaveTimers])

  // Adoção do snapshot remoto + restauração de rascunho mais recente.
  useEffect(() => {
    if (!remote) return

    createdAtRef.current = remote.createdAt
    baseUpdatedAtRef.current = remote.updatedAt

    if (adoptedRef.current) return
    adoptedRef.current = true

    const currentUid = uidRef.current
    const currentId = idRef.current
    const draft =
      currentUid && currentId
        ? readSheetDraft<T>(scopeRef.current, currentUid, currentId)
        : null

    if (draft && isSheetDraftNewerThanRemote(draft, remote.updatedAt)) {
      applyLocal(draft.data)
      draftDataRef.current = draft.data
      pendingRef.current = draft.data
      setRecoveredDraftAt(draft.savedAt)
      setStatus('pending')
      scheduleSaveRef.current()
      return
    }

    if (draft) clearDraft()
    applyLocal(remote.data)
  }, [remote, applyLocal, clearDraft, setStatus])

  // Flush em eventos de encerramento da página.
  useEffect(() => {
    function handlePageHide() {
      flushRef.current()
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') flushRef.current()
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Atalhos de teclado. Interceptamos globalmente porque os campos da ficha são
  // inputs controlados — o undo nativo do navegador não funciona neles.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()

      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }

      if (key === 'y') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [redo, undo])

  // Desmontagem: flush do pendente (antes o timer era apenas cancelado, o que
  // descartava a última edição).
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      flushRef.current()
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
      if (maxWaitTimerRef.current !== null) clearTimeout(maxWaitTimerRef.current)
      if (draftTimerRef.current !== null) clearTimeout(draftTimerRef.current)
      if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current)
    }
  }, [])

  return {
    sheet,
    commit,
    savingStatus,
    flushNow,
    retry,
    discardPending,
    undo,
    redo,
    canUndo: historyCounts.past > 0,
    canRedo: historyCounts.future > 0,
    recoveredDraftAt,
    dismissRecovery,
  }
}
