import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MonsterTraitsPanel } from './MonsterTraitsPanel'
import { createDefaultMonsterSheet, normalizeMonsterSheet } from '../../../store/monsterSheetStore'

function sheetWith(senses: string[]) {
  const sheet = createDefaultMonsterSheet()
  sheet.traits.senses = senses
  return sheet
}

describe('MonsterTraitsPanel: Sentidos', () => {
  it('ficha antiga, sem o campo, carrega com a lista vazia', () => {
    const legacy = createDefaultMonsterSheet() as unknown as { traits: Record<string, unknown> }
    delete legacy.traits.senses
    expect(normalizeMonsterSheet(legacy).traits.senses).toEqual([])
  })

  it('em edição, mostra o campo ao lado de Imunidades a Condições e salva um por linha', () => {
    const onChange = vi.fn()
    render(<MonsterTraitsPanel sheet={sheetWith([])} isEditing onChange={onChange} />)

    const field = screen.getByRole('textbox', { name: 'Sentidos' })
    expect(screen.getByRole('textbox', { name: 'Imunidades a Condições' })).toBeInTheDocument()

    fireEvent.change(field, { target: { value: 'Visão no escuro 18 m\nSentido sísmico 9 m\n' } })

    expect(onChange).toHaveBeenLastCalledWith({
      traits: { senses: ['Visão no escuro 18 m', 'Sentido sísmico 9 m'] },
    })
  })

  it('fora da edição, lista os sentidos preenchidos', () => {
    render(
      <MonsterTraitsPanel sheet={sheetWith(['Visão no escuro 18 m'])} isEditing={false} onChange={() => {}} />,
    )
    expect(screen.getByRole('heading', { name: 'Sentidos' })).toBeInTheDocument()
    expect(screen.getByText('Visão no escuro 18 m')).toBeInTheDocument()
  })
})
