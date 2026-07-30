// src/hooks/useSheetAutosave.ts
// Camada de estado + persistência compartilhada pelas fichas de PJ e de monstro/NPC.
//
// Responsabilidades:
//  1. Guardar a cópia local editável da ficha (adotada do snapshot do Firestore).
//  2. Autosave com debounce de 800ms E teto de espera (maxWait) de 3s — digitação
//     contínua sem pausa ainda resulta em escrita periódica.
//  3. Espelho local em localStorage gravado de forma síncrona, para que fechar a
//     aba / perder conexão não perca trabalho (o flush remoto pode não completar).
//  4. Status de salvamento honesto (`pending` ≠ `saving` ≠ `saved`), watchdog para
//     escrita presa e retry com backoff limitado.
//  5. Histórico de undo/redo agrupado por pausa, com atalhos Ctrl/Cmd+Z.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SavingStatus } from '../types/savingStatus'
import {
  clearSheetDraft,
  isSheetDraftBasedOnRemote,
  readSheetDraft,
  writeSheetDraft,
  type SheetDraftScope,
  type SheetDraftWriteResult,
} from '../utils/sheetDraft'

/** Espera após a última edição antes de escrever (decisão documentada no CLAUDE.md). */
export const SAVE_DEBOUNCE_MS = 800
/** Teto de espera: digitação contínua sem pausa ainda salva a cada 3s. */
export const SAVE_MAX_WAIT_MS = 3000
/**
 * Tempo máximo que uma escrita pode ficar em voo antes de ser considerada presa.
 * A promise do `setDoc` só resolve com confirmação do servidor, então offline ela
 * pode nunca resolver — sem esse watchdog o autosave ficaria parado para sempre.
 */
export const SAVE_TIMEOUT_MS = 10000
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

/**
 * Persiste a ficha. Quando devolve uma string, ela é o `updatedAt` gravado — usado
 * para reancorar o rascunho local na escrita que acabou de ser confirmada, para
 * que o avanço do documento remoto causado por nós mesmos não seja confundido com
 * a escrita de outra aba/aparelho.
 */
export type SheetSaveFn<T> = (
  uid: string,
  id: string,
  data: T,
  createdAt?: string,
) => Promise<string | void>

/** Motivo pelo qual a cópia local de segurança não pôde ser gravada. */
export type LocalBackupError = 'quota' | 'unavailable'

export interface UseSheetAutosaveOptions<T> {
  uid: string | null
  id: string | null
  /** Snapshot vindo do `onSnapshot` do Firestore (ou `null` enquanto carrega). */
  remote: RemoteSheetSnapshot<T> | null
  scope: SheetDraftScope
  save: SheetSaveFn<T>
  /**
   * Normaliza/valida o conteúdo do rascunho local, que é dado NÃO CONFIÁVEL
   * (versão anterior do app, corrupção, edição manual). Deve devolver `null`
   * quando o conteúdo não for uma ficha utilizável — nesse caso o rascunho é
   * descartado e o documento remoto é usado. Obrigatório justamente para que
   * nenhum caminho de leitura escape das funções `normalize*`.
   */
  parseDraft: (raw: unknown) => T | null
  debounceMs?: number
  maxWaitMs?: number
  saveTimeoutMs?: number
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
  /**
   * Diferente de `null` quando NÃO foi possível manter a cópia local de segurança.
   * Precisa ser exibido: sem o espelho local, uma queda de conexão junto com o
   * fechamento da aba volta a perder trabalho.
   */
  localBackupError: LocalBackupError | null
}

type HistoryStacks<T> = { past: T[]; future: T[] }

function isUpdaterFn<T>(value: T | ((current: T) => T)): value is (current: T) => T {
  return typeof value === 'function'
}

