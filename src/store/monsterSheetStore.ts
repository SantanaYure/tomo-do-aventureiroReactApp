import {
    collection,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    addDoc,
} from 'firebase/firestore'
import type {
    AttackType,
    CreatureSize,
    DamageType,
    LegendaryAction,
    MonsterAction,
    MonsterFeature,
    MonsterKind,
    MonsterSheet,
    RechargeType,
    Spell,
    SpellcastingAbility,
    StoredMonsterSheet,
} from '../types/system/dnd/monsterSheet'
import { db } from '../services/firebase'

export type { StoredMonsterSheet } from '../types/system/dnd/monsterSheet'

export interface MonsterImportResult {
    imported: number
    skipped: number
    errors: number
}

// ── Firestore helpers ────────────────────────────────────────────────────────

function getCollectionRef(uid: string) {
    return collection(db, 'users', uid, 'monsterSheets')
}

function getDocRef(uid: string, id: string) {
    return doc(db, 'users', uid, 'monsterSheets', id)
}

// ── Normalization ────────────────────────────────────────────────────────────

const MONSTER_KINDS: readonly MonsterKind[] = ['monster', 'npc']

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
    'Frio',
    'Fogo',
    'Elétrico',
    'Trovão',
    'Veneno',
    'Necrótico',
    'Radiante',
    'Psíquico',
    'Força',
    'Concussão',
    'Perfuração',
    'Corte',
    'Doenças',
]

