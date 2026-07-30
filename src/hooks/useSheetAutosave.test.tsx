// Testes da camada de estado/persistência das fichas.
//
// Vários testes comparam o comportamento novo com uma réplica do agendador
// ANTIGO (debounce puro, reiniciado a cada tecla) para deixar registrado que o
// defeito existia — não apenas que o código novo passa.

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useSheetAutosave, type RemoteSheetSnapshot, type SheetSaveFn } from './useSheetAutosave'
import { getSheetDraftKey, writeSheetDraft, type SheetDraftEnvelope } from '../utils/sheetDraft'

type Doc = { title: string; notes: string }

const UID = 'usuario-1'
const ID = 'ficha-1'
const REMOTE_CREATED_AT = '2026-01-01T00:00:00.000Z'
const REMOTE_UPDATED_AT = '2026-01-02T00:00:00.000Z'
const NOW = new Date('2026-01-03T12:00:00.000Z')

function makeRemote(data: Partial<Doc> = {}): RemoteSheetSnapshot<Doc> {
  return {
    data: { title: 'Original', notes: '', ...data },
    createdAt: REMOTE_CREATED_AT,
    updatedAt: REMOTE_UPDATED_AT,
  }
}

/**
 * Réplica fiel do agendador anterior à correção: debounce de 800ms reiniciado a
 * cada edição, sem teto de espera e sem flush em pagehide/desmontagem.
 */
function createLegacyAutosave(onSave: () => void, debounceMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    edit() {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(onSave, debounceMs)
    },
    unmount() {
      if (timer !== null) clearTimeout(timer)
    },
  }
}

function readDraftRaw(): SheetDraftEnvelope<Doc> | null {
  const raw = window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))
  return raw ? (JSON.parse(raw) as SheetDraftEnvelope<Doc>) : null
}

function setup(options?: {
  save?: Mock<SheetSaveFn<Doc>>
  remote?: RemoteSheetSnapshot<Doc> | null
  historyLimit?: number
  retryDelaysMs?: number[]
}) {
  const save: Mock<SheetSaveFn<Doc>> =
    options?.save ?? vi.fn<SheetSaveFn<Doc>>().mockResolvedValue(undefined)
  const initialRemote = options?.remote === undefined ? makeRemote() : options.remote

  const view = renderHook(
    (props: { remote: RemoteSheetSnapshot<Doc> | null }) =>
      useSheetAutosave<Doc>({
        uid: UID,
        id: ID,
        remote: props.remote,
        scope: 'pj',
        save,
        historyLimit: options?.historyLimit,
        retryDelaysMs: options?.retryDelaysMs,
      }),
    { initialProps: { remote: initialRemote } },
  )

  return { save, view }
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers({ now: NOW })
})

afterEach(() => {
  // `cleanup()` do Testing Library roda depois deste hook e desmonta os hooks
  // (o que dispara o flush final) — por isso os mocks NÃO são restaurados aqui.
  vi.useRealTimers()
})

describe('useSheetAutosave — adoção do snapshot remoto', () => {
  it('adota os dados remotos e começa em idle', () => {
    const { view } = setup()
    expect(view.result.current.sheet).toEqual({ title: 'Original', notes: '' })
    expect(view.result.current.savingStatus).toBe('idle')
  })

  it('não sobrescreve a edição local quando um novo snapshot remoto chega', async () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Editado localmente', notes: '' }))
    view.rerender({ remote: makeRemote({ title: 'Vindo do servidor' }) })

    expect(view.result.current.sheet?.title).toBe('Editado localmente')
  })
})

describe('P1 — digitação contínua sem pausa (teto de espera)', () => {
  it('escreve durante a digitação, enquanto o debounce puro antigo nunca escreveria', async () => {
    const legacySave = vi.fn()
    const legacy = createLegacyAutosave(legacySave)
    const { save, view } = setup()

    // 20 edições espaçadas por 200ms (nunca há pausa de 800ms): 4s digitando.
    for (let index = 0; index < 20; index += 1) {
      act(() =>
        view.result.current.commit((current) => ({ ...current, notes: `${current.notes}a` })),
      )
      legacy.edit()
      await advance(200)
    }

    // Comportamento antigo: nenhuma escrita em 4 segundos de digitação.
    expect(legacySave).toHaveBeenCalledTimes(0)

    // Comportamento novo: o teto de espera de 3s forçou a escrita.
    expect(save).toHaveBeenCalled()
    const [, , dataSent] = save.mock.calls[0]
    expect((dataSent as Doc).notes.length).toBeGreaterThan(0)

    legacy.unmount()
  })

  it('mantém o debounce de 800ms quando o usuário pausa', async () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'A', notes: '' }))
    await advance(700)
    expect(save).not.toHaveBeenCalled()

    await advance(150)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('passa o createdAt conhecido para a função de save (evita getDoc extra)', async () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'A', notes: '' }))
    await advance(900)

    expect(save).toHaveBeenCalledWith(UID, ID, { title: 'A', notes: '' }, REMOTE_CREATED_AT)
  })
})

