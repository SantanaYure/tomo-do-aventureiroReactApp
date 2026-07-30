// Critério: "toda a navegação principal funciona só com teclado".
//
// As abas são a navegação principal dentro de uma ficha. Aqui dá para verificar
// comportamento de verdade, sem depender de CSS.
//
// Este arquivo também existe por um motivo concreto: durante este trabalho eu
// removi por acidente a barra de abas inteira da ficha de monstro, num script
// de refatoração cujo regex engoliu mais do que devia. `tsc`, `eslint` e os 133
// testes continuaram passando, porque nada verificava que as abas existiam. A
// última seção cobre exatamente isso.

import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SheetTabs } from './SheetTabs'

const TABS = ['Mesa', 'Principal', 'Combate', 'Magias'] as const
type Tab = (typeof TABS)[number]

const BUTTON_IDS: Record<Tab, string> = {
  Mesa: 'tab-mesa',
  Principal: 'tab-principal',
  Combate: 'tab-combate',
  Magias: 'tab-magias',
}

const PANEL_IDS: Record<Tab, string> = {
  Mesa: 'panel-mesa',
  Principal: 'panel-principal',
  Combate: 'panel-combate',
  Magias: 'panel-magias',
}

function Harness() {
  const [activeTab, setActiveTab] = useState<Tab>('Principal')
  return (
    <SheetTabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabButtonIds={BUTTON_IDS}
      tabPanelIds={PANEL_IDS}
      ariaLabel="Seções da ficha"
      tabClassName="tab"
      activeTabClassName="tabActive"
    />
  )
}

describe('SheetTabs — semântica', () => {
  it('expõe um tablist com a aba ativa marcada', () => {
    render(<Harness />)

    expect(screen.getByRole('tablist', { name: 'Seções da ficha' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Mesa' })).toHaveAttribute('aria-selected', 'false')
  })

  it('cada aba aponta para o painel que controla', () => {
    render(<Harness />)

    for (const nome of TABS) {
      expect(screen.getByRole('tab', { name: nome })).toHaveAttribute('aria-controls', PANEL_IDS[nome])
    }
  })
})

describe('SheetTabs — navegação por teclado', () => {
  it('só a aba ativa entra na ordem de tabulação (roving tabindex)', () => {
    render(<Harness />)

    // Sem isto, alcançar o conteúdo da ficha exigiria passar por todas as abas.
    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveAttribute('tabindex', '0')
    for (const nome of ['Mesa', 'Combate', 'Magias']) {
      expect(screen.getByRole('tab', { name: nome })).toHaveAttribute('tabindex', '-1')
    }
  })

  it('Tab leva o foco à aba ativa, não à primeira', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.tab()

    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveFocus()
  })

  it('as setas trocam de aba e levam o foco junto', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.tab()
    await user.keyboard('{ArrowRight}')

    const combate = screen.getByRole('tab', { name: 'Combate' })
    expect(combate).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => combate === document.activeElement).toBe(true)

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Principal' })).toHaveAttribute('aria-selected', 'true')
  })

  it('a navegação por setas circula nas pontas', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.tab()
    // De 'Principal' (índice 1) para a esquerda: 'Mesa' e então dá a volta.
    await user.keyboard('{ArrowLeft}{ArrowLeft}')

    expect(screen.getByRole('tab', { name: 'Magias' })).toHaveAttribute('aria-selected', 'true')
  })

  it('Home e End vão para a primeira e a última aba', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.tab()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Magias' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Mesa' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('as páginas de ficha realmente montam a barra de abas', () => {
  // Guarda contra a regressão que aconteceu de verdade: a barra sumiu da ficha
  // de monstro e nada acusou, porque `handleTabChange` continuava definido e o
  // `role="tabpanel"` seguia apontando para um botão que não existia mais.
  it.each([
    ['CharacterSheetPage', 'src/pages/CharacterSheetPage/CharacterSheetPage.tsx'],
    ['MonsterSheetPage', 'src/pages/MonsterSheetPage/MonsterSheetPage.tsx'],
  ])('%s renderiza <SheetTabs>', async (_nome, caminho) => {
    const { readFileSync } = await import('node:fs')
    const fonte = readFileSync(caminho, 'utf8')

    expect(fonte).toMatch(/<SheetTabs\b/)
    // E o painel precisa continuar apontando para os ids das abas.
    expect(fonte).toMatch(/role="tabpanel"/)
    expect(fonte).toMatch(/tabButtonIds=\{TAB_BUTTON_IDS\}/)
  })
})
