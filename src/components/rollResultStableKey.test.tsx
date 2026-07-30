// Cenário reproduzido pelo revisor, inteiramente pela interface:
//
//   Ataques [Adaga(1d6), Espada(1d6), Arco(1d10)]. Expandir Espada, rolar dano.
//   Entrar em modo de edição (o painel NÃO desmonta — `isEditMode` é prop),
//   remover Adaga, voltar ao modo mesa.
//
// Com o estado chaveado por índice, o resultado do 1d6 da Espada aparecia no
// Arco — e o `aria-label` afirmava, com confiança, que aquele dano era do Arco.
// Numa mesa de jogo isso é dano errado atribuído à arma errada.
//
// A tradução falsificável: depois de remover um item ANTERIOR ao que rolou, o
// resultado tem de continuar no mesmo item; e nenhum item que não rolou pode
// exibir resultado.
//
// As fichas saem de `normalizeCharacterSheet` — o normalizador de produção, que
// agora também é quem gera o id estável de fichas antigas sem o campo.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacterSheet } from '../store/defaultCharacterSheet'
import { normalizeCharacterSheet } from '../store/characterSheetStore'
import type { Attack, Character, CharacterSheet, Resource } from '../types/system/dnd'
import { AttacksPanel } from './AttacksPanel/AttacksPanel'
import { ResourcesPanel } from './ResourcesPanel/ResourcesPanel'
import { CharacterTableMode } from './CharacterTableMode/CharacterTableMode'

const D6 = [{ dice: '1d6', type: 'Fogo', bonus: '' }]
const D10 = [{ dice: '1d10', type: 'Perfuração', bonus: '' }]

const CLEAR_LABEL = /^Limpar resultado da rolagem de /

beforeEach(() => {
  // 1d6 → 4 e 1d10 → 6. Totais distintos, então dá para provar de qual item o
  // resultado veio, e não só que "existe um resultado".
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function sheetWith(patch: Partial<CharacterSheet>): CharacterSheet {
  return normalizeCharacterSheet({ ...createDefaultCharacterSheet(), ...patch })
}

/** Rótulos dos botões de limpar visíveis agora — mostra em QUEM está o resultado. */
function clearLabels(): string[] {
  return screen
    .queryAllByRole('button', { name: CLEAR_LABEL })
    .map((button) => button.getAttribute('aria-label') ?? '')
}

const THREE_ATTACKS: Attack[] = [
  { name: 'Adaga', attributeKey: 'dex', damages: D6 },
  { name: 'Espada', attributeKey: 'str', damages: D6 },
  { name: 'Arco', attributeKey: 'dex', damages: D10 },
]

describe('AttacksPanel — resultado não migra quando um ataque anterior é removido', () => {
  // Espelha a produção: a página guarda a ficha em estado e alterna
  // `isEditMode` como prop. O painel continua montado o tempo todo, que é
  // exatamente a condição em que o bug aparecia.
  function Harness() {
    const sheet = sheetWith({ attacks: THREE_ATTACKS })
    const [attacks, setAttacks] = useState<Attack[]>(sheet.attacks)
    const [isEditMode, setIsEditMode] = useState(false)

    return (
      <>
        <button type="button" onClick={() => setIsEditMode((previous) => !previous)}>
          alternar edição
        </button>
        <AttacksPanel
          attacks={attacks}
          character={sheet.character}
          isEditMode={isEditMode}
          onChangeAttacks={setAttacks}
        />
      </>
    )
  }

  it('o resultado da Espada continua na Espada depois de remover a Adaga', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // Expande a Espada (2ª linha) e rola.
    const expandButtons = screen.getAllByRole('button', { name: 'Expandir detalhes' })
    expect(expandButtons).toHaveLength(3)
    await user.click(expandButtons[1])
    await user.click(screen.getByRole('button', { name: 'Rolar dano' }))

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Espada'])
    expect(screen.getByText('Total: 4')).toBeInTheDocument()

    // Modo de edição → remove a Adaga → volta.
    await user.click(screen.getByRole('button', { name: 'alternar edição' }))
    await user.click(screen.getByRole('button', { name: 'Remover ataque Adaga' }))
    await user.click(screen.getByRole('button', { name: 'alternar edição' }))

    // Antes da correção isto era ['Limpar resultado da rolagem de Arco'].
    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Espada'])
    // E o dano continua sendo o 1d6 da Espada, não o 1d10 do Arco.
    expect(screen.getByText('1d6 Fogo: 4')).toBeInTheDocument()
    expect(screen.queryByText('1d10 Perfuração: 6')).not.toBeInTheDocument()
  })

  it('a linha expandida também não migra', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getAllByRole('button', { name: 'Expandir detalhes' })[1])
    expect(screen.getAllByRole('button', { name: 'Recolher detalhes' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'alternar edição' }))
    await user.click(screen.getByRole('button', { name: 'Remover ataque Adaga' }))
    await user.click(screen.getByRole('button', { name: 'alternar edição' }))

    // A Espada (agora 1ª linha) segue expandida; o Arco, recolhido.
    const collapse = screen.getAllByRole('button', { name: 'Recolher detalhes' })
    expect(collapse).toHaveLength(1)
    const rows = screen.getAllByRole('row')
    const espadaRow = rows.find((row) => row.textContent?.includes('Espada'))
    expect(espadaRow).toBeDefined()
    expect(espadaRow!.contains(collapse[0])).toBe(true)
  })

  it('dois ataques rolados mantêm cada resultado no seu dono', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const expandButtons = screen.getAllByRole('button', { name: 'Expandir detalhes' })
    await user.click(expandButtons[1])
    await user.click(expandButtons[2])

    const rollButtons = screen.getAllByRole('button', { name: 'Rolar dano' })
    expect(rollButtons).toHaveLength(2)
    await user.click(rollButtons[0])
    await user.click(rollButtons[1])

    expect(clearLabels()).toEqual([
      'Limpar resultado da rolagem de Espada',
      'Limpar resultado da rolagem de Arco',
    ])
    expect(screen.getByText('1d6 Fogo: 4')).toBeInTheDocument()
    expect(screen.getByText('1d10 Perfuração: 6')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar resultado da rolagem de Espada' }))

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Arco'])
    expect(screen.getByText('1d10 Perfuração: 6')).toBeInTheDocument()
    expect(screen.queryByText('1d6 Fogo: 4')).not.toBeInTheDocument()
  })
})