describe('P1 — espelho local para recuperação', () => {
  it('grava rascunho síncrono já na primeira edição (antes de qualquer escrita remota)', () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'Rascunho', notes: 'x' }))

    expect(save).not.toHaveBeenCalled()
    expect(readDraftRaw()?.data).toEqual({ title: 'Rascunho', notes: 'x' })
  })

  it('pagehide com edição pendente preserva o dado no rascunho local', async () => {
    const legacySave = vi.fn()
    const legacy = createLegacyAutosave(legacySave)
    // A escrita remota nunca completa — é exatamente o cenário em que só o
    // rascunho local salva o trabalho.
    const save = vi.fn<SheetSaveFn<Doc>>(() => new Promise<void>(() => {}))
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'Quase perdido', notes: '' }))
    legacy.edit()
    await advance(100)

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    // No comportamento antigo nada havia sido persistido em nenhum lugar.
    expect(legacySave).toHaveBeenCalledTimes(0)
    expect(readDraftRaw()?.data.title).toBe('Quase perdido')
  })

  it('visibilitychange para hidden faz flush do pendente e mantém o rascunho até a confirmação', async () => {
    // Escrita que nunca resolve: simula o caso real em que o navegador encerra a
    // página (ou a conexão cai) antes de o Firestore confirmar.
    const save = vi.fn<SheetSaveFn<Doc>>(() => new Promise<void>(() => {}))
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'Aba escondida', notes: '' }))
    await advance(100)

    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(readDraftRaw()?.data.title).toBe('Aba escondida')
    expect(save).toHaveBeenCalledTimes(1)

    if (descriptor) Object.defineProperty(document, 'visibilityState', descriptor)
  })

  it('desmontar com edição pendente faz flush em vez de descartar', async () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'Ao desmontar', notes: '' }))
    await advance(100)
    expect(save).not.toHaveBeenCalled()

    await act(async () => {
      view.unmount()
    })

    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][2]).toEqual({ title: 'Ao desmontar', notes: '' })
  })

  it('limpa o rascunho local depois da confirmação de escrita remota', async () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Confirmado', notes: '' }))
    expect(readDraftRaw()).not.toBeNull()

    await advance(900)

    expect(readDraftRaw()).toBeNull()
    expect(view.result.current.savingStatus).toBe('saved')
  })

  it('restaura o rascunho quando ele é mais recente que o documento remoto', async () => {
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { title: 'Trabalho recuperado', notes: 'não salvo' },
      REMOTE_UPDATED_AT,
      '2026-01-02T12:00:00.000Z', // depois do updatedAt remoto
    )

    const { save, view } = setup()

    expect(view.result.current.sheet).toEqual({
      title: 'Trabalho recuperado',
      notes: 'não salvo',
    })
    expect(view.result.current.recoveredDraftAt).toBe('2026-01-02T12:00:00.000Z')
    expect(view.result.current.savingStatus).toBe('pending')

    // Converge sozinho: o rascunho recuperado é enviado ao Firestore.
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][2]).toEqual({ title: 'Trabalho recuperado', notes: 'não salvo' })
  })

  it('descarta rascunho mais antigo que o documento remoto', () => {
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { title: 'Rascunho velho', notes: '' },
      null,
      '2026-01-01T06:00:00.000Z', // antes do updatedAt remoto
    )

    const { view } = setup()

    expect(view.result.current.sheet?.title).toBe('Original')
    expect(view.result.current.recoveredDraftAt).toBeNull()
    expect(readDraftRaw()).toBeNull()
  })
})

describe('P4 — status de salvamento honesto', () => {
  it('percorre pending → saving → saved', async () => {
    let resolveSave: (() => void) | null = null
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        }),
    )
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'A', notes: '' }))
    expect(view.result.current.savingStatus).toBe('pending')

    await advance(900)
    expect(view.result.current.savingStatus).toBe('saving')

    await act(async () => {
      resolveSave?.()
    })
    expect(view.result.current.savingStatus).toBe('saved')
  })

  it('volta para pending quando o usuário edita durante uma escrita em voo', async () => {
    let resolveSave: (() => void) | null = null
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        }),
    )
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'A', notes: '' }))
    await advance(900)
    expect(view.result.current.savingStatus).toBe('saving')

    act(() => view.result.current.commit({ title: 'B', notes: '' }))
    expect(view.result.current.savingStatus).toBe('pending')

    await act(async () => {
      resolveSave?.()
    })
    expect(view.result.current.savingStatus).toBe('pending')

    await advance(900)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1][2]).toEqual({ title: 'B', notes: '' })
  })

  it('tenta de novo com backoff e preserva o rascunho quando a escrita falha', async () => {
    const save = vi.fn<SheetSaveFn<Doc>>().mockRejectedValue(new Error('offline'))
    const { view } = setup({ save, retryDelaysMs: [1000, 2000] })

    act(() => view.result.current.commit({ title: 'Sem rede', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)
    expect(view.result.current.savingStatus).toBe('saving')

    await advance(1000)
    expect(save).toHaveBeenCalledTimes(2)

    await advance(2000)
    expect(save).toHaveBeenCalledTimes(3)
    expect(view.result.current.savingStatus).toBe('error')

    // Nada é perdido: o rascunho local continua disponível para recuperação.
    expect(readDraftRaw()?.data.title).toBe('Sem rede')
  })

  it('retry manual reenvia o pendente depois de um erro', async () => {
    const save = vi
      .fn<SheetSaveFn<Doc>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined)
    const { view } = setup({ save, retryDelaysMs: [] })

    act(() => view.result.current.commit({ title: 'Retry', notes: '' }))
    await advance(900)
    expect(view.result.current.savingStatus).toBe('error')

    await act(async () => {
      view.result.current.retry()
    })

    expect(save).toHaveBeenCalledTimes(2)
    expect(view.result.current.savingStatus).toBe('saved')
    expect(readDraftRaw()).toBeNull()
  })
})

