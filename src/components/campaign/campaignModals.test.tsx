import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateCampaignModal } from './CreateCampaignModal/CreateCampaignModal'
import { JoinCampaignModal } from './JoinCampaignModal/JoinCampaignModal'
import { CampaignCard } from './CampaignCard/CampaignCard'
import { DeleteCampaignModal } from './DeleteCampaignModal/DeleteCampaignModal'
import type { Campaign } from '../../types/campaign/campaign'

const updateCampaignMock = vi.fn().mockResolvedValue(undefined)

vi.mock('../../store/campaignStore', () => ({
  updateCampaign: (...args: unknown[]) => updateCampaignMock(...args),
  createCampaign: vi.fn().mockResolvedValue({
    id: 'camp-100',
    name: 'Mesa do Dragão',
    dmId: 'user-dm',
    dmName: 'Mestre',
    inviteCode: 'TM7K9P',
    memberIds: ['user-dm'],
    createdAt: 1000,
    updatedAt: 1000,
  }),
  joinCampaignByCode: vi.fn().mockResolvedValue({
    campaign: {
      id: 'camp-100',
      name: 'Mesa do Dragão',
      dmId: 'user-dm',
      dmName: 'Mestre',
      inviteCode: 'TM7K9P',
      memberIds: ['user-dm', 'user-player'],
    },
    member: {
      userId: 'user-player',
      displayName: 'Legolas',
      role: 'player',
    },
  }),
}))

vi.mock('../../hooks/useCharacterSheets', () => ({
  useCharacterSheets: () => ({
    sheets: [
      {
        id: 'sheet-1',
        data: {
          character: {
            name: 'Aelarion',
            avatar: '',
            classes: [{ id: 1, className: 'Mago', level: 3, hitDice: 'd6', notes: '', subclass: '' }],
          },
        },
      },
    ],
    isLoading: false,
    loading: false,
    error: null,
  }),
}))

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('CreateCampaignModal', () => {
  it('renderiza título, campo de nome e fecha com ESC', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onCreated = vi.fn()

    render(
      <CreateCampaignModal
        dmId="user-dm"
        dmName="Mestre"
        onCreated={onCreated}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Nova Mesa' })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome da mesa/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('valida preenchimento do nome e submete a criação', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    const onClose = vi.fn()

    render(
      <CreateCampaignModal
        dmId="user-dm"
        dmName="Mestre"
        onCreated={onCreated}
        onClose={onClose}
      />,
    )

    const input = screen.getByLabelText(/nome da mesa/i)
    await user.type(input, 'Mesa do Dragão')

    const submitBtn = screen.getByRole('button', { name: 'Criar Mesa' })
    expect(submitBtn).toBeEnabled()

    await user.click(submitBtn)
    expect(onCreated).toHaveBeenCalledOnce()
  })
})

