import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HeroVitalCard } from './HeroVitalCard/HeroVitalCard'
import { CreatureVitalCard } from './CreatureVitalCard/CreatureVitalCard'
import { ConditionsModal } from './ConditionsModal/ConditionsModal'
import { HpAdjustModal } from './HpAdjustModal/HpAdjustModal'
import type { CampaignMember, CampaignCreature } from '../../types/campaign/campaign'

describe('Componentes Vitais e Combate da Fase 2', () => {
  const mockMember: CampaignMember = {
    userId: 'u1',
    displayName: 'Jogador 1',
    role: 'player',
    joinedAt: 1000,
    characterName: 'Thorin Escudo-de-Carvalho',
    characterClass: 'Guerreiro 3',
    vitals: {
      hpCurrent: 25,
      hpMax: 30,
      hpTemp: 5,
      armorClass: 17,
      passivePerception: 13,
      heroicInspiration: false,
      conditions: ['Caído'],
      deathSaves: { successes: 0, failures: 0 },
    },
  }

  const mockCreature: CampaignCreature = {
    id: 'c1',
    name: 'Goblin 1',
    hpCurrent: 7,
    hpMax: 7,
    hpTemp: 0,
    armorClass: 15,
    passivePerception: 10,
    conditions: [],
    addedAt: 1000,
  }

  describe('HeroVitalCard', () => {
    it('segue o modelo: nome, retrato, CA | PV Temp | PV, ações, condição e testes contra a morte', () => {
      render(
        <HeroVitalCard
          member={mockMember}
          isDm={true}
          currentUserId="u1"
          onUpdateVitals={vi.fn()}
        />,
      )

      expect(screen.getByText('Thorin Escudo-de-Carvalho')).toBeInTheDocument()
      expect(screen.getByText('Jogador 1 · Guerreiro 3')).toBeInTheDocument()
      expect(screen.getByText(/Perc. passiva/).parentElement).toHaveTextContent('13')

      const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling
      expect(stat('CA')).toHaveTextContent('17')
      expect(stat('PV Temp')).toHaveTextContent('5')
      expect(stat('PV')).toHaveTextContent('25/30')

      for (const name of ['Dano', 'Cura', 'Temp']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }
      expect(screen.getByRole('button', { name: /Condição/ })).toBeInTheDocument()
      expect(screen.getByText(/Caído/)).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Testes contra a morte' })).toBeInTheDocument()
    })

    it('marca testes contra a morte com PV acima de zero; quem só olha não marca', () => {
      const onUpdate = vi.fn()
      const { rerender } = render(
        <HeroVitalCard member={mockMember} isDm={true} currentUserId="u1" onUpdateVitals={onUpdate} />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Falha 2' }))
      expect(onUpdate).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ deathSaves: { successes: 0, failures: 2 } }),
      )

      rerender(
        <HeroVitalCard member={mockMember} isDm={false} currentUserId="outro" onUpdateVitals={onUpdate} />,
      )
      expect(screen.getByRole('button', { name: 'Sucesso 1' })).toBeDisabled()
      expect(screen.queryByRole('button', { name: 'Dano' })).not.toBeInTheDocument()
    })

    it('permite alternar Inspiração Heróica', () => {
      const onUpdate = vi.fn()
      render(
        <HeroVitalCard
          member={mockMember}
          isDm={true}
          currentUserId="u1"
          onUpdateVitals={onUpdate}
        />,
      )

      const btn = screen.getByTitle('Conceder Inspiração Heróica')
      fireEvent.click(btn)
      expect(onUpdate).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ heroicInspiration: true }),
      )
    })

    it('abre modal de Dano e aplica', () => {
      const onUpdate = vi.fn()
      render(
        <HeroVitalCard
          member={mockMember}
          isDm={true}
          currentUserId="u1"
          onUpdateVitals={onUpdate}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Dano' }))
      expect(screen.getByText('Ajuste de Pontos de Vida')).toBeInTheDocument()

      const submitBtn = screen.getByRole('button', { name: /Aplicar Dano/i })
      fireEvent.click(submitBtn)

      // 5 temp absorve 1 de dano -> novo temp: 4, pv continua 25
      expect(onUpdate).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ hpCurrent: 25, hpTemp: 4 }),
      )
    })

    it('permite que um jogador autorizado desvincule o herói de outro integrante', () => {
      const onRemoveHero = vi.fn()
      window.confirm = vi.fn(() => true)
      const linkedMember = { ...mockMember, characterSheetId: 'sheet-1' }

      render(
        <MemoryRouter>
          <HeroVitalCard
            member={linkedMember}
            campaignId="camp-1"
            isDm={false}
            canManageHeroes={true}
            currentUserId="helper-1"
            onUpdateVitals={vi.fn()}
            onRemoveHero={onRemoveHero}
          />
        </MemoryRouter>,
      )

      expect(screen.getByTitle('Abrir ficha')).toHaveAttribute(
        'href',
        '/ficha/sheet-1?owner=u1&campaign=camp-1',
      )
      fireEvent.click(screen.getByRole('button', { name: /Desvincular Thorin/i }))
      expect(onRemoveHero).toHaveBeenCalledWith('u1', 'sheet-1')
    })
  })

  describe('CreatureVitalCard', () => {
    it('renderiza criatura e botões de ação', () => {
      const onRemove = vi.fn()
      window.confirm = vi.fn(() => true)

      render(
        <CreatureVitalCard
          creature={mockCreature}
          isDm={true}
          onUpdate={vi.fn()}
          onRemove={onRemove}
        />,
      )

      expect(screen.getByText('Goblin 1')).toBeInTheDocument()
      const stat = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling
      expect(stat('CA')).toHaveTextContent('15')
      expect(stat('PV Temp')).toHaveTextContent('0')
      expect(stat('PV')).toHaveTextContent('7/7')
      for (const name of ['Dano', 'Cura', 'Temp']) {
        expect(screen.getByRole('button', { name })).toBeInTheDocument()
      }

      const removeBtn = screen.getByLabelText('Remover Goblin 1')
      fireEvent.click(removeBtn)
      expect(onRemove).toHaveBeenCalledWith('c1')
    })

    it('abre os modais de PV e de condição fora do card (o backdrop-filter prendia o overlay)', () => {
      render(
        <CreatureVitalCard creature={mockCreature} isDm={true} onUpdate={vi.fn()} onRemove={vi.fn()} />,
      )
      const card = screen.getByRole('article', { name: 'Status de Goblin 1' })

      fireEvent.click(screen.getByRole('button', { name: 'Dano' }))
      const hpDialog = screen.getByText('Ajuste de Pontos de Vida').closest('[role="presentation"]')
      expect(hpDialog?.parentElement).toBe(document.body)
      expect(card).not.toContainElement(hpDialog as HTMLElement)
      fireEvent.keyDown(document, { key: 'Escape' })

      fireEvent.click(screen.getByRole('button', { name: /Condição/ }))
      const condDialog = screen.getByText('Condições de D&D 2024').closest('[role="presentation"]')
      expect(condDialog?.parentElement).toBe(document.body)
    })

    it('segue as regras de monstros e NPCs: sem testes contra a morte nem inspiração; a 0 PV fica abatido', () => {
      const { rerender } = render(
        <CreatureVitalCard creature={mockCreature} isDm={true} onUpdate={vi.fn()} onRemove={vi.fn()} />,
      )
      expect(screen.queryByRole('group', { name: 'Testes contra a morte' })).not.toBeInTheDocument()
      expect(screen.queryByTitle(/Inspiração/)).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()

      rerender(
        <CreatureVitalCard
          creature={{ ...mockCreature, hpCurrent: 0 }}
          isDm={true}
          onUpdate={vi.fn()}
          onRemove={vi.fn()}
        />,
      )
      expect(screen.getByRole('status')).toHaveTextContent('Abatido')
      expect(screen.queryByRole('group', { name: 'Testes contra a morte' })).not.toBeInTheDocument()
    })
  })

  describe('ConditionsModal', () => {
    it('lista as condições e chama onToggleCondition ao clicar', () => {
      const onToggle = vi.fn()
      render(
        <ConditionsModal
          entityName="Thorin"
          activeConditions={['Caído']}
          onToggleCondition={onToggle}
          onClose={vi.fn()}
        />,
      )

      expect(screen.getByText('Condições de D&D 2024')).toBeInTheDocument()
      const cegobtn = screen.getByRole('button', { name: 'Cego' })
      fireEvent.click(cegobtn)
      expect(onToggle).toHaveBeenCalledWith('Cego')
    })
  })

  describe('HpAdjustModal', () => {
    it('calcula preview e permite alternar entre Dano, Cura e Temp', () => {
      const onApply = vi.fn()
      render(
        <HpAdjustModal
          entityName="Thorin"
          currentHp={10}
          maxHp={20}
          tempHp={0}
          initialMode="heal"
          onApply={onApply}
          onClose={vi.fn()}
        />,
      )

      expect(screen.getByText(/Após Cura/i)).toBeInTheDocument()
      const input = screen.getByLabelText('Valor de alteração de PV')
      fireEvent.change(input, { target: { value: '5' } })

      const submit = screen.getByRole('button', { name: /Aplicar Cura/i })
      fireEvent.click(submit)
      expect(onApply).toHaveBeenCalledWith(15, 0)
    })
  })
})
