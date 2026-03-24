import type {
  Attack,
  AttunementItem,
  Character,
  CharacterSheet,
  Resource,
  ResourceOrigin,
} from '../types/system/dnd'
import {
  addUniqueTextEntry,
  getCustomWeaponProficiencies,
  getSelectedWeaponCategories,
  mergeWeaponProficiencies,
} from '../utils/weaponCatalog'
import {
  createDefaultCharacterSheet,
  defaultCharacterSheet,
} from './defaultCharacterSheet'
import { getScopedKey } from './storageKeys'

const CHARACTER_SHEETS_BASE_KEY = 'tomo-do-aventureiro:character-sheets'

export interface StoredCharacterSheet {
  id: string
  data: CharacterSheet
  createdAt: string
  updatedAt: string
}

type CharacterSheetStoreMap = Record<string, StoredCharacterSheet>

type LegacyCharacter = Character & {
  attunements?: string[]
  speciesTraits?: string
  feats?: string
  classFeatures?: string
  backstoryPersonality?: string
}

let inMemoryStore: CharacterSheetStoreMap = {}

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

function createDefaultAttunementItem(name = ''): AttunementItem {
  return {
    name,
    rarity: '',
    requiresAttunement: true,
    description: '',
  }
}

function createDefaultAttack(): Attack {
  return {
    name: '',
    attackBonus: 0,
    attributeKey: 'manual',
    useProficiency: false,
    damage: '',
    damageType: '',
    range: '',
    notes: '',
  }
}

function normalizeAttackAttributeKey(value: unknown): Attack['attributeKey'] {
  if (value === 'str' || value === 'dex' || value === 'con' || value === 'int' || value === 'wis' || value === 'cha' || value === 'manual') {
    return value
  }

  if (value === 'Força') return 'str'
  if (value === 'Destreza') return 'dex'
  if (value === 'Constituição') return 'con'
  if (value === 'Inteligência') return 'int'
  if (value === 'Sabedoria') return 'wis'
  if (value === 'Carisma') return 'cha'

  return 'manual'
}

function normalizeAttack(attack: unknown): Attack {
  const defaultAttack = createDefaultAttack()
  const nextAttack =
    attack && typeof attack === 'object'
      ? (attack as Partial<Attack>)
      : defaultAttack

  return {
    ...defaultAttack,
    ...nextAttack,
    name: typeof nextAttack.name === 'string' ? nextAttack.name : defaultAttack.name,
    attackBonus:
      typeof nextAttack.attackBonus === 'number' && Number.isFinite(nextAttack.attackBonus)
        ? Math.trunc(nextAttack.attackBonus)
        : defaultAttack.attackBonus,
    attributeKey: normalizeAttackAttributeKey(nextAttack.attributeKey),
    useProficiency:
      typeof nextAttack.useProficiency === 'boolean'
        ? nextAttack.useProficiency
        : defaultAttack.useProficiency,
    damage: typeof nextAttack.damage === 'string' ? nextAttack.damage : defaultAttack.damage,
    damageType:
      typeof nextAttack.damageType === 'string'
        ? nextAttack.damageType
        : defaultAttack.damageType,
    range: typeof nextAttack.range === 'string' ? nextAttack.range : defaultAttack.range,
    notes: typeof nextAttack.notes === 'string' ? nextAttack.notes : defaultAttack.notes,
  }
}

function createDefaultResource(): Resource {
  return {
    name: '',
    description: '',
    duration: '',
    range: '',
    action: '',
    current: 0,
    max: 0,
    resetOn: 'long-rest',
    customOrigin: '',
    allowCustomOrigin: false,
  }
}

function isResourceOrigin(value: unknown): value is ResourceOrigin {
  return (
    value === 'class' ||
    value === 'subclass' ||
    value === 'species' ||
    value === 'background' ||
    value === 'feat' ||
    value === 'magic-item' ||
    value === 'homebrew'
  )
}

function normalizeLegacyResourceOrigin(value: unknown): ResourceOrigin | undefined {
  if (isResourceOrigin(value)) {
    return value
  }

  if (value === 'lineage') {
    return 'species'
  }

  return undefined
}

function normalizeLegacyResourceOriginLabel(value: string): string {
  if (value === 'divine') {
    return 'Divino'
  }

  return value
}