describe('CreateCampaignModal em modo de edição', () => {
  it('vem preenchido e salva nome e descrição', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    updateCampaignMock.mockClear()

    render(
      <CreateCampaignModal
        dmId="user-dm"
        dmName="Mestre"
        campaign={{ id: 'camp-1', name: 'Strahd', description: 'Baróvia', dmId: 'user-dm', dmName: 'Mestre', inviteCode: 'X', memberIds: ['user-dm'], system: 'dnd5e_2024', createdAt: 0, updatedAt: 0 }}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Editar Mesa' })).toBeInTheDocument()
    const input = screen.getByLabelText(/nome da mesa/i)
    expect(input).toHaveValue('Strahd')

    await user.clear(input)
    await user.type(input, 'A Maldição de Strahd')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(updateCampaignMock).toHaveBeenCalledWith('camp-1', {
      name: 'A Maldição de Strahd',
      description: 'Baróvia',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('DeleteCampaignModal', () => {
  it('só libera a exclusão depois de digitar o nome da mesa', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <DeleteCampaignModal campaignName="Strahd" memberCount={3} creatureCount={1} onConfirm={onConfirm} onClose={vi.fn()} />,
    )

    const button = screen.getByRole('button', { name: 'Excluir definitivamente' })
    expect(button).toBeDisabled()
    expect(screen.getByText(/3 integrantes/)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/digite o nome da mesa/i), 'strahd')
    expect(button).toBeEnabled()
    await user.click(button)
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('mostra o erro e não fecha quando a exclusão falha', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { code: 'permission-denied' }))

    render(
      <DeleteCampaignModal campaignName="Strahd" memberCount={1} creatureCount={0} onConfirm={onConfirm} onClose={onClose} />,
    )

    await user.type(screen.getByLabelText(/digite o nome da mesa/i), 'Strahd')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Permissão negada/)
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('JoinCampaignModal', () => {
  it('renderiza campo de código e lista de personagens vinculáveis', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onJoined = vi.fn()

    render(
      <JoinCampaignModal
        userId="user-player"
        userDisplayName="Legolas"
        onJoined={onJoined}
        onClose={onClose}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Entrar em Mesa' })).toBeInTheDocument()
    expect(screen.getByLabelText(/código de convite/i)).toBeInTheDocument()
    expect(screen.getByText(/Aelarion/)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('permite digitar código e submeter entrada', async () => {
    const user = userEvent.setup()
    const onJoined = vi.fn()
    const onClose = vi.fn()

    render(
      <JoinCampaignModal
        userId="user-player"
        userDisplayName="Legolas"
        onJoined={onJoined}
        onClose={onClose}
      />,
    )

    const codeInput = screen.getByLabelText(/código de convite/i)
    await user.type(codeInput, 'TM7K9P')

    const submitBtn = screen.getByRole('button', { name: 'Entrar na Mesa' })
    expect(submitBtn).toBeEnabled()

    await user.click(submitBtn)
    expect(onJoined).toHaveBeenCalledOnce()
  })
})

describe('CampaignCard', () => {
  const mockCampaign: Campaign = {
    id: 'camp-1',
    name: 'A Forja da Fúria',
    description: 'Exploração nas montanhas antigas',
    system: 'dnd5e_2024',
    dmId: 'user-dm',
    dmName: 'Mestre',
    inviteCode: 'FRG456',
    memberIds: ['user-dm', 'user-2'],
    createdAt: 1000,
    updatedAt: 1000,
    archived: false,
  }

  it('exibe badge de Mestre quando o usuário for o criador', () => {
    render(
      <MemoryRouter>
        <CampaignCard campaign={mockCampaign} currentUserId="user-dm" />
      </MemoryRouter>,
    )

    expect(screen.getByText('A Forja da Fúria')).toBeInTheDocument()
    expect(screen.getByText(/mestre/i)).toBeInTheDocument()
    expect(screen.getByText(/2 membros/i)).toBeInTheDocument()
    expect(screen.getByText(/Cód: FRG-456/i)).toBeInTheDocument()
  })

  it('exibe badge de Jogador quando o usuário não for o Mestre', () => {
    render(
      <MemoryRouter>
        <CampaignCard campaign={mockCampaign} currentUserId="user-other" />
      </MemoryRouter>,
    )

    expect(screen.getByText(/jogador/i)).toBeInTheDocument()
    // O código secreto de convite não fica em destaque no rodapé do jogador comum
    expect(screen.queryByText(/Cód: FRG-456/i)).not.toBeInTheDocument()
  })

  it('mestre abre o menu do card e escolhe editar ou excluir', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <MemoryRouter>
        <CampaignCard campaign={mockCampaign} currentUserId="user-dm" onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    )

    // O link da mesa continua existindo, separado do botão do menu.
    expect(screen.getByRole('link', { name: 'A Forja da Fúria' })).toHaveAttribute('href', '/mesas/camp-1')
    const trigger = screen.getByRole('button', { name: /Ações da mesa/ })
    expect(trigger.closest('a')).toBeNull()

    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: 'Editar mesa' }))
    expect(onEdit).toHaveBeenCalledWith(mockCampaign)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: 'Excluir mesa' }))
    expect(onDelete).toHaveBeenCalledWith(mockCampaign)
  })

  it('jogador não vê o menu de ações', () => {
    render(
      <MemoryRouter>
        <CampaignCard campaign={mockCampaign} currentUserId="user-other" onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /Ações da mesa/ })).not.toBeInTheDocument()
  })
})
