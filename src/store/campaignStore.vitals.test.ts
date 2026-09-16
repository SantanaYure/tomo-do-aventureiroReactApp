import { describe, it, expect } from 'vitest'
import {
  applyHpChange,
  extractVitalsFromCharacterSheet,
  extractVitalsFromMonsterSheet,
  normalizeCampaign,
  normalizeCampaignMember,
} from './campaignStore'
import type { CharacterSheet } from '../types/system/dnd/CharacterSheet'
import type { MonsterSheet } from '../types/system/dnd/monsterSheet'

describe('campaignStore — Vitais e Criaturas (Fase 2)', () => {
  describe('applyHpChange', () => {
    it('dano reduz primeiro o PV Temporário', () => {
      // 20 PV, 30 Max, 5 Temp. Dano de 3. Novo Temp: 2, PV permanece 20.
      const res = applyHpChange(20, 30, 5, 3, 'damage')
      expect(res.hpCurrent).toBe(20)
      expect(res.hpTemp).toBe(2)
    })

    it('dano maior que PV Temp consome o excesso no PV Atual', () => {
      // 20 PV, 30 Max, 5 Temp. Dano de 8. Novo Temp: 0, PV cai para 17.
      const res = applyHpChange(20, 30, 5, 8, 'damage')
      expect(res.hpCurrent).toBe(17)
      expect(res.hpTemp).toBe(0)
    })

    it('dano não reduz o PV abaixo de zero', () => {
      const res = applyHpChange(5, 30, 0, 100, 'damage')
      expect(res.hpCurrent).toBe(0)
      expect(res.hpTemp).toBe(0)
    })

    it('cura recupera PV até o limite do PV Máximo', () => {
      const res = applyHpChange(15, 20, 0, 10, 'heal')
      expect(res.hpCurrent).toBe(20)
      expect(res.hpTemp).toBe(0)
    })

    it('PV Temporário adota o maior valor (não acumula)', () => {
      const res1 = applyHpChange(20, 30, 5, 10, 'temp')
      expect(res1.hpTemp).toBe(10)

      const res2 = applyHpChange(20, 30, 10, 4, 'temp')
      expect(res2.hpTemp).toBe(10)
    })
  })

  describe('extractVitalsFromCharacterSheet', () => {
    it('extrai os dados essenciais da ficha de personagem D&D', () => {
      const mockSheet = {
        character: {
          name: 'Thorin',
          hpCurrent: 24,
          hpMax: 28,
          hpTemp: 4,
          armorClassBase: 16,
          heroicInspiration: 1,
          attributes: [{ name: 'Sabedoria', value: 14 }],
          skills: { perception: { proficiency: 1, misc: 0 } },
          proficiencyOverride: '2',
          deathSaves: { success: 1, failure: 0 },
        },
        spellSlots: {
          level1: { current: 3, max: 4 },
        },
      } as unknown as CharacterSheet

      const vitals = extractVitalsFromCharacterSheet(mockSheet)
      expect(vitals.hpCurrent).toBe(24)
      expect(vitals.hpMax).toBe(28)
      expect(vitals.hpTemp).toBe(4)
      expect(vitals.armorClass).toBe(16)
      expect(vitals.heroicInspiration).toBe(true)
      expect(vitals.passivePerception).toBe(14) // 10 + 2 (wis) + 2 (prof)
      expect(vitals.deathSaves?.successes).toBe(1)
      expect(vitals.spellSlots?.level1?.current).toBe(3)
    })
  })

  describe('extractVitalsFromMonsterSheet', () => {
    it('extrai os dados da ficha de monstro para instanciar na sessão', () => {
      const mockMonster = {
        details: {
          name: 'Goblin Líder',
          avatar: 'https://example.com/avatar.png',
        },
        stats: {
          maxHp: 21,
          hpCurrent: 21,
          hpTemp: 0,
          ac: 15,
          wisdom: 12,
        },
      } as unknown as MonsterSheet

      const creature = extractVitalsFromMonsterSheet(mockMonster, 'monster-123')
      expect(creature.name).toBe('Goblin Líder')
      expect(creature.monsterSheetId).toBe('monster-123')
      expect(creature.avatar).toBe('https://example.com/avatar.png')
      expect(creature.hpMax).toBe(21)
      expect(creature.hpCurrent).toBe(21)
      expect(creature.armorClass).toBe(15)
      expect(creature.passivePerception).toBe(11) // 10 + 1
    })
  })

  describe('normalização', () => {
    it('normalizeCampaign preserva o array de criaturas', () => {
      const camp = normalizeCampaign('camp-1', {
        name: 'Mesa de Teste',
        creatures: [
          {
            id: 'c1',
            name: 'Lobo',
            hpCurrent: 11,
            hpMax: 11,
            armorClass: 13,
          },
        ],
      })
      expect(camp.creatures).toHaveLength(1)
      expect(camp.creatures![0].name).toBe('Lobo')
      expect(camp.creatures![0].hpCurrent).toBe(11)
      expect(camp.creatures![0].armorClass).toBe(13)
    })

    it('normalizeCampaignMember preserva os vitais', () => {
      const member = normalizeCampaignMember('user-1', {
        displayName: 'Guerreiro',
        vitals: {
          hpCurrent: 35,
          hpMax: 40,
          armorClass: 18,
          conditions: ['Envenenado'],
        },
      })
      expect(member.vitals).not.toBeNull()
      expect(member.vitals?.hpCurrent).toBe(35)
      expect(member.vitals?.hpMax).toBe(40)
      expect(member.vitals?.armorClass).toBe(18)
      expect(member.vitals?.conditions).toContain('Envenenado')
    })
  })
})
