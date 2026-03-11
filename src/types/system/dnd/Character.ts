// Arquivo: Character.ts
// Descrição: interface principal do personagem
// Tipo: interface

import type { ArmorTraining } from './ArmorTraining'
import type { Attribute, SpellcastingAbility } from './Attribute'
import type { AttunementItem } from './AttunementItem'
import type { Class } from './Class'
import type { Currency } from './Currency'
import type { DeathSaves } from './DeathSaves'
import type { SavingThrows } from './SavingThrows'
import type { Skills } from './Skill'

export interface HpBonusEntry {
  value: number
  source: string
}

export interface Character {
  name: string
  race: string
  background: string
  alignment: string
  size: string
  xp: number
  appearance: string
  backstoryPersonality: string
  speciesTraits: string
  feats: string
  classFeatures: string
  languages: string[]
  armorTraining: ArmorTraining
  weaponProficiencies: string[]
  toolProficiencies: string[]
  attunementItems: AttunementItem[]
  currency: Currency
  deathSaves: DeathSaves
  heroicInspiration: number
  hitDiceSpent: number
  classes: Class[]
  armorClassBase: number
  initiativeBonusExtra: number
  speed: string
  proficiencyOverride: string
  spellcastingAbility: SpellcastingAbility
  hpAutoCalc: boolean
  hpBonusEntries: HpBonusEntry[]
  hpMax: number
  hpCurrent: number
  hpTemp: number
  passivePerceptionBonus: number
  savingThrows: SavingThrows
  skills: Skills
  attributes: Attribute[]
}