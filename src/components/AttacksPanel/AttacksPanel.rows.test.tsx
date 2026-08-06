// Critério: "editar um campo da ficha nunca trava a interface, mesmo em fichas
// grandes".
//
// Tradução falsificável: digitar no nome do ataque N só pode fazer rodar a
// linha N. Sem memoização por linha, uma tecla re-renderiza todos os ataques.
//
// A contagem sai de um Proxy sobre o CSS Module, contando leituras de `nameTd`
// — classe lida uma vez por linha, mais uma no cabeçalho da tabela.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStyleRenderProbe } from '../../test/renderProbe'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import type { Character, CharacterSheet } from '../../types/system/dnd'

const rowProbe = createStyleRenderProbe('nameTd')

vi.mock('./AttacksPanel.module.css', () => ({ default: rowProbe.styles }))

const { AttacksPanel } = await import('./AttacksPanel')

const ATTACK_COUNT = 10

function makeAttacks(n: number): CharacterSheet['attacks'] {
  return Array.from({ length: n }, (_, i) => ({
    id: `attack-${i + 1}`,
    name: `Ataque ${i}`,
    attackBonus: 0,
    attributeKey: 'manual',
    useProficiency: false,
    damage: '',
    damageType: '',
    damages: [],
  })) as CharacterSheet['attacks']
}

// Estáveis fora do componente de propósito: na página real estes handlers são
// `useCallback` e o personagem vem da ficha. Recriá-los no corpo do render
// inventaria uma instabilidade que a produção não tem, e o teste acusaria uma
// falha de memoização inexistente.
const STABLE_CHARACTER: Character = createDefaultCharacterSheet().character

function Harness() {
  const [attacks, setAttacks] = useState(() => makeAttacks(ATTACK_COUNT))
  return (
    <AttacksPanel
      attacks={attacks}
      character={STABLE_CHARACTER}
      isEditMode
      onChangeAttacks={setAttacks}
    />
  )
}

beforeEach(() => {
  rowProbe.reset()
})

describe('AttacksPanel — custo por linha', () => {
  it('digitar em um ataque não re-renderiza as outras linhas', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const nameInputs = screen.getAllByPlaceholderText('Nome')
    expect(nameInputs).toHaveLength(ATTACK_COUNT)

    rowProbe.reset()
    await user.type(nameInputs[4], 'X')

    // A tecla precisa ter chegado ao DOM, senão a asserção abaixo seria
    // satisfeita por nada ter acontecido.
    expect((nameInputs[4] as HTMLInputElement).value).toBe('Ataque 4X')

    // 2 = cabeçalho da tabela + a linha editada.
    // Sem memo por linha isto é ATTACK_COUNT + 1 = 11.
    expect(rowProbe.renders).toBe(2)
  })
})
