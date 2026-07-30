// Critério do dono: "na ficha de PJ, as habilidades devem aparecer no modo
// mesa". Habilidades são o conteúdo do ResourcesPanel (aba "Habilidades").
//
// O defeito: a Seção C do modo mesa estava condicionada a
// `sheet.resources.some((r) => (r.max ?? 0) > 0)` e ainda filtrava a lista pelo
// mesmo critério, então habilidade sem usos controláveis ficava invisível.
//
// A tradução falsificável: uma ficha cujas habilidades não têm `max` precisa
// mostrar a seção e o nome de cada habilidade no modo mesa; e uma ficha mista
// precisa mostrar as duas, mantendo os controles de gasto só em quem tem usos.
//
// A ficha sai de `normalizeCharacterSheet` — o normalizador de produção por
// onde passa todo documento lido do Firestore.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createDefaultCharacterSheet } from '../../store/defaultCharacterSheet'
import { normalizeCharacterSheet } from '../../store/characterSheetStore'
import type { CharacterSheet, Resource } from '../../types/system/dnd'
import { CharacterTableMode } from './CharacterTableMode'
import styles from './CharacterTableMode.module.css'

function sheetWithResources(resources: Resource[]): CharacterSheet {
  return normalizeCharacterSheet({ ...createDefaultCharacterSheet(), resources })
}

describe('CharacterTableMode — habilidades', () => {
  it('mostra habilidade sem usos controláveis', () => {
    const sheet = sheetWithResources([
      {
        name: 'Visão no Escuro',
        description: 'Enxerga no escuro a até 18 metros.',
        origin: 'species',
        resetOn: 'na',
      },
    ])

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    expect(screen.getByText('Visão no Escuro')).toBeInTheDocument()
  })

  it('mostra a descrição da habilidade sem usos ao expandir', async () => {
    const user = userEvent.setup()
    const sheet = sheetWithResources([
      {
        name: 'Visão no Escuro',
        description: 'Enxerga no escuro a até 18 metros.',
        action: 'Passiva',
        resetOn: 'na',
      },
    ])

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Ver detalhes' }))

    expect(screen.getByText('Enxerga no escuro a até 18 metros.')).toBeInTheDocument()
    expect(screen.getByText('Ação: Passiva')).toBeInTheDocument()
  })

  it('lista habilidades com e sem usos na mesma seção', () => {
    const sheet = sheetWithResources([
      { name: 'Visão no Escuro', resetOn: 'na' },
      { name: 'Fúria', max: 2, current: 2, resetOn: 'long-rest' },
    ])

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    expect(screen.getByText('Visão no Escuro')).toBeInTheDocument()
    expect(screen.getByText('Fúria')).toBeInTheDocument()
  })

  it('gasta o uso da habilidade certa, preservando o índice real na ficha', async () => {
    const user = userEvent.setup()
    let saved: CharacterSheet | null = null
    const sheet = sheetWithResources([
      { name: 'Visão no Escuro', resetOn: 'na' },
      { name: 'Fúria', max: 2, current: 2, resetOn: 'long-rest' },
    ])

    render(<CharacterTableMode sheet={sheet} onUpdate={(updated) => { saved = updated }} />)

    // As duas precisam estar na tela; só então o resto prova algo. Sem esta
    // guarda, o teste passaria com a habilidade sem usos oculta.
    expect(screen.getByText('Visão no Escuro')).toBeInTheDocument()
    expect(screen.getByText('Fúria')).toBeInTheDocument()

    const dotGroups = screen.getAllByRole('group')
    expect(dotGroups).toHaveLength(1)
    expect(dotGroups[0]).toHaveAccessibleName(/Fúria/)

    await user.click(
      screen.getByRole('button', { name: 'Uso 2 de 2 de Fúria disponível — gastar' }),
    )

    expect(saved).not.toBeNull()
    // O índice real na ficha precisa ser preservado: a Fúria é o índice 1.
    expect(saved!.resources[1].current).toBe(1)
    expect(saved!.resources[0].name).toBe('Visão no Escuro')
  })

  it('não deixa uma faixa de controles vazia na habilidade sem usos', () => {
    // O guarda `hasUses &&` no invólucro `.resourceControls` é VISUAL, não
    // funcional: `ManagedResourceControls` já devolve null quando `max <= 0`
    // (ManagedResourceControls.tsx: `if (resource.max <= 0) return null`).
    // Contar dots ou botões, portanto, não prova nada — a asserção estaria
    // satisfeita com ou sem o guarda. O que muda de verdade é o invólucro, que
    // tem padding próprio (`.resourceControls { padding: 0 var(--space-3)
    // var(--space-2) }`) e deixaria uma faixa vazia embaixo de toda habilidade
    // sem usos. É isso que este teste tranca.
    const sheet = sheetWithResources([
      { name: 'Visão no Escuro', resetOn: 'na' },
      { name: 'Fúria', max: 2, current: 2, resetOn: 'long-rest' },
    ])

    const { container } = render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    expect(screen.getByText('Visão no Escuro')).toBeInTheDocument()
    expect(screen.getByText('Fúria')).toBeInTheDocument()

    // Dois cards, um único invólucro de controles — o da Fúria.
    const controlWrappers = container.querySelectorAll(`.${styles.resourceControls}`)
    expect(controlWrappers).toHaveLength(1)
    expect(controlWrappers[0].querySelector('[role="group"]')).toHaveAccessibleName(/Fúria/)
  })

  it('não mostra a seção quando não há habilidade cadastrada', () => {
    const sheet = sheetWithResources([])

    render(<CharacterTableMode sheet={sheet} onUpdate={() => {}} />)

    // Guarda contra o excesso de correção (mostrar a seção sempre). Esta
    // asserção já passava antes da correção — está aqui só como trava.
    expect(screen.queryByText(/^(Habilidades|Recursos)$/)).not.toBeInTheDocument()
  })
})
