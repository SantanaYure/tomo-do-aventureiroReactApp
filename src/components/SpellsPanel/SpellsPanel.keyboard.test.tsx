// Critério: "toda a navegação principal funciona só com teclado".
//
// Marcar uma magia como preparada era um `<span>` com `onClick`: sem role, sem
// tabIndex e sem tratamento de teclado. Quem usa teclado simplesmente não
// conseguia preparar uma magia — a ação existia só para o mouse.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SpellsPanel } from './SpellsPanel'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import type { Character, CharacterSheet } from '../../types/system/dnd'

const STABLE_SLOTS = createDefaultCharacterSheet().spellSlots
const STABLE_CHARACTER: Character = createDefaultCharacterSheet().character
const NOOP = () => {}

function makeSpells(): CharacterSheet['spells'] {
  return [
    {
      name: 'Luz',
      level: 0,
      school: '',
      castingTime: '',
      range: '',
      duration: '',
      components: [],
      prepared: false,
      description: '',
    },
  ] as CharacterSheet['spells']
}

function Harness({ isEditMode }: { isEditMode: boolean }) {
  const [spells, setSpells] = useState(makeSpells)
  return (
    <SpellsPanel
      spells={spells}
      character={STABLE_CHARACTER}
      isEditMode={isEditMode}
      onChangeCharacter={NOOP}
      onChangeSpells={setSpells}
      slotsData={STABLE_SLOTS}
      onChangeSlotsData={NOOP}
    />
  )
}

describe('SpellsPanel — preparar magia pelo teclado', () => {
  it.each([
    ['modo de edição', true],
    ['modo de leitura', false],
  ])('o marcador de preparada é um botão alcançável (%s)', (_rotulo, isEditMode) => {
    render(<Harness isEditMode={isEditMode} />)

    const botao = screen.getByRole('button', { name: /Preparada: Luz/i })
    expect(botao).toBeInTheDocument()
    // `aria-pressed` para o leitor de tela anunciar o estado, não só a estrela.
    expect(botao).toHaveAttribute('aria-pressed', 'false')
  })

  it('alterna o estado com Enter, sem usar o mouse', async () => {
    const user = userEvent.setup()
    render(<Harness isEditMode />)

    const botao = screen.getByRole('button', { name: /Preparada: Luz/i })
    botao.focus()
    expect(botao).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(screen.getByRole('button', { name: /Preparada: Luz/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('alterna o estado com a barra de espaço', async () => {
    const user = userEvent.setup()
    render(<Harness isEditMode />)

    screen.getByRole('button', { name: /Preparada: Luz/i }).focus()
    await user.keyboard(' ')

    expect(screen.getByRole('button', { name: /Preparada: Luz/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('nomeia a magia sem nome de forma compreensível', () => {
    render(
      <SpellsPanel
        spells={[{ ...makeSpells()[0], name: '' }]}
        character={STABLE_CHARACTER}
        isEditMode
        onChangeCharacter={NOOP}
        onChangeSpells={NOOP}
        slotsData={STABLE_SLOTS}
        onChangeSlotsData={NOOP}
      />,
    )

    expect(screen.getByRole('button', { name: /Preparada: magia sem nome/i })).toBeInTheDocument()
  })
})