/**
 * Campos de texto têm o próprio undo (nativo ou por buffer local, como o
 * `NumberInput`). Sequestrar Ctrl+Z ali desfaria a ficha inteira por baixo do
 * cursor — e, no caso do `NumberInput`, o valor exibido ficaria divergente do
 * documento até o blur.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  const tagName = target.tagName
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return true
  if (target.isContentEditable) return true

  const contentEditable = target.getAttribute('contenteditable')
  return contentEditable === '' || contentEditable === 'true'
}

/** Com um diálogo modal aberto, o atalho pertence ao diálogo, não à ficha. */
function hasOpenModalDialog(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null
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
    parseDraft,
    debounceMs = SAVE_DEBOUNCE_MS,
    maxWaitMs = SAVE_MAX_WAIT_MS,
    saveTimeoutMs = SAVE_TIMEOUT_MS,
    historyLimit = HISTORY_LIMIT,
    historyGroupMs = HISTORY_GROUP_MS,
    retryDelaysMs = RETRY_DELAYS_MS,
  } = options

  const [sheet, setSheetState] = useState<T | null>(null)
  const [savingStatus, setSavingStatusState] = useState<SavingStatus>('idle')
  const [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0 })
  const [recoveredDraftAt, setRecoveredDraftAt] = useState<string | null>(null)
  const [localBackupError, setLocalBackupError] = useState<LocalBackupError | null>(null)

  // ── Refs (acesso síncrono ao estado mais recente em listeners e timers) ────
  const sheetRef = useRef<T | null>(null)
  const pendingRef = useRef<T | null>(null)
  const draftDataRef = useRef<T | null>(null)
  const inFlightRef = useRef(false)
  const flightSeqRef = useRef(0)
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
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const uidRef = useRef(uid)
  const idRef = useRef(id)
  const scopeRef = useRef(scope)
  const saveRef = useRef(save)
  const parseDraftRef = useRef(parseDraft)
  uidRef.current = uid
  idRef.current = id
  scopeRef.current = scope
  saveRef.current = save
  parseDraftRef.current = parseDraft

  const configRef = useRef({
    debounceMs,
    maxWaitMs,
    saveTimeoutMs,
    historyLimit,
    historyGroupMs,
    retryDelaysMs,
  })
  configRef.current = {
    debounceMs,
    maxWaitMs,
    saveTimeoutMs,
    historyLimit,
    historyGroupMs,
    retryDelaysMs,
  }

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

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current !== null) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
  }, [])

  // ── Rascunho local ─────────────────────────────────────────────────────────

  const reportDraftResult = useCallback((result: SheetDraftWriteResult) => {
    if (!mountedRef.current) return
    setLocalBackupError(result === 'ok' ? null : result)
  }, [])

  const writeDraftNow = useCallback(
    (data: T) => {
      const currentUid = uidRef.current
      const currentId = idRef.current
      if (!currentUid || !currentId) return

      const result = writeSheetDraft(
        scopeRef.current,
        currentUid,
        currentId,
        data,
        baseUpdatedAtRef.current,
      )
      reportDraftResult(result)
    },
    [reportDraftResult],
  )

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

  /**
   * Descarta o espelho local por completo. `draftDataRef` TEM de ser zerado junto
   * com o localStorage: se ficasse apontando para o dado antigo, um `pagehide`
   * posterior regravaria um rascunho já obsoleto, que na próxima abertura seria
   * adotado e sobrescreveria escrita legítima mais nova.
   */
  const discardLocalMirror = useCallback(() => {
    if (draftTimerRef.current !== null) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    draftDataRef.current = null

    const currentUid = uidRef.current
    const currentId = idRef.current
    if (!currentUid || !currentId) return
    clearSheetDraft(scopeRef.current, currentUid, currentId)
  }, [])

  // ── Escrita remota ─────────────────────────────────────────────────────────

  const scheduleSaveRef = useRef<() => void>(() => {})
  const runSaveRef = useRef<() => void>(() => {})

  /**
   * Devolve o dado à fila e agenda nova tentativa (ou expõe o erro). Usado tanto
   * quando o `save` rejeita quanto quando ele fica preso além do watchdog.
   */
  const handleSaveFailure = useCallback(
    (data: T) => {
      clearWatchdog()
      // Invalida o voo atual: se a escrita presa resolver mais tarde, o resultado
      // é ignorado (o dado já voltou para a fila e será reenviado).
      flightSeqRef.current += 1
      inFlightRef.current = false

      if (pendingRef.current === null) pendingRef.current = data

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
    },
    [clearWatchdog, setStatus, writeDraftNow],
  )

  const runSave = useCallback(() => {
    clearSaveTimers()

    const data = pendingRef.current
    const currentUid = uidRef.current
    const currentId = idRef.current

    if (data === null || !currentUid || !currentId) return

    // Já existe uma escrita em voo. É obrigatório REAGENDAR: se apenas
    // retornássemos, uma escrita que nunca resolve (Firestore offline) mataria
    // de vez o teto de espera e o autosave ficaria parado indefinidamente.
    if (inFlightRef.current) {
      scheduleSaveRef.current()
      return
    }

    pendingRef.current = null
    inFlightRef.current = true
    const token = flightSeqRef.current
    setStatus('saving')

    watchdogTimerRef.current = setTimeout(() => {
      watchdogTimerRef.current = null
      if (flightSeqRef.current !== token) return
      handleSaveFailure(data)
    }, configRef.current.saveTimeoutMs)

    // IIFE async: normaliza retornos não-Promise e erros lançados de forma
    // síncrona pela função de save.
    void (async () =>
      saveRef.current(currentUid, currentId, data, createdAtRef.current ?? undefined))()
      .then((writtenUpdatedAt) => {
        if (flightSeqRef.current !== token) return
        clearWatchdog()
        inFlightRef.current = false
        retryCountRef.current = 0

        // Reancora: daqui para frente o estado local é baseado NESTA escrita.
        if (typeof writtenUpdatedAt === 'string' && writtenUpdatedAt.length > 0) {
          baseUpdatedAtRef.current = writtenUpdatedAt
        }

        const stillPending = pendingRef.current
        if (stillPending !== null) {
          // Regrava o rascunho com a âncora nova; sem isso, o rascunho ficaria
          // preso à âncora anterior e seria descartado na próxima abertura.
          writeDraftNow(stillPending)
          setStatus('pending')
          scheduleSaveRef.current()
          return
        }

        discardLocalMirror()
        setStatus('saved')
      })
      .catch(() => {
        if (flightSeqRef.current !== token) return
        handleSaveFailure(data)
      })
  }, [
    clearSaveTimers,
    clearWatchdog,
    discardLocalMirror,
    handleSaveFailure,
    setStatus,
    writeDraftNow,
  ])

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
      retryCountRef.current = 0
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

  /**
   * Grava o espelho local e dispara a escrita remota do que está pendente.
   *
   * Só age quando existe edição pendente de verdade. Gravar o rascunho "por
   * garantia" quando não há nada pendente é o que ressuscitava dado obsoleto:
   * o rascunho ganharia `savedAt` novo e seria adotado na abertura seguinte.
   */
  const flushNow = useCallback(() => {
    const data = pendingRef.current
    if (data === null) return

    // Ordem importa: o rascunho local é síncrono e é a única garantia real
    // quando o navegador encerra a página antes de a escrita remota completar.
    writeDraftNow(data)
    runSaveRef.current()
  }, [writeDraftNow])

  const flushRef = useRef(flushNow)
  flushRef.current = flushNow

  const retry = useCallback(() => {
    retryCountRef.current = 0
    clearWatchdog()
    // Abandona uma escrita eventualmente presa antes de tentar de novo.
    if (inFlightRef.current) {
      flightSeqRef.current += 1
      inFlightRef.current = false
    }
    if (pendingRef.current === null) {
      const fallback = sheetRef.current
      if (fallback === null) return
      pendingRef.current = fallback
    }
    runSaveRef.current()
  }, [clearWatchdog])

  const discardPending = useCallback(() => {
    clearSaveTimers()
    clearWatchdog()
    pendingRef.current = null
    discardLocalMirror()
  }, [clearSaveTimers, clearWatchdog, discardLocalMirror])

  const dismissRecovery = useCallback(() => setRecoveredDraftAt(null), [])

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  // Troca de ficha/usuário: preserva o pendente da ficha ANTERIOR no espelho
  // local antes de zerar o estado. O cleanup roda com o uid/id antigos
  // capturados no closure, então o rascunho vai para a chave certa.
  // Declarado antes do efeito de reset para que seu cleanup rode primeiro.
  useEffect(() => {
    return () => {
      const data = pendingRef.current
      if (data === null || !uid || !id) return
      writeSheetDraft(scope, uid, id, data, baseUpdatedAtRef.current)
    }
  }, [uid, id, scope])

  useEffect(() => {
    adoptedRef.current = false
    clearSaveTimers()
    clearWatchdog()
    if (draftTimerRef.current !== null) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    pendingRef.current = null
    draftDataRef.current = null
    inFlightRef.current = false
    flightSeqRef.current += 1
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
    setLocalBackupError(null)
  }, [uid, id, clearSaveTimers, clearWatchdog])

  // Adoção do snapshot remoto + restauração de rascunho aplicável.
  useEffect(() => {
    if (!remote) return

    createdAtRef.current = remote.createdAt

    if (adoptedRef.current) {
      // Só acompanha o remoto quando não há nada pendente nem em voo. Com
      // trabalho em andamento, a âncora precisa continuar apontando para a última
      // escrita NOSSA — é ela que diz se o rascunho ainda é aplicável.
      if (pendingRef.current === null && !inFlightRef.current) {
        baseUpdatedAtRef.current = remote.updatedAt
      }
      return
    }

    adoptedRef.current = true
    baseUpdatedAtRef.current = remote.updatedAt

    const currentUid = uidRef.current
    const currentId = idRef.current
    const draft =
      currentUid && currentId ? readSheetDraft(scopeRef.current, currentUid, currentId) : null

    if (draft && isSheetDraftBasedOnRemote(draft, remote.updatedAt)) {
      // Conteúdo do rascunho é dado não confiável: passa pelo normalizador da
      // página. Formato irreconhecível → descarta e usa o remoto.
      let parsed: T | null = null
      try {
        parsed = parseDraftRef.current(draft.data)
      } catch {
        parsed = null
      }

      if (parsed !== null) {
        applyLocal(parsed)
        draftDataRef.current = parsed
        pendingRef.current = parsed
        setRecoveredDraftAt(draft.savedAt)
        setStatus('pending')
        scheduleSaveRef.current()
        return
      }
    }

    if (draft) discardLocalMirror()
    applyLocal(remote.data)
  }, [remote, applyLocal, discardLocalMirror, setStatus])

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

  // Atalhos de teclado. Ficam fora de campos de texto e de diálogos modais, que
  // têm o próprio comportamento de desfazer.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return

      if (isEditableTarget(event.target) || hasOpenModalDialog()) return

      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }

      event.preventDefault()
      redo()
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
      if (watchdogTimerRef.current !== null) clearTimeout(watchdogTimerRef.current)
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
    localBackupError,
  }
}
