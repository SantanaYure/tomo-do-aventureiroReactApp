import type {
    AttackType,
    ConditionType,
    CreatureSize,
    DamageType,
    LegendaryAction,
    MonsterAction,
    MonsterFeature,
    MonsterMovement,
    MonsterSheet,
    RechargeType,
    StoredMonsterSheet,
} from '../types/system/dnd/monsterSheet'

export type { StoredMonsterSheet } from '../types/system/dnd/monsterSheet'

export const MONSTER_SHEETS_STORAGE_KEY = 'tomo-monsters'

export interface MonsterImportResult {
    imported: number
    skipped: number
    errors: number
}

type MonsterSheetStoreMap = Record<string, StoredMonsterSheet>

const CREATURE_SIZES: readonly CreatureSize[] = [
    'Minúsculo',
    'Pequeno',
    'Médio',
    'Grande',
    'Enorme',
    'Colossal',
]

const DAMAGE_TYPES: readonly DamageType[] = [
    'Ácido',
    'Concussão',
    'Cortante',
    'Fogo',
    'Frio',
    'Força',
    'Fulgurante',
    'Necrótico',
    'Perfurante',
    'Psíquico',
    'Radiante',
    'Trovão',
    'Veneno',
    'Não-mágico',
]

const CONDITION_TYPES: readonly ConditionType[] = [
    'Amedrontado',
    'Agarrado',
    'Atordoado',
    'Caído',
    'Cego',
    'Enfeitiçado',
    'Envenenado',
    'Exausto',
    'Incapacitado',
    'Invisível',
    'Paralisado',
    'Petrificado',
    'Surdo',
]

const ATTACK_TYPES: readonly AttackType[] = ['Corpo-a-corpo', 'Distância', 'Magia']

const RECHARGE_TYPES: readonly RechargeType[] = [
    'none',
    'turn',
    'recharge56',
    'recharge46',
    'short',
    'long',
    'day',
]

let inMemoryStore: MonsterSheetStoreMap = {}

function cloneData<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function getStorage(): Storage | null {
    try {
        if ('localStorage' in globalThis) {
            return globalThis.localStorage
        }
    } catch {
        return null
    }

    return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
    return typeof value === 'string' && options.includes(value as T)
}

function normalizeString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback
}

function normalizeInteger(value: unknown, fallback: number, minimum = 0): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback
    }

    return Math.max(minimum, Math.trunc(value))
}

function normalizeStringArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === 'string')
        : []
}

function normalizeTypedArray<T extends string>(
    value: unknown,
    options: readonly T[],
): T[] {
    return Array.isArray(value)
        ? value.filter((entry): entry is T => isOneOf(entry, options))
        : []
}

function createDefaultMonsterFeature(id = ''): MonsterFeature {
    return {
        id,
        name: '',
        description: '',
        hasLimitedUses: false,
        maxUses: 1,
        currentUses: 1,
        recharge: 'none',
        duration: '',
        range: '',
        requirements: '',
    }
}

function createDefaultMonsterMovement(
    id = '',
    source = '',
    distance = 0,
): MonsterMovement {
    return {
        id,
        source,
        distance,
    }
}

function createDefaultMonsterAction(id = ''): MonsterAction {
    return {
        id,
        name: '',
        description: '',
        isAttack: false,
        isMultiattack: false,
        attackCount: 1,
        attackType: '',
        attackBonus: '',
        damage: '',
        damageType: '',
        reach: '',
    }
}

function createDefaultLegendaryAction(id = ''): LegendaryAction {
    return {
        id,
        name: '',
        cost: 1,
        description: '',
    }
}

