// Critério: "editar um campo da ficha nunca trava a interface, mesmo em fichas
// grandes".
//
// Tradução falsificável: digitar no nome da habilidade N só pode fazer rodar o
// card N. Sem memoização por card, uma tecla re-renderiza todas as habilidades.
//
// A contagem sai de um Proxy sobre o CSS Module, contando leituras de
// `resourceCard` — classe lida exatamente uma vez por card.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStyleRenderProbe } from '../../test/renderProbe'
import type { Resource } from '../../types/system/dnd'

const rowProbe = createStyleRenderProbe('resourceCard')

vi.mock('./ResourcesPanel.module.css', () => ({ default: rowProbe.styles }))

const { ResourcesPanel } = await import('./ResourcesPanel')

const RESOURCE_COUNT = 10

function makeResources(n: number): Resource[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `resource-${i + 1}`,
    name: `Habilidade ${i}`,
    description: '',
    max: 0,
    current: 0,
    recovery: '',
  }))
}

function Harness() {
  // Espelha a produção: a página guarda a ficha em estado e devolve um array
  // novo a cada edição.
  const [resources, setResources] = useState(() => makeResources(RESOURCE_COUNT))
  return (
    <ResourcesPanel
      resources={resources}
      isEditMode
      onChangeResources={setResources}
    />
  )
}

beforeEach(() => {
  rowProbe.reset()
})

describe('ResourcesPanel — custo por card', () => {
  it('digitar em uma habilidade não re-renderiza as outras', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const nameInputs = screen.getAllByPlaceholderText('Nome da habilidade')
    expect(nameInputs).toHaveLength(RESOURCE_COUNT)

    rowProbe.reset()
    await user.type(nameInputs[6], 'X')

    // A tecla precisa ter chegado ao DOM, senão a asserção abaixo seria
    // satisfeita por nada ter acontecido.
    expect((nameInputs[6] as HTMLInputElement).value).toBe('Habilidade 6X')

    // Sem memo por card isto é RESOURCE_COUNT = 10.
    expect(rowProbe.renders).toBe(1)
  })
})
