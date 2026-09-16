import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CampaignsPage } from './CampaignsPage'
import type { Campaign } from '../../types/campaign/campaign'

const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'A Maldição de Strahd',
    description: 'Campanha em Barovia',
    system: 'dnd5e_2024',
    dmId: 'user-1',
    dmName: 'Mestre',
    inviteCode: 'STRHD1',
    memberIds: ['user-1'],
    createdAt: 1000,
    updatedAt: 1000,
    archived: false,
  },
  {
    id: 'camp-2',
    name: 'Mina Perdida de Phandelver',
    description: 'Aventura inicial',
    system: 'dnd5e_2024',
    dmId: 'dm-other',
    dmName: 'Outro Mestre',
    inviteCode: 'PHNDLV',
    memberIds: ['dm-other', 'user-1'],
    createdAt: 2000,
    updatedAt: 2000,
    archived: false,
  },
]

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1', displayName: 'Aventureiro', photoURL: null },
    loading: false,
  }),
}))

vi.mock('../../hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: mockCampaigns,
    dmCampaigns: [mockCampaigns[0]],
    playerCampaigns: [mockCampaigns[1]],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useCharacterSheets', () => ({
  useCharacterSheets: () => ({
    sheets: [],
    isLoading: false,
    loading: false,
    error: null,
  }),
}))

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('CampaignsPage', () => {
  it('renderiza título, abas de filtro e lista de mesas', () => {
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Mesas & Campanhas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas \(2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Como Mestre \(1\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Como Jogador \(1\)/i })).toBeInTheDocument()

    expect(screen.getByText('A Maldição de Strahd')).toBeInTheDocument()
    expect(screen.getByText('Mina Perdida de Phandelver')).toBeInTheDocument()
  })

  it('filtra as mesas ao clicar nas abas', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>,
    )

    // Clica em "Como Mestre"
    await user.click(screen.getByRole('button', { name: /Como Mestre \(1\)/i }))
    expect(screen.getByText('A Maldição de Strahd')).toBeInTheDocument()
    expect(screen.queryByText('Mina Perdida de Phandelver')).not.toBeInTheDocument()

    // Clica em "Como Jogador"
    await user.click(screen.getByRole('button', { name: /Como Jogador \(1\)/i }))
    expect(screen.queryByText('A Maldição de Strahd')).not.toBeInTheDocument()
    expect(screen.getByText('Mina Perdida de Phandelver')).toBeInTheDocument()
  })

  it('abre os modais ao clicar nos botões de ação', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CampaignsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /Nova Mesa/i }))
    expect(screen.getByRole('heading', { name: 'Nova Mesa' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { name: 'Nova Mesa' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Entrar com Código/i }))
    expect(screen.getByRole('heading', { name: 'Entrar em Mesa' })).toBeInTheDocument()
  })
})
