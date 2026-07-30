// Testes da camada de estado/persistência das fichas.
//
// Todas as asserções exercitam o código de produção. Cada teste deste arquivo
// falha se a proteção correspondente for removida do hook — não há réplica de
// comportamento antigo escrita no próprio teste.

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useSheetAutosave, type RemoteSheetSnapshot, type SheetSaveFn } from './useSheetAutosave'
import {
  getSheetDraftKey,
  writeSheetDraft,
  SHEET_DRAFT_SCHEMA_VERSION,
  type StoredSheetDraft,
} from '../utils/sheetDraft'

type Doc = { title: string; notes: string }

const UID = 'usuario-1'
const ID = 'ficha-1'
const REMOTE_CREATED_AT = '2026-01-01T00:00:00.000Z'
const REMOTE_UPDATED_AT = '2026-01-02T00:00:00.000Z'
const NOW = new Date('2026-01-03T12:00:00.000Z')

function makeRemote(
  data: Partial<Doc> = {},
  updatedAt = REMOTE_UPDATED_AT,
): RemoteSheetSnapshot<Doc> {
  return {
    data: { title: 'Original', notes: '', ...data },
    createdAt: REMOTE_CREATED_AT,
    updatedAt,
  }
}

/** Espelha o que as páginas fazem: valida a forma e só então aceita o conteúdo. */
function parseDoc(raw: unknown): Doc | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const candidate = raw as Record<string, unknown>
  if (typeof candidate.title !== 'string' || typeof candidate.notes !== 'string') return null
  return { title: candidate.title, notes: candidate.notes }
}

function readDraftRaw(): StoredSheetDraft | null {
  const raw = window.localStorage.getItem(getSheetDraftKey('pj', UID, ID))
  return raw ? (JSON.parse(raw) as StoredSheetDraft) : null
}

function draftData(): Doc | null {
  const draft = readDraftRaw()
  return draft ? parseDoc(draft.data) : null
}

function hangingSave(): Mock<SheetSaveFn<Doc>> {
  return vi.fn<SheetSaveFn<Doc>>(() => new Promise<string>(() => {}))
}

function setup(options?: {
  save?: Mock<SheetSaveFn<Doc>>
  remote?: RemoteSheetSnapshot<Doc> | null
  historyLimit?: number
  retryDelaysMs?: number[]
  saveTimeoutMs?: number
  parseDraft?: (raw: unknown) => Doc | null
}) {
  const save: Mock<SheetSaveFn<Doc>> =
    options?.save ?? vi.fn<SheetSaveFn<Doc>>().mockResolvedValue('updated-1')
  const initialRemote = options?.remote === undefined ? makeRemote() : options.remote

  const view = renderHook(
    (props: { remote: RemoteSheetSnapshot<Doc> | null }) =>
      useSheetAutosave<Doc>({
        uid: UID,
        id: ID,
        remote: props.remote,
        scope: 'pj',
        save,
        parseDraft: options?.parseDraft ?? parseDoc,
        historyLimit: options?.historyLimit,
        retryDelaysMs: options?.retryDelaysMs,
        saveTimeoutMs: options?.saveTimeoutMs,
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
  document.body.innerHTML = ''
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
    expect(view.result.current.localBackupError).toBeNull()
  })

  it('não sobrescreve a edição local quando um novo snapshot remoto chega', () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Editado localmente', notes: '' }))
    view.rerender({ remote: makeRemote({ title: 'Vindo do servidor' }) })

    expect(view.result.current.sheet?.title).toBe('Editado localmente')
  })
})

describe('P1 — digitação contínua sem pausa (teto de espera)', () => {
  it('escreve durante digitação contínua, sem nenhuma pausa de 800ms', async () => {
    const { save, view } = setup()

    // 20 edições espaçadas por 200ms: 4s digitando sem nunca pausar o bastante
    // para o debounce disparar. Sem o teto de espera, `save` nunca é chamado.
    for (let index = 0; index < 20; index += 1) {
      act(() =>
        view.result.current.commit((current) => ({ ...current, notes: `${current.notes}a` })),
      )
      await advance(200)
    }

    expect(save).toHaveBeenCalled()
    expect(save.mock.calls[0][2].notes.length).toBeGreaterThan(0)
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

    expect(save).toHaveBeenCalledWith(
      UID,
      ID,
      { title: 'A', notes: '' },
      REMOTE_CREATED_AT,
      expect.any(String),
    )
  })
})