const SPELLCASTING_ABILITIES: readonly SpellcastingAbility[] = [
    '',
    'Força',
    'Destreza',
    'Constituição',
    'Inteligência',
    'Sabedoria',
    'Carisma',
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
) {
    return { id, source, distance }
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

function normalizeMonsterMovement(value: unknown, fallbackId: string) {
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

function normalizeSpell(value: unknown): Spell {
    if (!isRecord(value)) return { name: '', level: 0, school: '', castingTime: '', range: '', duration: '', components: [], prepared: false, description: '' }
    return {
        name: normalizeString(value.name),
        level: typeof value.level === 'number' ? Math.max(0, Math.min(9, Math.trunc(value.level))) : 0,
        school: normalizeString(value.school),
        castingTime: normalizeString(value.castingTime),
        range: normalizeString(value.range),
        duration: normalizeString(value.duration),
        components: Array.isArray(value.components) ? value.components.filter((c): c is string => typeof c === 'string') : [],
        concentration: typeof value.concentration === 'boolean' ? value.concentration : false,
        prepared: typeof value.prepared === 'boolean' ? value.prepared : false,
        description: normalizeString(value.description),
    }
}

function normalizeSlotsRecord(value: unknown): Record<number, { current: number; max: number }> {
    if (!isRecord(value)) return {}
    const result: Record<number, { current: number; max: number }> = {}
    for (let level = 1; level <= 9; level++) {
        const entry = value[level]
        if (!isRecord(entry)) continue
        const max = normalizeInteger(entry.max, 0)
        const current = Math.min(normalizeInteger(entry.current, 0), max)
        result[level] = { current, max }
    }
    return result
}

function normalizeMonsterSystemId(value: unknown): MonsterSheet['systemId'] {
    return value === 'dnd-monster' || value === 'dnd5e-monster'
        ? 'dnd5e-monster'
        : 'dnd5e-monster'
}

function isValidAvatarDataUrl(value: unknown): boolean {
    if (typeof value !== 'string') return false
    if (value === '') return true

    return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
}

export function createDefaultMonsterSheet(): MonsterSheet {
    return {
        systemId: 'dnd5e-monster',
        details: {
            name: '',
            kind: 'monster',
            avatar: '',
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
            savingThrows: [],
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
        spells: {
            spellcastingAbility: '',
            proficiencyBonus: 2,
            items: [],
            slots: {},
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
            kind: isOneOf(details.kind, MONSTER_KINDS) ? details.kind : 'monster',
            avatar: isValidAvatarDataUrl(details.avatar) ? (details.avatar as string) : '',
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
            savingThrows: normalizeStringArray(traits.savingThrows),
            skills: normalizeStringArray(traits.skills),
            languages: normalizeStringArray(traits.languages),
            resistances: normalizeStringArray(traits.resistances),
            immunities: normalizeStringArray(traits.immunities),
            conditionImmunities: normalizeStringArray(traits.conditionImmunities),
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
        spells: (() => {
            const rawSpells = isRecord(nextValue.spells) ? nextValue.spells : defaultSheet.spells
            const ability = rawSpells.spellcastingAbility
            return {
                spellcastingAbility: isOneOf(ability, SPELLCASTING_ABILITIES) ? ability : '',
                proficiencyBonus: normalizeInteger(rawSpells.proficiencyBonus, defaultSheet.spells.proficiencyBonus, 1),
                items: Array.isArray(rawSpells.items) ? rawSpells.items.map(normalizeSpell) : [],
                slots: normalizeSlotsRecord(rawSpells.slots),
            }
        })(),
    }
}

// ── ID helpers ───────────────────────────────────────────────────────────────

function normalizeId(id: string): string {
    const normalizedId = id.trim()
    if (!normalizedId) throw new Error('Monster sheet id is required.')
    return normalizedId
}

// ── Import validation ─────────────────────────────────────────────────────────

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

function isValidMonsterSheetPayload(data: unknown): boolean {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return false
    }

    const candidate = data as Record<string, unknown>

    if (!candidate.details || typeof candidate.details !== 'object') return false
    if (!candidate.stats || typeof candidate.stats !== 'object') return false
    if (!candidate.traits || typeof candidate.traits !== 'object') return false
    if (!Array.isArray(candidate.features)) return false
    if (!Array.isArray(candidate.actions)) return false

    const details = candidate.details as Record<string, unknown>
    if (typeof details.name !== 'string') return false
    if (details.kind !== 'monster' && details.kind !== 'npc') return false

    const stats = candidate.stats as Record<string, unknown>
    if (typeof stats.maxHp !== 'number') return false
    if (typeof stats.ac !== 'number') return false

    return true
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createMonsterSheet(uid: string): Promise<StoredMonsterSheet> {
    const data = normalizeMonsterSheet(createDefaultMonsterSheet())
    const timestamp = new Date().toISOString()
    const payload = {
        data,
        createdAt: timestamp,
        updatedAt: timestamp,
    }
    const ref = await addDoc(getCollectionRef(uid), payload)
    return { id: ref.id, ...payload }
}

export async function saveMonsterSheet(
    uid: string,
    id: string,
    data: MonsterSheet,
): Promise<void> {
    const normalizedId = normalizeId(id)
    const docRef = getDocRef(uid, normalizedId)
    const existing = await getDoc(docRef)
    const createdAt =
        existing.exists()
            ? (existing.data().createdAt as string | undefined) ?? new Date().toISOString()
            : new Date().toISOString()

    await setDoc(docRef, {
        id: normalizedId,
        data: normalizeMonsterSheet(data),
        createdAt,
        updatedAt: new Date().toISOString(),
    })
}

export async function deleteMonsterSheet(uid: string, id: string): Promise<void> {
    await deleteDoc(getDocRef(uid, normalizeId(id)))
}

export function exportMonsterSheetAsJSON(monster: StoredMonsterSheet): string {
    return JSON.stringify(monster, null, 2)
}

export async function importMonsterSheetFromJSON(
    uid: string,
    json: string,
): Promise<MonsterImportResult> {
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

    if (!isValidMonsterSheetPayload(payload.data)) {
        result.errors = 1
        return result
    }

    try {
        const normalizedId = normalizeId(payload.id)
        const docRef = getDocRef(uid, normalizedId)
        const existing = await getDoc(docRef)

        if (existing.exists()) {
            result.skipped = 1
            return result
        }

        const timestamp = new Date().toISOString()
        await setDoc(docRef, {
            id: normalizedId,
            data: normalizeMonsterSheet(payload.data),
            createdAt: payload.createdAt ?? timestamp,
            updatedAt: timestamp,
        })

        result.imported = 1
    } catch {
        result.errors = 1
    }

    return result
}