function normalizeResource(resource: Resource | undefined): Resource {
  const defaultResource = createDefaultResource()
  const nextResource = resource ?? defaultResource
  const max =
    typeof nextResource.max === 'number' && Number.isFinite(nextResource.max)
      ? Math.max(0, Math.trunc(nextResource.max))
      : defaultResource.max ?? 0
  const current =
    typeof nextResource.current === 'number' && Number.isFinite(nextResource.current)
      ? Math.max(0, Math.trunc(nextResource.current))
      : defaultResource.current ?? 0
  const rawOrigin = nextResource.origin as unknown
  const rawOriginText = typeof rawOrigin === 'string' ? rawOrigin : ''
  const customOrigin =
    typeof nextResource.customOrigin === 'string' ? nextResource.customOrigin : ''
  const normalizedOrigin = normalizeLegacyResourceOrigin(rawOrigin)
  const resolvedCustomOrigin =
    customOrigin.trim().length > 0
      ? customOrigin
      : rawOriginText.trim().length > 0 && !normalizedOrigin
        ? normalizeLegacyResourceOriginLabel(rawOriginText)
        : ''
  let allowCustomOrigin =
    typeof nextResource.allowCustomOrigin === 'boolean'
      ? nextResource.allowCustomOrigin
      : false
  const origin = normalizedOrigin

  if (!allowCustomOrigin && resolvedCustomOrigin.trim().length > 0 && !origin) {
    allowCustomOrigin = true
  }

  return {
    ...defaultResource,
    ...nextResource,
    name: typeof nextResource.name === 'string' ? nextResource.name : '',
    description:
      typeof nextResource.description === 'string' ? nextResource.description : '',
    duration: typeof nextResource.duration === 'string' ? nextResource.duration : '',
    level:
      typeof nextResource.level === 'number' && Number.isFinite(nextResource.level)
        ? Math.max(1, Math.trunc(nextResource.level))
        : undefined,
    range: typeof nextResource.range === 'string' ? nextResource.range : '',
    action: typeof nextResource.action === 'string' ? nextResource.action : '',
    current: Math.min(max, current),
    max,
    resetOn:
      nextResource.resetOn === 'short-rest' ||
      nextResource.resetOn === 'long-rest' ||
      nextResource.resetOn === 'manual' ||
      nextResource.resetOn === 'na'
        ? nextResource.resetOn
        : defaultResource.resetOn,
    origin,
    customOrigin: resolvedCustomOrigin,
    allowCustomOrigin,
  }
}

function isValidAvatarDataUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  if (value === '') return true

  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
}

