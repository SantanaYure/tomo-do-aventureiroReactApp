// Critério: "editar um campo da ficha nunca trava a interface".
//
// A tradução falsificável disso é: uma tecla digitada num painel só pode fazer
// rodar o painel editado. O resumo de combate (sempre montado), o cabeçalho e os
// painéis irmãos da mesma aba não podem re-renderizar.
//
// A contagem sai de `createStyleRenderProbe`, que troca o CSS Module de cada
// componente por um Proxy que conta as leituras da classe sentinela. Quem conta é
// o corpo do componente de produção: se o `memo` aborta, nada é lido.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import { createStyleRenderProbe } from '../../test/renderProbe'
import type { CharacterSheet } from '../../types/system/dnd'
import type { SheetGroup } from '../../types/system/dnd/SheetGroup'

const UID = 'uid-teste'
const SHEET_ID = 'ficha-render'

const headerProbe = createStyleRenderProbe('header')
const summaryProbe = createStyleRenderProbe('statsGrid')
const spellsProbe = createStyleRenderProbe('spellHeader')
const combatProbe = createStyleRenderProbe('summary')
const attacksProbe = createStyleRenderProbe('tableWrapper')

vi.mock('../../components/CharacterHeader/CharacterHeader.module.css', () => ({
  default: headerProbe.styles,
}))
vi.mock('../../components/CharacterCombatSummary/CharacterCombatSummary.module.css', () => ({
  default: summaryProbe.styles,
}))
vi.mock('../../components/SpellsPanel/SpellsPanel.module.css', () => ({
  default: spellsProbe.styles,
}))
vi.mock('../../components/CombatPanel/CombatPanel.module.css', () => ({
  default: combatProbe.styles,
}))
vi.mock('../../components/AttacksPanel/AttacksPanel.module.css', () => ({
  default: attacksProbe.styles,
}))

vi.mock('../../services/firebase', () => ({ db: {}, auth: {} }))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ uid: UID, user: { uid: UID }, loading: false }),
}))

// Espelha a produção: `useSheetGroups` guarda os grupos em `useState`, então a
// identidade do array não muda entre renders. Devolver `[]` novo a cada chamada
// inventaria uma instabilidade que o app real não tem.
const STABLE_GROUPS: SheetGroup[] = []
vi.mock('../../hooks/useSheetGroups', () => ({
  useSheetGroups: () => ({ groups: STABLE_GROUPS, isLoading: false, error: null }),
}))

const base = createDefaultCharacterSheet()
const remoteSheet: CharacterSheet = {
  ...base,
  isEditMode: true,
  character: { ...base.character, name: 'Ficha Grande' },
  spells: [
    { name: 'Luz', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], prepared: false, description: '' },
    { name: 'Prestidigitação', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], prepared: false, description: '' },
  ],
  attacks: [
    { name: 'Espada longa', attributeKey: 'str', useProficiency: true, attackBonus: 0, damage: '1d8', damageType: 'Cortante' },
    { name: 'Adaga', attributeKey: 'dex', useProficiency: true, attackBonus: 0, damage: '1d4', damageType: 'Perfurante' },
  ] as CharacterSheet['attacks'],
}

vi.mock('../../hooks/useCharacterSheet', () => ({
  useCharacterSheet: () => ({
    sheet: {
      id: SHEET_ID,
      data: remoteSheet,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
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
    saveCharacterSheet: vi.fn().mockResolvedValue(undefined),
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

function resetProbes() {
  headerProbe.reset()
  summaryProbe.reset()
  spellsProbe.reset()
  combatProbe.reset()
  attacksProbe.reset()
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  resetProbes()
})

describe('CharacterSheetPage — custo de render por tecla', () => {
  it('a sonda conta exatamente um render por montagem (validação da sonda)', () => {
    renderPage()

    expect(headerProbe.renders).toBe(1)
    expect(summaryProbe.renders).toBe(1)
  })

  it('digitar em uma magia não re-renderiza o cabeçalho nem o resumo de combate', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Magias' }))
    const nameInputs = screen.getAllByPlaceholderText('Nome da magia')
    expect(nameInputs).toHaveLength(2)

    resetProbes()
    await user.type(nameInputs[0], 'X')

    // O painel editado precisa ter rodado e a tecla precisa ter chegado ao DOM:
    // sem isso a asserção de "não re-renderizou" seria satisfeita por nada.
    expect((nameInputs[0] as HTMLInputElement).value).toBe('LuzX')
    expect(spellsProbe.renders).toBeGreaterThanOrEqual(1)

    expect(summaryProbe.renders).toBe(0)
    expect(headerProbe.renders).toBe(0)
  })

  it('digitar em um ataque não re-renderiza o painel de combate da mesma aba', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Combate' }))
    const attackNameInput = screen.getAllByPlaceholderText('Nome')[0]

    resetProbes()
    await user.type(attackNameInput, 'X')

    expect((attackNameInput as HTMLInputElement).value).toBe('Espada longaX')
    expect(attacksProbe.renders).toBeGreaterThanOrEqual(1)

    expect(combatProbe.renders).toBe(0)
    expect(summaryProbe.renders).toBe(0)
    expect(headerProbe.renders).toBe(0)
  })

  it('editar o nome no cabeçalho ainda atualiza o resumo de combate e o título', async () => {
    const user = userEvent.setup()
    renderPage()

    const speedInput = screen.getByPlaceholderText('Nome do personagem')
    resetProbes()
    await user.type(speedInput, '!')

    expect((speedInput as HTMLInputElement).value).toBe('Ficha Grande!')
    // Mudou `character`: o resumo de combate depende dele e TEM de re-renderizar.
    expect(summaryProbe.renders).toBeGreaterThanOrEqual(1)
    expect(headerProbe.renders).toBeGreaterThanOrEqual(1)
  })
})