describe('D3 — escrita presa (Firestore offline não resolve a promise)', () => {
  it('não deixa o autosave parado: watchdog libera a fila e reenvia o dado novo', async () => {
    const save = hangingSave()
    const { view } = setup({ save, saveTimeoutMs: 5000, retryDelaysMs: [1000] })

    act(() => view.result.current.commit({ title: 'Offline', notes: 'a' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)

    // Usuário continua digitando 30s com a escrita pendurada.
    for (let index = 0; index < 150; index += 1) {
      act(() =>
        view.result.current.commit((current) => ({ ...current, notes: `${current.notes}b` })),
      )
      await advance(200)
    }

    expect(save.mock.calls.length).toBeGreaterThan(1)
    const lastCall = save.mock.calls[save.mock.calls.length - 1]
    expect(lastCall[2].notes.length).toBeGreaterThan(1)
  })

  it('D11 — ack lento não vira erro nem multiplica escritas do documento', async () => {
    let resolveSave: ((value: string) => void) | null = null
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<string>((resolve) => {
          resolveSave = resolve
        }),
    )
    const { view } = setup({ save, saveTimeoutMs: 10000, retryDelaysMs: [1000, 2000, 4000] })

    // UMA edição e nada mais: conexão móvel com ack acima do watchdog.
    act(() => view.result.current.commit({ title: 'Rede lenta', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)

    await advance(60000)

    // Nem reenvio do documento inteiro nem erro falso: a escrita está viva.
    expect(save).toHaveBeenCalledTimes(1)
    expect(view.result.current.savingStatus).not.toBe('error')
    expect(view.result.current.savingStatus).not.toBe('saved')
    expect(draftData()?.title).toBe('Rede lenta')

    // Quando o ack finalmente chega, ele ainda confirma e limpa o rascunho.
    await act(async () => {
      resolveSave?.('updated-tarde')
    })
    expect(view.result.current.savingStatus).toBe('saved')
    expect(readDraftRaw()).toBeNull()
  })

  it('ack de voo superado não puxa o estado para trás nem apaga o rascunho', async () => {
    const resolvers: Array<(value: string) => void> = []
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const { view } = setup({ save, saveTimeoutMs: 3000, retryDelaysMs: [] })

    act(() => view.result.current.commit({ title: 'Voo 1', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)

    // Watchdog libera a fila; nova edição inicia o voo 2, que supera o voo 1.
    await advance(3000)
    act(() => view.result.current.commit({ title: 'Voo 2', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(2)

    const anchorOfFlight1 = save.mock.calls[0][4]
    const anchorOfFlight2 = save.mock.calls[1][4]
    expect(anchorOfFlight1).not.toBe(anchorOfFlight2)

    // Ack tardio do voo 1: não pode confirmar nem limpar o espelho local, senão
    // o trabalho do voo 2 ficaria sem rede de segurança e a âncora andaria para trás.
    await act(async () => {
      resolvers[0]?.('ignorado')
    })

    expect(view.result.current.savingStatus).not.toBe('saved')
    expect(draftData()?.title).toBe('Voo 2')
    expect(readDraftRaw()?.inFlightUpdatedAt).toBe(anchorOfFlight2)
  })

  it('retry manual abandona a escrita presa e reenvia', async () => {
    const save = hangingSave()
    const { view } = setup({ save, saveTimeoutMs: 60000, retryDelaysMs: [] })

    act(() => view.result.current.commit({ title: 'Preso', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)

    await act(async () => {
      view.result.current.saveNow()
    })

    expect(save).toHaveBeenCalledTimes(2)
  })
})

describe('P1 — espelho local para recuperação', () => {
  it('grava rascunho síncrono já na primeira edição (antes de qualquer escrita remota)', () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'Rascunho', notes: 'x' }))

    expect(save).not.toHaveBeenCalled()
    expect(draftData()).toEqual({ title: 'Rascunho', notes: 'x' })
  })

  it('pagehide grava no rascunho a edição que o throttle ainda não havia gravado', async () => {
    const { view } = setup({ save: hangingSave() })

    // 1ª edição: gravada na borda de subida do throttle.
    act(() => view.result.current.commit({ title: 'Primeira', notes: '' }))
    expect(draftData()?.title).toBe('Primeira')

    // 2ª edição dentro da janela do throttle: não chega sozinha ao localStorage.
    await advance(100)
    act(() => view.result.current.commit({ title: 'Segunda', notes: '' }))
    expect(draftData()?.title).toBe('Primeira')

    // Só o flush do pagehide preserva a segunda edição. Sem o listener, o
    // rascunho continuaria em "Primeira" e este teste falharia.
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(draftData()?.title).toBe('Segunda')
  })

  it('visibilitychange para hidden faz flush e mantém o rascunho até a confirmação', async () => {
    // Escrita que nunca resolve: simula o caso real em que o navegador encerra a
    // página (ou a conexão cai) antes de o Firestore confirmar.
    const save = hangingSave()
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

    expect(draftData()?.title).toBe('Aba escondida')
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
})

describe('D1 — rascunho obsoleto não pode ressuscitar', () => {
  it('pagehide sem edição pendente não grava rascunho nenhum', () => {
    const { view } = setup()

    expect(view.result.current.sheet).not.toBeNull()

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    expect(readDraftRaw()).toBeNull()
  })

  it('pagehide depois de save confirmado não regrava o dado já salvo', async () => {
    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Já salvo', notes: '' }))
    await advance(900)
    expect(view.result.current.savingStatus).toBe('saved')
    expect(readDraftRaw()).toBeNull()

    // Usuário fecha a aba sem editar mais nada.
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    expect(readDraftRaw()).toBeNull()
  })

  it('reabrir uma ficha já salva não mostra aviso de recuperação nem reescreve', async () => {
    const first = setup()

    act(() => first.view.result.current.commit({ title: 'Trabalho salvo', notes: '' }))
    await advance(900)
    await act(async () => {
      first.view.unmount()
    })

    // Segunda abertura: o remoto já contém o trabalho.
    const second = setup({ remote: makeRemote({ title: 'Trabalho salvo' }, 'updated-1') })

    expect(second.view.result.current.recoveredDraftAt).toBeNull()
    expect(second.view.result.current.savingStatus).toBe('idle')

    await advance(5000)
    expect(second.save).not.toHaveBeenCalled()
  })

  it('descarta rascunho cuja âncora não é o updatedAt remoto atual (outra aba escreveu)', () => {
    // `savedAt` no futuro de propósito: a decisão NÃO pode se basear em comparar
    // relógios de dispositivos diferentes, e sim na âncora.
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { title: 'Obsoleto', notes: '' },
      { baseUpdatedAt: REMOTE_UPDATED_AT, inFlightUpdatedAt: null },
      '2030-01-01T00:00:00.000Z',
    )

    const { view } = setup({
      remote: makeRemote({ title: 'Escrito pela aba B' }, '2026-01-02T00:05:00.000Z'),
    })

    expect(view.result.current.sheet?.title).toBe('Escrito pela aba B')
    expect(view.result.current.recoveredDraftAt).toBeNull()
    expect(readDraftRaw()).toBeNull()
  })

  it('restaura o rascunho cuja âncora casa com o remoto', async () => {
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { title: 'Trabalho recuperado', notes: 'não salvo' },
      { baseUpdatedAt: REMOTE_UPDATED_AT, inFlightUpdatedAt: null },
      '2026-01-02T12:00:00.000Z',
    )

    const { save, view } = setup()

    expect(view.result.current.sheet).toEqual({
      title: 'Trabalho recuperado',
      notes: 'não salvo',
    })
    expect(view.result.current.recoveredDraftAt).toBe('2026-01-02T12:00:00.000Z')
    expect(view.result.current.savingStatus).toBe('pending')

    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][2]).toEqual({ title: 'Trabalho recuperado', notes: 'não salvo' })
  })

  it('reancora na escrita confirmada: edição posterior sobrevive à morte da aba', async () => {
    // 1ª escrita confirma; a 2ª fica pendurada e a aba morre com ela em voo.
    const save = vi
      .fn<SheetSaveFn<Doc>>()
      .mockResolvedValueOnce('ok')
      .mockImplementation(() => new Promise<string>(() => {}))
    const first = setup({ save })

    act(() => first.view.result.current.commit({ title: 'Primeira', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)
    const confirmedAnchor = save.mock.calls[0][4] as string

    act(() => first.view.result.current.commit({ title: 'Depois do save', notes: '' }))
    await advance(900)
    await act(async () => {
      first.view.unmount()
    })

    expect(draftData()?.title).toBe('Depois do save')

    // Reabre com o updatedAt que a NOSSA escrita confirmada gravou: a âncora
    // casa e o trabalho posterior é recuperado em vez de descartado.
    const second = setup({ remote: makeRemote({ title: 'Primeira' }, confirmedAnchor) })

    expect(second.view.result.current.sheet?.title).toBe('Depois do save')
    expect(second.view.result.current.recoveredDraftAt).not.toBeNull()
  })

  it('D10 — aba morta antes do ack não perde o que foi digitado depois', async () => {
    // Cenário: a escrita sai, o SERVIDOR aplica (remoto vai para o updatedAt da
    // escrita), o usuário continua digitando e a aba morre antes do ack chegar.
    const save = hangingSave()
    const first = setup({ save })

    act(() => first.view.result.current.commit({ title: 'Enviado', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)

    // `updatedAt` que essa escrita vai gravar — conhecido antes do ack.
    const appliedByServer = save.mock.calls[0][4] as string

    // Digitação posterior, com a escrita ainda em voo.
    act(() =>
      first.view.result.current.commit((current) => ({ ...current, notes: 'texto novo' })),
    )
    await advance(100)

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await act(async () => {
      first.view.unmount()
    })

    expect(draftData()?.notes).toBe('texto novo')

    // Reabre com o remoto já no estado que o servidor aplicou.
    const second = setup({ remote: makeRemote({ title: 'Enviado' }, appliedByServer) })

    expect(second.view.result.current.sheet?.notes).toBe('texto novo')
    expect(second.view.result.current.recoveredDraftAt).not.toBeNull()
  })

  it('morrer depois do ack, com edição nova, mantém o rascunho aplicável', async () => {
    // A 1ª escrita confirma; a 2ª fica pendurada, simulando a aba morrendo antes
    // de o ack da segunda chegar.
    const save = vi
      .fn<SheetSaveFn<Doc>>()
      .mockResolvedValueOnce('ok')
      .mockImplementation(() => new Promise<string>(() => {}))
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'Confirmada', notes: '' }))
    await advance(900)
    const confirmedAnchor = save.mock.calls[0][4] as string

    // Edição nova; a aba morre antes de a próxima escrita sair.
    act(() => view.result.current.commit({ title: 'Depois do ack', notes: '' }))
    await advance(100)
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'))
    })

    const draft = readDraftRaw()
    expect(draft?.baseUpdatedAt).toBe(confirmedAnchor)

    const second = setup({ remote: makeRemote({ title: 'Confirmada' }, confirmedAnchor) })
    expect(second.view.result.current.sheet?.title).toBe('Depois do ack')
  })
})

describe('D6 — troca de ficha/usuário preserva o pendente', () => {
  it('guarda o rascunho da ficha anterior ao trocar de id (logout/navegação)', async () => {
    const save = hangingSave()
    const view = renderHook(
      (props: { id: string }) =>
        useSheetAutosave<Doc>({
          uid: UID,
          id: props.id,
          remote: makeRemote(),
          scope: 'pj',
          save,
          parseDraft: parseDoc,
        }),
      { initialProps: { id: ID } },
    )

    // 1ª edição: gravada na borda de subida do throttle.
    act(() => view.result.current.commit({ title: 'Primeira', notes: '' }))
    await advance(100)

    // 2ª edição dentro da janela do throttle: não chega sozinha ao localStorage.
    act(() => view.result.current.commit({ title: 'Pendente na primeira', notes: '' }))
    expect(draftData()?.title).toBe('Primeira')

    // Troca de ficha antes de a escrita sair. Só o backup do cleanup preserva a
    // 2ª edição; sem ele o rascunho ficaria em "Primeira".
    await act(async () => {
      view.rerender({ id: 'ficha-2' })
    })

    // O rascunho tem de estar na chave da ficha ANTIGA.
    expect(draftData()?.title).toBe('Pendente na primeira')
    expect(window.localStorage.getItem(getSheetDraftKey('pj', UID, 'ficha-2'))).toBeNull()
  })
})

describe('D2 — rascunho não confiável nunca é adotado às cegas', () => {
  it('descarta rascunho de versão de formato desconhecida', () => {
    window.localStorage.setItem(
      getSheetDraftKey('pj', UID, ID),
      JSON.stringify({
        version: SHEET_DRAFT_SCHEMA_VERSION + 1,
        data: { title: 'De outra versão', notes: '' },
        savedAt: '2026-01-02T12:00:00.000Z',
        baseUpdatedAt: REMOTE_UPDATED_AT,
        inFlightUpdatedAt: null,
      }),
    )

    const { view } = setup()

    expect(view.result.current.sheet?.title).toBe('Original')
    expect(view.result.current.recoveredDraftAt).toBeNull()
    expect(readDraftRaw()).toBeNull()
  })

  it('descarta rascunho de formato antigo que o normalizador rejeita', () => {
    // Formato de uma versão anterior do app: sem os campos que a ficha exige.
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { character: { name: 'Formato antigo' } },
      { baseUpdatedAt: REMOTE_UPDATED_AT, inFlightUpdatedAt: null },
      '2026-01-02T12:00:00.000Z',
    )

    const { view } = setup()

    expect(view.result.current.sheet).toEqual({ title: 'Original', notes: '' })
    expect(view.result.current.recoveredDraftAt).toBeNull()
    expect(readDraftRaw()).toBeNull()
  })

  it('descarta rascunho quando o normalizador lança', () => {
    writeSheetDraft(
      'pj',
      UID,
      ID,
      { title: 'Explode', notes: '' },
      { baseUpdatedAt: REMOTE_UPDATED_AT, inFlightUpdatedAt: null },
      '2026-01-02T12:00:00.000Z',
    )

    const { view } = setup({
      parseDraft: () => {
        throw new Error('normalizador quebrou')
      },
    })

    expect(view.result.current.sheet?.title).toBe('Original')
    expect(view.result.current.recoveredDraftAt).toBeNull()
  })

  it('descarta envelope corrompido sem quebrar o carregamento', () => {
    window.localStorage.setItem(getSheetDraftKey('pj', UID, ID), '{isso não é json')

    const { view } = setup()

    expect(view.result.current.sheet?.title).toBe('Original')
    expect(readDraftRaw()).toBeNull()
  })
})

describe('D5 — falha da cópia local de segurança é visível', () => {
  it('expõe localBackupError quando o localStorage estoura a cota', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError')
    })

    const { view } = setup()

    act(() => view.result.current.commit({ title: 'Sem espaço', notes: '' }))

    expect(view.result.current.localBackupError).toBe('quota')
    expect(view.result.current.savingStatus).toBe('pending')

    setItemSpy.mockRestore()
  })

  it('D12a — limpa o aviso quando a escrita remota confirma (o risco acabou)', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError')
    })

    const { view } = setup()
    act(() => view.result.current.commit({ title: 'Sem espaço', notes: '' }))
    expect(view.result.current.localBackupError).toBe('quota')

    await advance(900)

    // Dado confirmado no servidor: manter o alerta "pode perder alterações" na
    // tela ao lado de "Salvo" seria mentira.
    expect(view.result.current.savingStatus).toBe('saved')
    expect(view.result.current.localBackupError).toBeNull()

    setItemSpy.mockRestore()
  })

  it('D12b — "Salvar agora" escreve mesmo sem pendência', async () => {
    const { save, view } = setup()

    act(() => view.result.current.commit({ title: 'Salva', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(1)
    expect(view.result.current.savingStatus).toBe('saved')

    // Sem nada pendente, o botão precisa escrever de verdade.
    await act(async () => {
      view.result.current.saveNow()
    })

    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1][2]).toEqual({ title: 'Salva', notes: '' })
  })

  it('limpa o aviso quando a gravação local volta a funcionar', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError')
    })

    const { view } = setup()
    act(() => view.result.current.commit({ title: 'Sem espaço', notes: '' }))
    expect(view.result.current.localBackupError).toBe('quota')

    setItemSpy.mockRestore()

    await advance(600)
    act(() => view.result.current.commit({ title: 'Com espaço', notes: '' }))

    expect(view.result.current.localBackupError).toBeNull()
  })
})