function normalizeCharacter(character: Character | LegacyCharacter | undefined): Character {
  const defaultCharacter = createDefaultCharacterSheet().character
  const nextCharacter = (character ?? defaultCharacter) as LegacyCharacter
  const {
    attunements,
    speciesTraits: _speciesTraits,
    feats: _feats,
    classFeatures: _classFeatures,
    backstoryPersonality,
    ...characterData
  } = nextCharacter
  const legacyAttunements = Array.isArray(attunements)
    ? attunements.filter(
        (item: unknown): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : []

  const attunementItems = Array.isArray(characterData.attunementItems)
    ? characterData.attunementItems.map((item) => ({
        ...createDefaultAttunementItem(),
        ...item,
        name: typeof item.name === 'string' ? item.name : '',
        rarity: typeof item.rarity === 'string' ? item.rarity : '',
        requiresAttunement: Boolean(item.requiresAttunement),
        description: typeof item.description === 'string' ? item.description : '',
      }))
    : legacyAttunements.map((itemName: string) => createDefaultAttunementItem(itemName))
  const rawWeaponProficiencies = Array.isArray(characterData.weaponProficiencies)
    ? characterData.weaponProficiencies.filter(
        (item): item is string => typeof item === 'string',
      )
    : []
  const normalizedWeaponProficiencies = mergeWeaponProficiencies(
    getSelectedWeaponCategories(rawWeaponProficiencies),
    getCustomWeaponProficiencies(rawWeaponProficiencies),
  )
  const normalizedWeaponMasteries = Array.isArray(characterData.weaponMasteries)
    ? characterData.weaponMasteries.reduce<string[]>((acc, item) => {
        if (typeof item !== 'string') {
          return acc
        }

        return addUniqueTextEntry(acc, item)
      }, [])
    : defaultCharacter.weaponMasteries

  return {
    ...defaultCharacter,
    ...characterData,
    avatar: isValidAvatarDataUrl(characterData.avatar)
      ? (characterData.avatar as string)
      : defaultCharacter.avatar,
    backstory:
      typeof characterData.backstory === 'string'
        ? characterData.backstory
        : typeof backstoryPersonality === 'string'
          ? backstoryPersonality
          : defaultCharacter.backstory,
    armorTraining: {
      ...defaultCharacter.armorTraining,
      ...(characterData.armorTraining ?? {}),
    },
    weaponProficiencies: normalizedWeaponProficiencies,
    weaponMasteries: normalizedWeaponMasteries,
    toolProficiencies: Array.isArray(characterData.toolProficiencies)
      ? characterData.toolProficiencies.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
    languages: Array.isArray(characterData.languages)
      ? characterData.languages.filter((item): item is string => typeof item === 'string')
      : [],
    attunementItems,
    currency: {
      ...defaultCharacter.currency,
      ...(characterData.currency ?? {}),
    },
    deathSaves: {
      ...defaultCharacter.deathSaves,
      ...(characterData.deathSaves ?? {}),
    },
    classes:
      Array.isArray(characterData.classes) && characterData.classes.length > 0
        ? characterData.classes.map((currentClass, index) => ({
            ...defaultCharacter.classes[0],
            ...currentClass,
            id:
              typeof currentClass.id === 'number'
                ? currentClass.id
                : Date.now() + index,
            className:
              typeof currentClass.className === 'string' ? currentClass.className : '',
            subclass:
              typeof currentClass.subclass === 'string' ? currentClass.subclass : '',
            level:
              typeof currentClass.level === 'number' && Number.isFinite(currentClass.level)
                ? currentClass.level
                : 1,
            hitDice:
              typeof currentClass.hitDice === 'string' ? currentClass.hitDice : '',
            notes: typeof currentClass.notes === 'string' ? currentClass.notes : '',
          }))
        : defaultCharacter.classes,
    hpAutoCalc:
      typeof characterData.hpAutoCalc === 'boolean'
        ? characterData.hpAutoCalc
        : defaultCharacter.hpAutoCalc,
    hpBonusEntries: Array.isArray(characterData.hpBonusEntries)
      ? characterData.hpBonusEntries.map((entry) => ({
          value:
            typeof entry.value === 'number' && Number.isFinite(entry.value)
              ? entry.value
              : 0,
          source: typeof entry.source === 'string' ? entry.source : '',
        }))
      : defaultCharacter.hpBonusEntries,
    savingThrows: {
      ...defaultCharacter.savingThrows,
      ...(characterData.savingThrows ?? {}),
    },
    skills: characterData.skills ?? defaultCharacter.skills,
    attributes:
      Array.isArray(characterData.attributes) && characterData.attributes.length > 0
        ? characterData.attributes.map((attribute, index) => ({
            ...(defaultCharacter.attributes[index] ?? defaultCharacter.attributes[0]),
            ...attribute,
          }))
        : defaultCharacter.attributes,
  }
}

function normalizeCharacterSheet<T extends CharacterSheet>(value: T): T {
  const defaultSheet = createDefaultCharacterSheet() as T
  const nextValue = cloneData(value)

  return {
    ...defaultSheet,
    ...nextValue,
    character: normalizeCharacter(nextValue.character),
    resources: Array.isArray(nextValue.resources)
      ? nextValue.resources.map((resource) => normalizeResource(resource))
      : defaultSheet.resources,
    inventory: Array.isArray(nextValue.inventory) ? nextValue.inventory : defaultSheet.inventory,
    spells: Array.isArray(nextValue.spells) ? nextValue.spells : defaultSheet.spells,
    attacks: Array.isArray(nextValue.attacks)
      ? nextValue.attacks.map((attack) => normalizeAttack(attack))
      : defaultSheet.attacks,
    combatNotes:
      typeof nextValue.combatNotes === 'string'
        ? nextValue.combatNotes
        : defaultSheet.combatNotes,
    isEditMode:
      typeof nextValue.isEditMode === 'boolean'
        ? nextValue.isEditMode
        : defaultSheet.isEditMode,
  }
}

function readStore(storageKey: string): CharacterSheetStoreMap {
  const storage = getStorage()

  if (!storage) {
    return cloneData(inMemoryStore)
  }

  const rawValue = storage.getItem(storageKey)

  if (!rawValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(rawValue) as CharacterSheetStoreMap
    const normalizedValue = Object.fromEntries(
      Object.entries(parsedValue).map(([key, entry]) => [
        key,
        {
          ...entry,
          data: normalizeCharacterSheet(entry.data),
        },
      ]),
    ) as CharacterSheetStoreMap

    inMemoryStore = cloneData(normalizedValue)

    if (JSON.stringify(parsedValue) !== JSON.stringify(normalizedValue)) {
      writeStore(normalizedValue, storageKey)
    }

    return normalizedValue
  } catch {
    storage.removeItem(storageKey)
    inMemoryStore = {}
    return {}
  }
}

function writeStore(store: CharacterSheetStoreMap, storageKey: string): void {
  const snapshot = cloneData(store)
  inMemoryStore = snapshot

  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(storageKey, JSON.stringify(snapshot))
}

function createCharacterSheetId(): string {
  return `sheet-${globalThis.crypto.randomUUID()}`
}

function normalizeId(id: string): string {
  const normalizedId = id.trim()

  if (!normalizedId) {
    throw new Error('Character sheet id is required.')
  }

  return normalizedId
}

export interface StoredCharacterSheet {
  id: string
  data: CharacterSheet
  createdAt: string
  updatedAt: string
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: number
}

export function listCharacterSheets(uid: string): StoredCharacterSheet[] {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  return Object.values(readStore(storageKey))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((entry) => cloneData(entry))
}

export function getCharacterSheet(uid: string, id: string): StoredCharacterSheet | null {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const storedCharacterSheet = readStore(storageKey)[normalizeId(id)]

  return storedCharacterSheet ? cloneData(storedCharacterSheet) : null
}

export function createCharacterSheet(
  uid: string,
  initialValue: CharacterSheet = createDefaultCharacterSheet(),
): StoredCharacterSheet {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const store = readStore(storageKey)
  const id = createCharacterSheetId()
  const timestamp = new Date().toISOString()
  const normalizedSheet = normalizeCharacterSheet(initialValue)

  const entry: StoredCharacterSheet = {
    id,
    data: cloneData(normalizedSheet),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  store[id] = entry
  writeStore(store, storageKey)

  return cloneData(entry)
}

export function saveCharacterSheet(
  uid: string,
  id: string,
  characterSheet: CharacterSheet,
): StoredCharacterSheet {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const store = readStore(storageKey)
  const normalizedId = normalizeId(id)
  const currentEntry = store[normalizedId]
  const timestamp = new Date().toISOString()
  const normalizedSheet = normalizeCharacterSheet(characterSheet)

  const nextEntry: StoredCharacterSheet = {
    id: normalizedId,
    data: cloneData(normalizedSheet),
    createdAt: currentEntry?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  store[normalizedId] = nextEntry
  writeStore(store, storageKey)

  return cloneData(nextEntry)
}

export function deleteCharacterSheet(uid: string, id: string): boolean {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const store = readStore(storageKey)
  const normalizedId = normalizeId(id)

  if (!store[normalizedId]) {
    return false
  }

  delete store[normalizedId]
  writeStore(store, storageKey)

  return true
}

export function createAndStoreCharacterSheet(uid: string): StoredCharacterSheet {
  return createCharacterSheet(uid, defaultCharacterSheet)
}

export function exportCharacterSheetAsJSON(uid: string, id: string): string | null {
  const entry = getCharacterSheet(uid, id)

  if (!entry) {
    return null
  }

  return JSON.stringify(entry, null, 2)
}

export function clearCharacterSheetStore(uid: string): void {
  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const storage = getStorage()
  if (storage) storage.removeItem(storageKey)
  inMemoryStore = {}
}

type ImportedCharacterSheetPayload = {
  id: string
  data: CharacterSheet
  createdAt?: string
}

function extractImportedCharacterSheetPayload(
  parsed: unknown,
): ImportedCharacterSheetPayload | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  const entry = parsed as Record<string, unknown>

  if (typeof entry.id === 'string' && entry.data && typeof entry.data === 'object') {
    return {
      id: entry.id,
      data: entry.data as CharacterSheet,
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
    data: nestedEntry.data as CharacterSheet,
    createdAt:
      typeof nestedEntry.createdAt === 'string' ? nestedEntry.createdAt : undefined,
  }
}

function isValidCharacterSheetPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false
  }

  const candidate = data as Record<string, unknown>

  if (typeof candidate.isEditMode !== 'boolean') return false
  if (!candidate.character || typeof candidate.character !== 'object') return false
  if (!Array.isArray(candidate.resources)) return false
  if (!Array.isArray(candidate.inventory)) return false
  if (!Array.isArray(candidate.spells)) return false
  if (!Array.isArray(candidate.attacks)) return false

  const character = candidate.character as Record<string, unknown>

  if (typeof character.name !== 'string') return false
  if (typeof character.race !== 'string') return false
  if (!Array.isArray(character.attributes)) return false
  if (!Array.isArray(character.classes)) return false

  return true
}

export function importCharacterSheetFromJSON(uid: string, json: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: 0 }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    result.errors = 1
    return result
  }

  const payload = extractImportedCharacterSheetPayload(parsed)

  if (!payload) {
    result.errors = 1
    return result
  }

  if (!isValidCharacterSheetPayload(payload.data)) {
    result.errors = 1
    return result
  }

  const storageKey = getScopedKey(CHARACTER_SHEETS_BASE_KEY, uid)
  const store = readStore(storageKey)

  try {
    const normalizedId = normalizeId(payload.id)

    if (store[normalizedId]) {
      result.skipped = 1
      return result
    }

    const timestamp = new Date().toISOString()
    store[normalizedId] = {
      id: normalizedId,
      data: normalizeCharacterSheet(payload.data),
      createdAt: payload.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    result.imported = 1
    writeStore(store, storageKey)
  } catch {
    result.errors = 1
  }

  return result
}