describe('P4 — undo/redo', () => {
  it('desfaz e refaz a última alteração', async () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Passo 1', notes: '' }))
    await advance(1000)
    act(() => view.result.current.commit({ title: 'Passo 2', notes: '' }))
    await advance(1000)

    expect(view.result.current.canUndo).toBe(true)

    act(() => view.result.current.undo())
    expect(view.result.current.sheet?.title).toBe('Passo 1')

    act(() => view.result.current.undo())
    expect(view.result.current.sheet?.title).toBe('Original')
    expect(view.result.current.canUndo).toBe(false)

    act(() => view.result.current.redo())
    expect(view.result.current.sheet?.title).toBe('Passo 1')
    act(() => view.result.current.redo())
    expect(view.result.current.sheet?.title).toBe('Passo 2')
    expect(view.result.current.canRedo).toBe(false)
  })

  it('agrupa edições da mesma rajada em uma única entrada de histórico', async () => {
    const { view } = setup()

    // Cinco "teclas" dentro da janela de agrupamento.
    for (const letter of ['a', 'b', 'c', 'd', 'e']) {
      act(() =>
        view.result.current.commit((current) => ({ ...current, notes: current.notes + letter })),
      )
      vi.advanceTimersByTime(50)
    }

    expect(view.result.current.sheet?.notes).toBe('abcde')

    act(() => view.result.current.undo())

    // Um único undo volta ao estado antes da rajada inteira, não letra por letra.
    expect(view.result.current.sheet?.notes).toBe('')
    expect(view.result.current.canUndo).toBe(false)
  })

  it('respeita o limite do histórico', async () => {
    const { view } = setup({ historyLimit: 3 })

    for (let step = 1; step <= 6; step += 1) {
      act(() => view.result.current.commit({ title: `Passo ${step}`, notes: '' }))
      await advance(1000)
    }

    let undoCount = 0
    while (view.result.current.canUndo && undoCount < 20) {
      act(() => view.result.current.undo())
      undoCount += 1
    }

    expect(undoCount).toBe(3)
    // Com limite 3, o estado mais antigo alcançável é o "Passo 3"
    // (as entradas anteriores foram descartadas).
    expect(view.result.current.sheet?.title).toBe('Passo 3')
  })

  it('undo agenda uma única escrita em vez de uma tempestade de writes', async () => {
    const { save, view } = setup()

    for (let step = 1; step <= 4; step += 1) {
      act(() => view.result.current.commit({ title: `Passo ${step}`, notes: '' }))
      await advance(1000)
    }
    const savesAfterEditing = save.mock.calls.length

    act(() => view.result.current.undo())
    act(() => view.result.current.undo())
    act(() => view.result.current.undo())
    await advance(900)

    expect(save.mock.calls.length - savesAfterEditing).toBe(1)
    expect(view.result.current.sheet?.title).toBe('Passo 1')
  })

  it('atende aos atalhos Ctrl+Z e Ctrl+Shift+Z', async () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Com atalho', notes: '' }))
    await advance(1000)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })
    expect(view.result.current.sheet?.title).toBe('Original')

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }),
      )
    })
    expect(view.result.current.sheet?.title).toBe('Com atalho')

    // Cmd+Z (macOS)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))
    })
    expect(view.result.current.sheet?.title).toBe('Original')
  })
})

describe('descarte de pendências', () => {
  it('discardPending cancela a escrita agendada e apaga o rascunho', async () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'Vai ser excluída', notes: '' }))
    expect(readDraftRaw()).not.toBeNull()

    act(() => view.result.current.discardPending())
    await advance(5000)

    expect(save).not.toHaveBeenCalled()
    expect(readDraftRaw()).toBeNull()
  })
})
