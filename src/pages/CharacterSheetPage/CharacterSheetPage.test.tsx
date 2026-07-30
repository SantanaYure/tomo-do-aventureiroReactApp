// Verifica a fiação da página de PJ com a camada de persistência:
// recuperação de rascunho local e controles de histórico.

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import { writeSheetDraft } from '../../utils/sheetDraft'
import type { CharacterSheet } from '../../types/system/dnd'

const UID = 'uid-teste'
const SHEET_ID = 'ficha-teste'
const REMOTE_UPDATED_AT = '2026-01-02T00:00:00.000Z'

const saveCharacterSheetMock = vi.fn().mockResolvedValue(undefined)

vi.mock('../../services/firebase', () => ({ db: {}, auth: {} }))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ uid: UID, user: { uid: UID }, loading: false }),
}))

vi.mock('../../hooks/useSheetGroups', () => ({
  useSheetGroups: () => ({ groups: [], isLoading: false }),
}))

const remoteSheet: CharacterSheet = {
  ...createDefaultCharacterSheet(),
  character: { ...createDefaultCharacterSheet().character, name: 'Nome Remoto' },
}

vi.mock('../../hooks/useCharacterSheet', () => ({
  useCharacterSheet: () => ({
    sheet: {
      id: SHEET_ID,
      data: remoteSheet,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: REMOTE_UPDATED_AT,
    },
    loading: false,
    notFound: false,
    error: null,
  }),
}))

vi.mock('../../store/characterSheetStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/characterSheetStore')>()
  return {
    ...actual,
    saveCharacterSheet: (...args: unknown[]) => saveCharacterSheetMock(...args),
    deleteCharacterSheet: vi.fn().mockResolvedValue(undefined),
  }
})

const { CharacterSheetPage } = await import('./CharacterSheetPage')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/ficha/${SHEET_ID}`]}>
      <Routes>
        <Route path="/ficha/:id" element={<CharacterSheetPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  saveCharacterSheetMock.mockClear()
})

describe('CharacterSheetPage — fiação da persistência', () => {
  it('abre com os dados remotos, sem aviso de recuperação e sem histórico', () => {
    renderPage()

    expect(screen.getByRole('button', { name: 'Desfazer última alteração' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Refazer alteração desfeita' })).toBeDisabled()
    expect(screen.queryByText(/Recuperamos alterações/)).not.toBeInTheDocument()
  })

  it('recupera o rascunho local mais recente que o documento remoto', async () => {
    const draft: CharacterSheet = {
      ...remoteSheet,
      character: { ...remoteSheet.character, name: 'Nome Não Salvo' },
    }

    writeSheetDraft(
      'pj',
      UID,
      SHEET_ID,
      draft,
      REMOTE_UPDATED_AT,
      '2026-01-02T10:00:00.000Z',
    )

    renderPage()

    expect(screen.getByText(/Recuperamos alterações/)).toBeInTheDocument()
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(document.title).toBe('Nome Não Salvo')
  })
})
