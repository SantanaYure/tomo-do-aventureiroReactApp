import type { Spell } from './Spell'
import type { SpellcastingAbility } from './Attribute'
import type { DamagePart } from './DamagePart'
export type { Spell, SpellcastingAbility, DamagePart }

export type CreatureSize =
    | 'Minúsculo'
    | 'Pequeno'
    | 'Médio'
    | 'Grande'
    | 'Enorme'
    | 'Colossal'

export type DamageType =
    | 'Ácido'
    | 'Frio'
    | 'Fogo'
    | 'Elétrico'
    | 'Trovão'
    | 'Veneno'
    | 'Necrótico'
    | 'Radiante'
    | 'Psíquico'
    | 'Força'
    | 'Concussão'
    | 'Perfuração'
    | 'Corte'
    | 'Doenças'

export type ConditionType =
    | 'Cego'
    | 'Surdo'
    | 'Enfeitiçado'
    | 'Amedrontado'
    | 'Agarrado'
    | 'Incapacitado'
    | 'Invisível'
    | 'Paralisado'
    | 'Petrificado'
    | 'Envenenado'
    | 'Caído'
    | 'Restrito'
    | 'Atordoado'
    | 'Inconsciente'

export type AttackType = 'Corpo-a-corpo' | 'Distância' | 'Magia'

export type RechargeType =
    | 'none'
    | 'turn'
    | 'recharge56'
    | 'recharge46'
    | 'short'
    | 'long'
    | 'day'

export type MonsterSystemId = 'dnd-monster' | 'dnd5e-monster'

export interface LimitedUseResource {
    hasLimitedUses: boolean
    maxUses: number
    currentUses: number
    recharge: RechargeType
}

export interface MonsterAction extends LimitedUseResource {
    id: string
    name: string
    description: string
    isAttack: boolean
    isMultiattack: boolean
    attackCount: number
    attackType: AttackType | ''
    attackBonus: string
    damage: string
    damageType: DamageType | ''
    reach: string
    castingTime: string
    damages: DamagePart[]
}

export interface LegendaryAction {
    id: string
    name: string
    cost: number
    description: string
}

export interface MonsterFeature extends LimitedUseResource {
    id: string
    name: string
    description: string
    duration: string
    range: string
    requirements: string
    castingTime: string
    damages: DamagePart[]
}

export interface MonsterMovement {
    id: string
    source: string
    distance: number
}

export type MonsterKind = 'monster' | 'npc'

export interface MonsterSheet {
    systemId: MonsterSystemId

    groupId?: string

    details: {
        name: string
        kind: MonsterKind
        avatar: string
        species: string
        size: CreatureSize | ''
        alignment: string
        creatureClass: string
        description: string
        lore: string
        guide: string
    }

    stats: {
        hpCurrent: number
        maxHp: number
        hpTemp: number
        ac: number
        movements: MonsterMovement[]
        strength: number
        dexterity: number
        constitution: number
        intelligence: number
        wisdom: number
        charisma: number
    }

    traits: {
        savingThrows: string[]
        skills: string[]
        languages: string[]
        resistances: string[]
        immunities: string[]
        conditionImmunities: string[]
        challengeRating: string
        xp: number
    }

    features: MonsterFeature[]
    actions: MonsterAction[]
    reactions: MonsterFeature[]

    legendary: {
        pointsPerRound: number
        pointsUsed: number
        description: string
        actions: LegendaryAction[]
    }

    spells: {
        spellcastingAbility: SpellcastingAbility
        proficiencyBonus: number
        items: Spell[]
        slots: Record<number, { current: number; max: number }>
    }
}

export interface StoredMonsterSheet {
    id: string
    data: MonsterSheet
    createdAt: string
    updatedAt: string
}