function normalizeNestedId(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function normalizeRechargeType(value: unknown): RechargeType {
    return isOneOf(value, RECHARGE_TYPES) ? value : 'none'
}

function normalizeMonsterFeature(value: unknown, fallbackId: string): MonsterFeature {
    const defaultFeature = createDefaultMonsterFeature(fallbackId)
    const nextValue = isRecord(value) ? value : defaultFeature
    const maxUses = normalizeInteger(nextValue.maxUses, defaultFeature.maxUses, 0)
    const currentUses = normalizeInteger(nextValue.currentUses, defaultFeature.currentUses, 0)

    return {
        ...defaultFeature,
        id: normalizeNestedId(nextValue.id, fallbackId),
        name: normalizeString(nextValue.name),
        description: normalizeString(nextValue.description),
        hasLimitedUses:
            typeof nextValue.hasLimitedUses === 'boolean'
                ? nextValue.hasLimitedUses
                : defaultFeature.hasLimitedUses,
        maxUses,
        currentUses: Math.min(currentUses, maxUses),
        recharge: normalizeRechargeType(nextValue.recharge),
        duration: normalizeString(nextValue.duration),
        range: normalizeString(nextValue.range),
        requirements: normalizeString(nextValue.requirements),
    }
}

function normalizeMonsterMovement(value: unknown, fallbackId: string): MonsterMovement {
    const defaultMovement = createDefaultMonsterMovement(fallbackId)
    const nextValue = isRecord(value) ? value : defaultMovement

    return {
        ...defaultMovement,
        id: normalizeNestedId(nextValue.id, fallbackId),
        source: normalizeString(nextValue.source),
        distance: normalizeInteger(nextValue.distance, defaultMovement.distance),
    }
}

function normalizeMonsterAction(value: unknown, fallbackId: string): MonsterAction {
    const defaultAction = createDefaultMonsterAction(fallbackId)
    const nextValue = isRecord(value) ? value : defaultAction

    return {
        ...defaultAction,
        id: normalizeNestedId(nextValue.id, fallbackId),
        name: normalizeString(nextValue.name),
        description: normalizeString(nextValue.description),
        isAttack: typeof nextValue.isAttack === 'boolean' ? nextValue.isAttack : false,
        isMultiattack:
            typeof nextValue.isMultiattack === 'boolean' ? nextValue.isMultiattack : false,
        attackCount: normalizeInteger(nextValue.attackCount, defaultAction.attackCount, 1),
        attackType: isOneOf(nextValue.attackType, ATTACK_TYPES) ? nextValue.attackType : '',
        attackBonus: normalizeString(nextValue.attackBonus),
        damage: normalizeString(nextValue.damage),
        damageType: isOneOf(nextValue.damageType, DAMAGE_TYPES) ? nextValue.damageType : '',
        reach: normalizeString(nextValue.reach),
    }
}

function normalizeLegendaryAction(value: unknown, fallbackId: string): LegendaryAction {
    const defaultAction = createDefaultLegendaryAction(fallbackId)
    const nextValue = isRecord(value) ? value : defaultAction

    return {
        ...defaultAction,
        id: normalizeNestedId(nextValue.id, fallbackId),
        name: normalizeString(nextValue.name),
        cost: normalizeInteger(nextValue.cost, defaultAction.cost, 1),
        description: normalizeString(nextValue.description),
    }
}

function normalizeMonsterSystemId(value: unknown): MonsterSheet['systemId'] {
    return value === 'dnd-monster' || value === 'dnd5e-monster'
        ? 'dnd5e-monster'
        : 'dnd5e-monster'
}

export function createDefaultMonsterSheet(): MonsterSheet {
    return {
        systemId: 'dnd5e-monster',
        details: {
            name: '',
            species: '',
            size: '',
            alignment: '',
            creatureClass: '',
            description: '',
            lore: '',
        },
        stats: {
            hpCurrent: 10,
            maxHp: 10,
            hpTemp: 0,
            ac: 10,
            movements: [createDefaultMonsterMovement('movement-1', 'Terra', 9)],
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
        },
        traits: {
            skills: [],
            languages: [],
            resistances: [],
            immunities: [],
            conditionImmunities: [],
            challengeRating: '1',
            xp: 200,
        },
        features: [],
        actions: [],
        reactions: [],
        legendary: {
            pointsPerRound: 3,
            pointsUsed: 0,
            description: '',
            actions: [],
        },
    }
}

export function normalizeMonsterSheet(raw: unknown): MonsterSheet {
    const defaultSheet = createDefaultMonsterSheet()
    const nextValue = isRecord(raw) ? raw : defaultSheet
    const details = isRecord(nextValue.details) ? nextValue.details : defaultSheet.details
    const rawStats = isRecord(nextValue.stats) ? nextValue.stats : null
    const stats = rawStats ?? defaultSheet.stats
    const traits = isRecord(nextValue.traits) ? nextValue.traits : defaultSheet.traits
    const legendary = isRecord(nextValue.legendary)
        ? nextValue.legendary
        : defaultSheet.legendary
    const pointsPerRound = normalizeInteger(
        legendary.pointsPerRound,
        defaultSheet.legendary.pointsPerRound,
        0,
    )
    const pointsUsed = normalizeInteger(legendary.pointsUsed, defaultSheet.legendary.pointsUsed, 0)
    const maxHp = normalizeInteger(stats.maxHp, defaultSheet.stats.maxHp)
    const legacyHp = normalizeInteger(stats.hp, defaultSheet.stats.hpCurrent)
    const hpCurrent = normalizeInteger(stats.hpCurrent, legacyHp)
    const defaultMovement = defaultSheet.stats.movements[0] ?? createDefaultMonsterMovement()
    const movements = Array.isArray(stats.movements)
        ? stats.movements.map((movement, index) =>
            normalizeMonsterMovement(movement, `movement-${index + 1}`),
        )
        : [
            createDefaultMonsterMovement(
                'movement-1',
                defaultMovement.source || 'Terra',
                normalizeInteger(rawStats?.speed, defaultMovement.distance),
            ),
        ]

    return {
        systemId: normalizeMonsterSystemId(nextValue.systemId),
        details: {
            name: normalizeString(details.name),
            species: normalizeString(details.species),
            size: isOneOf(details.size, CREATURE_SIZES) ? details.size : '',
            alignment: normalizeString(details.alignment),
            creatureClass: normalizeString(details.creatureClass),
            description: normalizeString(details.description),
            lore: normalizeString(details.lore),
        },
        stats: {
            hpCurrent: Math.min(hpCurrent, maxHp),
            maxHp,
            hpTemp: normalizeInteger(stats.hpTemp, defaultSheet.stats.hpTemp),
            ac: normalizeInteger(stats.ac, defaultSheet.stats.ac),
            movements,
            strength: normalizeInteger(stats.strength, defaultSheet.stats.strength),
            dexterity: normalizeInteger(stats.dexterity, defaultSheet.stats.dexterity),
            constitution: normalizeInteger(
                stats.constitution,
                defaultSheet.stats.constitution,
            ),
            intelligence: normalizeInteger(
                stats.intelligence,
                defaultSheet.stats.intelligence,
            ),
            wisdom: normalizeInteger(stats.wisdom, defaultSheet.stats.wisdom),
            charisma: normalizeInteger(stats.charisma, defaultSheet.stats.charisma),
        },
        traits: {
            skills: normalizeStringArray(traits.skills),
            languages: normalizeStringArray(traits.languages),
            resistances: normalizeTypedArray(traits.resistances, DAMAGE_TYPES),
            immunities: normalizeTypedArray(traits.immunities, DAMAGE_TYPES),
            conditionImmunities: normalizeTypedArray(
                traits.conditionImmunities,
                CONDITION_TYPES,
            ),
            challengeRating: normalizeString(
                traits.challengeRating,
                defaultSheet.traits.challengeRating,
            ),
            xp: normalizeInteger(traits.xp, defaultSheet.traits.xp),
        },
        features: Array.isArray(nextValue.features)
            ? nextValue.features.map((feature, index) =>
                normalizeMonsterFeature(feature, `feature-${index + 1}`),
            )
            : defaultSheet.features,
        actions: Array.isArray(nextValue.actions)
            ? nextValue.actions.map((action, index) =>
                normalizeMonsterAction(action, `action-${index + 1}`),
            )
            : defaultSheet.actions,
        reactions: Array.isArray(nextValue.reactions)
            ? nextValue.reactions.map((reaction, index) =>
                normalizeMonsterFeature(reaction, `reaction-${index + 1}`),
            )
            : defaultSheet.reactions,
        legendary: {
            pointsPerRound,
            pointsUsed: Math.min(pointsUsed, pointsPerRound),
            description: normalizeString(legendary.description),
            actions: Array.isArray(legendary.actions)
                ? legendary.actions.map((action, index) =>
                    normalizeLegendaryAction(action, `legendary-action-${index + 1}`),
                )
                : defaultSheet.legendary.actions,
        },
    }
}

function normalizeStoredMonsterSheet(
    id: string,
    value: unknown,
    timestamp: string,
): StoredMonsterSheet {
    const nextValue = isRecord(value) ? value : {}

    return {
        id: normalizeString(nextValue.id, id),
        data: normalizeMonsterSheet(nextValue.data),
        createdAt: normalizeString(nextValue.createdAt, timestamp),
        updatedAt: normalizeString(nextValue.updatedAt, timestamp),
    }
}

function readStore(): MonsterSheetStoreMap {
    const storage = getStorage()

    if (!storage) {
        return cloneData(inMemoryStore)
    }

    const rawValue = storage.getItem(MONSTER_SHEETS_STORAGE_KEY)

    if (!rawValue) {
        return {}
    }

    try {
        const parsedValue = JSON.parse(rawValue)

        if (!isRecord(parsedValue)) {
            throw new Error('Invalid monster sheet store payload.')
        }

        const timestamp = new Date().toISOString()
        const normalizedValue = Object.fromEntries(
            Object.entries(parsedValue).map(([key, entry]) => [
                key,
                normalizeStoredMonsterSheet(key, entry, timestamp),
            ]),
        ) as MonsterSheetStoreMap

        inMemoryStore = cloneData(normalizedValue)

        if (JSON.stringify(parsedValue) !== JSON.stringify(normalizedValue)) {
            writeStore(normalizedValue)
        }

        return normalizedValue
    } catch {
        storage.removeItem(MONSTER_SHEETS_STORAGE_KEY)
        inMemoryStore = {}
        return {}
    }
}

function writeStore(store: MonsterSheetStoreMap): void {
    const snapshot = cloneData(store)
    inMemoryStore = snapshot

    const storage = getStorage()

    if (!storage) {
        return
    }

    storage.setItem(MONSTER_SHEETS_STORAGE_KEY, JSON.stringify(snapshot))
}

function normalizeId(id: string): string {
    const normalizedId = id.trim()

    if (!normalizedId) {
        throw new Error('Monster sheet id is required.')
    }

    return normalizedId
}

export function listMonsterSheets(): StoredMonsterSheet[] {
    return Object.values(readStore())
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((entry) => cloneData(entry))
}

export function getMonsterSheet(id: string): StoredMonsterSheet | null {
    const storedMonsterSheet = readStore()[normalizeId(id)]

    return storedMonsterSheet ? cloneData(storedMonsterSheet) : null
}

export function saveMonsterSheet(
    id: string,
    data: MonsterSheet,
): StoredMonsterSheet {
    const store = readStore()
    const normalizedId = normalizeId(id)
    const currentEntry = store[normalizedId]
    const timestamp = new Date().toISOString()
    const normalizedSheet = normalizeMonsterSheet(data)

    const nextEntry: StoredMonsterSheet = {
        id: normalizedId,
        data: cloneData(normalizedSheet),
        createdAt: currentEntry?.createdAt ?? timestamp,
        updatedAt: timestamp,
    }

    store[normalizedId] = nextEntry
    writeStore(store)

    return cloneData(nextEntry)
}

export function deleteMonsterSheet(id: string): void {
    const store = readStore()
    const normalizedId = normalizeId(id)

    if (!store[normalizedId]) {
        return
    }

    delete store[normalizedId]
    writeStore(store)
}

type ImportedMonsterSheetPayload = {
    id: string
    data: MonsterSheet
    createdAt?: string
}

function extractImportedMonsterSheetPayload(
    parsed: unknown,
): ImportedMonsterSheetPayload | null {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null
    }

    const entry = parsed as Record<string, unknown>

    if (typeof entry.id === 'string' && entry.data && typeof entry.data === 'object') {
        return {
            id: entry.id,
            data: entry.data as MonsterSheet,
            createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
        }
    }

    const entries = Object.entries(entry)

    if (entries.length !== 1) {
        return null
    }

    const [key, value] = entries[0]

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null
    }

    const nestedEntry = value as Record<string, unknown>

    if (!nestedEntry.data || typeof nestedEntry.data !== 'object') {
        return null
    }

    return {
        id: typeof nestedEntry.id === 'string' ? nestedEntry.id : key,
        data: nestedEntry.data as MonsterSheet,
        createdAt:
            typeof nestedEntry.createdAt === 'string' ? nestedEntry.createdAt : undefined,
    }
}

export function exportMonsterSheetAsJSON(id: string): string | null {
    const entry = getMonsterSheet(id)

    if (!entry) {
        return null
    }

    return JSON.stringify(entry, null, 2)
}

export function importMonsterSheetFromJSON(json: string): MonsterImportResult {
    const result: MonsterImportResult = { imported: 0, skipped: 0, errors: 0 }

    let parsed: unknown
    try {
        parsed = JSON.parse(json)
    } catch {
        result.errors = 1
        return result
    }

    const payload = extractImportedMonsterSheetPayload(parsed)

    if (!payload) {
        result.errors = 1
        return result
    }

    const store = readStore()

    try {
        const normalizedId = normalizeId(payload.id)

        if (store[normalizedId]) {
            result.skipped = 1
            return result
        }

        const timestamp = new Date().toISOString()
        store[normalizedId] = {
            id: normalizedId,
            data: normalizeMonsterSheet(payload.data),
            createdAt: payload.createdAt ?? timestamp,
            updatedAt: timestamp,
        }

        result.imported = 1
        writeStore(store)
    } catch {
        result.errors = 1
    }

    return result
}