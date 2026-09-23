import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddCreatureModal } from './AddCreatureModal'

vi.mock('../../../hooks/useMonsterSheets', () => ({
  useMonsterSheets: () => ({
    isLoading: false,
    error: null,
    monsters: [
      {
        id: 'm-1',
        data: {
          details: { name: 'Valerius (O Gerente)', kind: 'npc', avatar: '' },
          stats: { maxHp: 55, hpCurrent: 55, hpTemp: 0, ac: 15, wisdom: 12, dexterity: 14 },
          traits: { challengeRating: '3' },
        },
      },
      {
        id: 'm-2',
        data: {
          details: { name: 'Goblin', kind: 'monster', avatar: '' },
          stats: { maxHp: 7, hpCurrent: 7, hpTemp: 0, ac: 15, wisdom: 8, dexterity: 14 },
          traits: { challengeRating: '1/4' },
        },
      },
    ],
  }),
}))

describe('AddCreatureModal — biblioteca', () => {
  it('clicar na criatura já adiciona à sessão e fecha, sem botão de confirmar', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<AddCreatureModal userId="dm-1" onAdd={onAdd} onClose={onClose} />)

    expect(screen.queryByRole('button', { name: /Adicionar à Sessão/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adicionar Valerius (O Gerente) à sessão' }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Valerius (O Gerente)', monsterSheetId: 'm-1', ownerId: 'dm-1', hpMax: 55 }),
      1,
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('usa a quantidade escolhida antes do clique', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(<AddCreatureModal userId="dm-1" onAdd={onAdd} onClose={vi.fn()} />)

    const quantity = screen.getByLabelText('Quantidade')
    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.click(screen.getByRole('button', { name: 'Adicionar Goblin à sessão' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Goblin' }), 3)
  })

  it('se falhar, mostra o erro e continua aberto', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onAdd = vi.fn().mockRejectedValue(new Error('offline'))
    render(<AddCreatureModal userId="dm-1" onAdd={onAdd} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Adicionar Goblin à sessão' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível/)
    expect(onClose).not.toHaveBeenCalled()
    // Libera os itens para tentar de novo.
    expect(screen.getByRole('button', { name: 'Adicionar Goblin à sessão' })).toBeEnabled()
  })

  it('a criatura rápida continua com o botão de adicionar', async () => {
    const user = userEvent.setup()
    render(<AddCreatureModal userId="dm-1" onAdd={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /Criatura Rápida/ }))
    expect(screen.getByRole('button', { name: /Adicionar à Sessão/ })).toBeInTheDocument()
  })
})