describe('ResourcesPanel — resultado não migra quando uma habilidade anterior é removida', () => {
  const THREE_RESOURCES: Resource[] = [
    { name: 'Sopro', resetOn: 'manual', damages: D6 },
    { name: 'Chama', resetOn: 'manual', damages: D6 },
    { name: 'Raio', resetOn: 'manual', damages: D10 },
  ]

  function Harness() {
    const sheet = sheetWith({ resources: THREE_RESOURCES })
    const [resources, setResources] = useState<Resource[]>(sheet.resources)
    const [isEditMode, setIsEditMode] = useState(false)

    return (
      <>
        <button type="button" onClick={() => setIsEditMode((previous) => !previous)}>
          alternar edição
        </button>
        <ResourcesPanel
          resources={resources}
          isEditMode={isEditMode}
          onChangeResources={setResources}
        />
      </>
    )
  }

  it('o resultado da Chama continua na Chama depois de remover o Sopro', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const rollButtons = screen.getAllByRole('button', { name: /Rolar dano/ })
    expect(rollButtons).toHaveLength(3)
    await user.click(rollButtons[1])

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Chama'])

    await user.click(screen.getByRole('button', { name: 'alternar edição' }))
    await user.click(screen.getByRole('button', { name: 'Excluir habilidade Sopro' }))
    await user.click(screen.getByRole('button', { name: 'alternar edição' }))

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Chama'])
    expect(screen.getByText('1d6 Fogo: 4')).toBeInTheDocument()
    expect(screen.queryByText('1d10 Perfuração: 6')).not.toBeInTheDocument()
  })
})

describe('CharacterTableMode — resultado não migra quando a ficha muda embaixo', () => {
  // No modo mesa a lista muda sem passar pelo painel de edição: outro
  // dispositivo grava via onSnapshot, ou o usuário desfaz uma remoção.
  function Harness({ character }: { character: Character }) {
    const [sheet, setSheet] = useState<CharacterSheet>(() =>
      sheetWith({ attacks: THREE_ATTACKS, character }),
    )

    return (
      <>
        <button
          type="button"
          onClick={() =>
            setSheet((previous) => ({
              ...previous,
              attacks: previous.attacks.filter((attack) => attack.name !== 'Adaga'),
            }))
          }
        >
          remover adaga
        </button>
        <CharacterTableMode sheet={sheet} onUpdate={setSheet} />
      </>
    )
  }

  it('o resultado da Espada continua na Espada depois de remover a Adaga', async () => {
    const user = userEvent.setup()
    render(<Harness character={createDefaultCharacterSheet().character} />)

    await user.click(screen.getByRole('button', { name: /Espada/ }))
    await user.click(screen.getByRole('button', { name: /Rolar dano/ }))

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Espada'])

    await user.click(screen.getByRole('button', { name: 'remover adaga' }))

    expect(clearLabels()).toEqual(['Limpar resultado da rolagem de Espada'])
    expect(screen.getByText('1d6 Fogo: 4')).toBeInTheDocument()
    // `1d10` também aparece no resumo de dano do card do Arco, então a
    // ausência precisa ser checada na linha de rolagem, não no texto solto.
    expect(screen.queryByText('1d10 Perfuração: 6')).not.toBeInTheDocument()
  })
})
