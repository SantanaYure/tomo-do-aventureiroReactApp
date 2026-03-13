export type CreatureSize =
    | 'Minúsculo'
    | 'Pequeno'
    | 'Médio'
    | 'Grande'
    | 'Enorme'
    | 'Colossal'

export type DamageType =
    | 'Ácido'
    | 'Concussão'
    | 'Cortante'
    | 'Fogo'
    | 'Frio'
    | 'Força'
    | 'Fulgurante'
    | 'Necrótico'
    | 'Perfurante'
    | 'Psíquico'
    | 'Radiante'
    | 'Trovão'
    | 'Veneno'
    | 'Não-mágico'

export type ConditionType =
    | 'Amedrontado'
    | 'Agarrado'
    | 'Atordoado'
    | 'Caído'
    | 'Cego'
    | 'Enfeitiçado'
    | 'Envenenado'
    | 'Exausto'
    | 'Incapacitado'
    | 'Invisível'
    | 'Paralisado'
    | 'Petrificado'
    | 'Surdo'

export type AttackType = 'Corpo-a-corpo' | 'Distância' | 'Magia'

export type MonsterSystemId = 'dnd-monster' | 'dnd5e-monster'

export interface MonsterAction {
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
}

export interface LegendaryAction {
    id: string
    name: string
    cost: number
    description: string
}

export interface MonsterFeature {
    id: string
    name: string
    description: string
}

export interface MonsterSheet {
    systemId: MonsterSystemId

    details: {
        name: string
        species: string
        size: CreatureSize | ''
        alignment: string
        creatureClass: string
        description: string
        lore: string
    }

    stats: {
        hp: number
        maxHp: number
        ac: number
        speed: number
        strength: number
        dexterity: number
        constitution: number
        intelligence: number
        wisdom: number
        charisma: number
    }

    traits: {
        skills: string[]
        languages: string[]
        resistances: DamageType[]
        immunities: DamageType[]
        conditionImmunities: ConditionType[]
        challengeRating: string
        xp: number
    }

    features: MonsterFeature[]
    actions: MonsterAction[]
    reactions: MonsterFeature[]

    legendary: {
        pointsPerRound: number
        description: string
        actions: LegendaryAction[]
    }
}

export interface StoredMonsterSheet {
    id: string
    data: MonsterSheet
    createdAt: string
    updatedAt: string
}