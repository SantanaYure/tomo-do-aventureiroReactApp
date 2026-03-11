import type { CharacterSheet, Skills } from '../types/system/dnd'

function createDefaultSkills(): Skills {
  return {
    athletics: { proficiency: 0, misc: 0 },
    acrobatics: { proficiency: 0, misc: 0 },
    sleightOfHand: { proficiency: 0, misc: 0 },
    stealth: { proficiency: 0, misc: 0 },
    arcana: { proficiency: 0, misc: 0 },
    history: { proficiency: 0, misc: 0 },
    investigation: { proficiency: 0, misc: 0 },
    nature: { proficiency: 0, misc: 0 },
    religion: { proficiency: 0, misc: 0 },
    animalHandling: { proficiency: 0, misc: 0 },
    insight: { proficiency: 0, misc: 0 },
    medicine: { proficiency: 0, misc: 0 },
    perception: { proficiency: 0, misc: 0 },
    survival: { proficiency: 0, misc: 0 },
    deception: { proficiency: 0, misc: 0 },
    intimidation: { proficiency: 0, misc: 0 },
    performance: { proficiency: 0, misc: 0 },
    persuasion: { proficiency: 0, misc: 0 },
  }
}

export function createDefaultCharacterSheet(): CharacterSheet {
  return {
    character: {
      name: '',
      race: '',
      background: '',
      alignment: '',
      size: 'Médio',
      xp: 0,
      appearance: '',
      backstoryPersonality: '',
      speciesTraits: '',
      feats: '',
      classFeatures: '',
      languages: [],
      armorTraining: {
        light: false,
        medium: false,
        heavy: false,
        shields: false,
      },
      weaponProficiencies: [],
      toolProficiencies: [],
      attunements: ['', '', ''],
      currency: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0,
      },
      deathSaves: {
        success: 0,
        failure: 0,
      },
      heroicInspiration: 0,
      hitDiceSpent: 0,
      classes: [
        {
          id: 1,
          className: '',
          subclass: '',
          level: 1,
          hitDice: '1d8',
          notes: '',
        },
      ],
      armorClassBase: 10,
      initiativeBonusExtra: 0,
      speed: '9m',
      proficiencyOverride: '',
      spellcastingAbility: 'Inteligência',
      hpMax: 0,
      hpCurrent: 0,
      hpTemp: 0,
      passivePerceptionBonus: 0,
      savingThrows: {
        str: 0,
        dex: 0,
        con: 0,
        int: 0,
        wis: 0,
        cha: 0,
      },
      skills: createDefaultSkills(),
      attributes: [
        { name: 'Força', value: 10 },
        { name: 'Destreza', value: 10 },
        { name: 'Constituição', value: 10 },
        { name: 'Inteligência', value: 10 },
        { name: 'Sabedoria', value: 10 },
        { name: 'Carisma', value: 10 },
      ],
    },
    resources: [],
    inventory: [],
    spells: [],
    attacks: [],
    combatNotes: '',
    isEditMode: true,
  }
}

export const defaultCharacterSheet = createDefaultCharacterSheet()