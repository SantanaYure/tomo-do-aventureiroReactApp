import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateCampaignModal } from './CreateCampaignModal/CreateCampaignModal'
import { JoinCampaignModal } from './JoinCampaignModal/JoinCampaignModal'
import { CampaignCard } from './CampaignCard/CampaignCard'
import type { Campaign } from '../../types/campaign/campaign'

vi.mock('../../store/campaignStore', () => ({
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
})
