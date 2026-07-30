// Critério: "listas longas rolam suavemente sem travar" e "editar um campo
// nunca trava a interface, mesmo em fichas grandes".
//
// A tradução falsificável: digitar no item N de uma lista longa só pode fazer
// rodar a linha N. Sem memoização por linha, uma tecla re-renderiza as 200
// linhas, cada uma com ~13 nós de DOM.
//
// A contagem sai de um Proxy sobre o CSS Module do painel: cada linha lê
// `equippedTd` exatamente uma vez, então o contador mede quantas linhas
// executaram o corpo do componente de produção.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStyleRenderProbe } from '../../test/renderProbe'
import type { Character, InventoryItem } from '../../types/system/dnd'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'

const rowProbe = createStyleRenderProbe('equippedTd')

vi.mock('./InventoryPanel.module.css', () => ({ default: rowProbe.styles }))

const { InventoryPanel } = await import('./InventoryPanel')

const ITEM_COUNT = 30

function makeInventory(n: number): InventoryItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    quantity: 1,
    weight: 1,
    description: '',
    equipped: false,
  }))
}

// Espelha a produção: a página guarda a ficha em estado e devolve um array
// novo a cada edição. Um harness com handler no-op não exercitaria o caminho
// real — o input controlado nunca mudaria de valor.
function Harness({ character }: { character: Character }) {
  const [inventory, setInventory] = useState(() => makeInventory(ITEM_COUNT))
  return (
    <InventoryPanel
      inventory={inventory}
      character={character}
      isEditMode
      onChangeInventory={setInventory}
      onChangeCharacter={() => {}}
    />
  )
}

beforeEach(() => {
  rowProbe.reset()
})

describe('InventoryPanel — custo por linha', () => {
  it('monta uma leitura de sentinela por linha (validação da sonda)', () => {
    const character = createDefaultCharacterSheet().character
    render(<Harness character={character} />)

    // Cada linha lê `equippedTd` uma vez; o cabeçalho da tabela também usa a
    // classe, por isso o total é ITEM_COUNT + 1.
    expect(rowProbe.renders).toBe(ITEM_COUNT + 1)
  })

  it('digitar em um item não re-renderiza as outras linhas', async () => {
    const user = userEvent.setup()
    const character = createDefaultCharacterSheet().character
    render(<Harness character={character} />)

    const nameInputs = screen.getAllByPlaceholderText('Nome do item')
    expect(nameInputs).toHaveLength(ITEM_COUNT)

    rowProbe.reset()
    await user.type(nameInputs[2], 'X')

    // A tecla precisa ter chegado ao DOM, senão a asserção de baixo seria
    // satisfeita por nada ter acontecido.
    expect((nameInputs[2] as HTMLInputElement).value).toBe('Item 2X')

    // 2 = cabeçalho da tabela (re-renderiza com o painel, pois o array mudou
    // de identidade) + a linha editada. As outras 29 linhas não rodaram.
    // Sem memo por linha este número seria ITEM_COUNT + 1 = 31.
    expect(rowProbe.renders).toBe(2)
  })
})
