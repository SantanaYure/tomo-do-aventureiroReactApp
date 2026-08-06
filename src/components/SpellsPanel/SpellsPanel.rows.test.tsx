// Critério: "editar um campo da ficha nunca trava a interface, mesmo em fichas
// grandes" e "listas longas rolam suavemente sem travar".
//
// Tradução falsificável: digitar no nome da magia N só pode fazer rodar a linha
// N. Sem memoização por linha, uma tecla re-renderiza todas as magias do nível.
//
// A contagem sai de um Proxy sobre o CSS Module, contando leituras de
// `spellRow` — classe lida exatamente uma vez por linha. Quem conta é o corpo
// do componente de produção: se o memo aborta, nada é lido.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStyleRenderProbe } from '../../test/renderProbe'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import type { Character, CharacterSheet } from '../../types/system/dnd'

const rowProbe = createStyleRenderProbe('spellRow')

vi.mock('./SpellsPanel.module.css', () => ({ default: rowProbe.styles }))

const { SpellsPanel } = await import('./SpellsPanel')

const SPELL_COUNT = 12

function makeSpells(n: number): CharacterSheet['spells'] {
  return Array.from({ length: n }, (_, i) => ({
    name: `Magia ${i}`,
    // Nível 0 (truques) é o único que o painel já abre por padrão
    // (`expandedLevels` começa em `new Set([0])`).
    level: 0,
    school: '',
    castingTime: '',
    range: '',
    duration: '',
    components: [],
    prepared: false,
    description: '',
  })) as CharacterSheet['spells']
}

// Fora do componente de propósito: espelha a produção, onde `spellSlots` vem
// da ficha e mantém identidade estável entre renders. Criar isto no corpo do
// render inventaria uma instabilidade que o app real não tem — e faria o teste
// acusar falha de memoização que não existe.
const STABLE_SLOTS = createDefaultCharacterSheet().spellSlots

// No-ops estáveis pelo mesmo motivo: na página real estes handlers são
// `useCallback`. Arrows inline no harness seriam recriadas a cada render e
// acusariam uma falha de memoização inexistente.
const NOOP = () => {}

function Harness({ character }: { character: Character }) {
  // Espelha a produção: a página guarda a ficha em estado e devolve um array
  // novo a cada edição. Handler no-op não exercitaria o caminho real.
  const [spells, setSpells] = useState(() => makeSpells(SPELL_COUNT))
  return (
    <SpellsPanel
      spells={spells}
      character={character}
      isEditMode
      onChangeCharacter={NOOP}
      onChangeSpells={setSpells}
      slotsData={STABLE_SLOTS}
      onChangeSlotsData={NOOP}
    />
  )
}

beforeEach(() => {
  rowProbe.reset()
})

describe('SpellsPanel — custo por linha', () => {
  it('digitar em uma magia não re-renderiza as outras linhas', async () => {
    const user = userEvent.setup()
    const character = createDefaultCharacterSheet().character
    render(<Harness character={character} />)

    const nameInputs = screen.getAllByPlaceholderText('Nome da magia')
    expect(nameInputs).toHaveLength(SPELL_COUNT)

    rowProbe.reset()
    await user.type(nameInputs[3], 'X')

    // A tecla precisa ter chegado ao DOM, senão a asserção abaixo seria
    // satisfeita por nada ter acontecido.
    expect((nameInputs[3] as HTMLInputElement).value).toBe('Magia 3X')

    // Sem memo por linha isto é SPELL_COUNT (todas as linhas do nível).
    expect(rowProbe.renders).toBe(1)
  })
})