describe('P4 — status de salvamento honesto', () => {
  it('percorre pending → saving → saved', async () => {
    let resolveSave: ((value: string) => void) | null = null
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<string>((resolve) => {
          resolveSave = resolve
        }),
    )
    const { view } = setup({ save })

    act(() => view.result.current.commit({ title: 'A', notes: '' }))
    expect(view.result.current.savingStatus).toBe('pending')

    await advance(900)
    expect(view.result.current.savingStatus).toBe('saving')

    await act(async () => {
      resolveSave?.('updated-1')
    })
    expect(view.result.current.savingStatus).toBe('saved')
  })

  it('volta para pending quando o usuário edita durante uma escrita em voo', async () => {
    let resolveSave: ((value: string) => void) | null = null
    const save = vi.fn<SheetSaveFn<Doc>>(
      () =>
        new Promise<string>((resolve) => {
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
      resolveSave?.('updated-1')
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

    expect(draftData()?.title).toBe('Sem rede')
  })

  it('uma nova edição depois do erro recupera o orçamento de tentativas', async () => {
    const save = vi.fn<SheetSaveFn<Doc>>().mockRejectedValue(new Error('offline'))
    const { view } = setup({ save, retryDelaysMs: [1000] })

    act(() => view.result.current.commit({ title: 'Primeira', notes: '' }))
    await advance(900)
    await advance(1000)
    expect(save).toHaveBeenCalledTimes(2)
    expect(view.result.current.savingStatus).toBe('error')

    act(() => view.result.current.commit({ title: 'Segunda', notes: '' }))
    await advance(900)
    expect(save).toHaveBeenCalledTimes(3)

    await advance(1000)
    expect(save).toHaveBeenCalledTimes(4)
  })

  it('retry manual reenvia o pendente depois de um erro', async () => {
    const save = vi
      .fn<SheetSaveFn<Doc>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue('updated-1')
    const { view } = setup({ save, retryDelaysMs: [] })

    act(() => view.result.current.commit({ title: 'Retry', notes: '' }))
    await advance(900)
    expect(view.result.current.savingStatus).toBe('error')

    await act(async () => {
      view.result.current.saveNow()
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

  it('agrupa edições da mesma rajada em uma única entrada de histórico', () => {
    const { view } = setup()

    for (const letter of ['a', 'b', 'c', 'd', 'e']) {
      act(() =>
        view.result.current.commit((current) => ({ ...current, notes: current.notes + letter })),
      )
      vi.advanceTimersByTime(50)
    }

    expect(view.result.current.sheet?.notes).toBe('abcde')

    act(() => view.result.current.undo())

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
})

describe('D4 — atalho de desfazer não sequestra campos nem modais', () => {
  async function setupWithHistory() {
    const context = setup()
    act(() => context.view.result.current.commit({ title: 'Com atalho', notes: '' }))
    await advance(1000)
    return context
  }

  it('funciona quando o foco não está em campo de texto', async () => {
    const { view } = await setupWithHistory()

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

  it('ignora o atalho em campos de digitação (texto, número, textarea, contenteditable)', async () => {
    const { view } = await setupWithHistory()

    const textInput = document.createElement('input')
    textInput.setAttribute('type', 'text')
    // `NumberInput` renderiza type="number" e tem buffer próprio.
    const numberInput = document.createElement('input')
    numberInput.setAttribute('type', 'number')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')

    for (const field of [textInput, numberInput, textarea, editable]) {
      document.body.appendChild(field)
      act(() => {
        field.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }),
        )
      })
      expect(view.result.current.sheet?.title).toBe('Com atalho')
    }
  })

  it('D13 — funciona em controles sem desfazer nativo (checkbox, radio, select)', async () => {
    const { view } = await setupWithHistory()

    const checkbox = document.createElement('input')
    checkbox.setAttribute('type', 'checkbox')
    const radio = document.createElement('input')
    radio.setAttribute('type', 'radio')
    const select = document.createElement('select')

    for (const field of [checkbox, radio, select]) {
      document.body.appendChild(field)

      act(() => view.result.current.commit({ title: 'Marquei errado', notes: '' }))
      await advance(1000)
      expect(view.result.current.sheet?.title).toBe('Marquei errado')

      act(() => {
        field.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }),
        )
      })

      // "Marquei a caixa errada" é o arrependimento mais comum numa ficha: o
      // atalho tem de funcionar com o foco nesses controles.
      expect(view.result.current.sheet?.title).not.toBe('Marquei errado')
    }
  })

  it('ignora o atalho enquanto há diálogo modal aberto', async () => {
    const { view } = await setupWithHistory()

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    })
    expect(view.result.current.sheet?.title).toBe('Com atalho')

    dialog.remove()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
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
