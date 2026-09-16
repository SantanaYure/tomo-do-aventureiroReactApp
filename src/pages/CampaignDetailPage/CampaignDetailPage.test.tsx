import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CampaignDetailPage } from './CampaignDetailPage'
import type { Campaign, CampaignMember } from '../../types/campaign/campaign'

const mockCampaign: Campaign = {
  id: 'camp-1',
  name: 'A Maldição de Strahd',
  description: 'Uma jornada pelas brumas de Barovia.',
  system: 'dnd5e_2024',
  dmId: 'dm-1',
  dmName: 'Mestre da Masmorra',
  inviteCode: 'STRHD1',
  memberIds: ['dm-1', 'player-1'],
  creatures: [
    {
      id: 'c1',
      name: 'Lobo Sombrio',
      hpCurrent: 18,
      hpMax: 18,
      hpTemp: 0,
      armorClass: 13,
      passivePerception: 13,
      conditions: [],
      addedAt: 1000,
    },
  ],
  createdAt: 1000,
  updatedAt: 1000,
}

const mockMembers: CampaignMember[] = [
  {
    userId: 'dm-1',
    displayName: 'Mestre',
    role: 'dm',
    joinedAt: 1000,
    characterName: null,
    characterClass: null,
    vitals: null,
  },
  {
    userId: 'player-1',
    displayName: 'Jogador 1',
    role: 'player',
    joinedAt: 1005,
    characterSheetId: 'sheet-1',
    characterName: 'Valeros',
    characterClass: 'Guerreiro 3',
    vitals: {
      hpCurrent: 28,
      hpMax: 28,
      hpTemp: 0,
      armorClass: 16,
      passivePerception: 12,
      heroicInspiration: false,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
    },
  },
]

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'dm-1', displayName: 'Mestre', photoURL: null },
    loading: false,
  }),
}))

vi.mock('../../hooks/useCampaign', () => ({
  useCampaign: () => ({
    campaign: mockCampaign,
    members: mockMembers,
    isDm: true,
    currentMember: mockMembers[0],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useMonsterSheets', () => ({
  useMonsterSheets: () => ({
    monsters: [],
    isLoading: false,
    loading: false,
    error: null,
  }),
}))

describe('CampaignDetailPage — Fase 2: Painel da Sessão', () => {
  it('renderiza banner, abas e o painel da sessão por padrão', () => {
    render(
      <MemoryRouter initialEntries={['/mesas/camp-1']}>
        <Routes>
          <Route path="/mesas/:id" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'A Maldição de Strahd' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Painel da Sessão/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Integrantes & Convite/i })).toBeInTheDocument()

    // Seção de Heróis
    expect(screen.getByRole('heading', { name: /Heróis na Sessão/i })).toBeInTheDocument()
    expect(screen.getByText('Valeros')).toBeInTheDocument()
    expect(screen.getByText('Guerreiro 3')).toBeInTheDocument()

    // Seção de Criaturas
    expect(screen.getByRole('heading', { name: /Criaturas & Monstros em Cena/i })).toBeInTheDocument()
    expect(screen.getByText('Lobo Sombrio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar Criatura/i })).toBeInTheDocument()
  })

  it('permite alternar para a aba Integrantes & Convite', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/mesas/camp-1']}>
        <Routes>
          <Route path="/mesas/:id" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('tab', { name: /Integrantes & Convite/i }))
    expect(screen.getByRole('heading', { name: /Integrantes da Mesa/i })).toBeInTheDocument()
    expect(screen.getByText('Jogador 1')).toBeInTheDocument()
  })

  it('abre o modal de adicionar criatura ao clicar no botão', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/mesas/camp-1']}>
        <Routes>
          <Route path="/mesas/:id" element={<CampaignDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /Adicionar Criatura/i }))
    expect(screen.getByRole('heading', { name: 'Adicionar Criatura à Mesa' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { name: 'Adicionar Criatura à Mesa' })).not.toBeInTheDocument()
  })
})
