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

export const CHARACTER_SHEETS_STORAGE_KEY = 'tomo-do-aventureiro:character-sheets'

export interface StoredCharacterSheet {
  id: string
  data: CharacterSheet
  createdAt: string
  updatedAt: string
}

type CharacterSheetStoreMap = Record<string, StoredCharacterSheet>

type LegacyCharacter = Character & {
  attunements?: string[]
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
      nextResource.resetOn === 'manual'
        ? nextResource.resetOn
        : defaultResource.resetOn,
    origin,
    customOrigin: resolvedCustomOrigin,
    allowCustomOrigin,
  }
}

function normalizeCharacter(character: Character | LegacyCharacter | undefined): Character {
  const defaultCharacter = createDefaultCharacterSheet().character
  const nextCharacter = (character ?? defaultCharacter) as Character & {
    attunements?: string[]
  }
  const legacyAttunements = Array.isArray(nextCharacter.attunements)
    ? nextCharacter.attunements.filter(
        (item: unknown): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : []

  const attunementItems = Array.isArray(nextCharacter.attunementItems)
    ? nextCharacter.attunementItems.map((item) => ({
        ...createDefaultAttunementItem(),
        ...item,
        name: typeof item.name === 'string' ? item.name : '',
        rarity: typeof item.rarity === 'string' ? item.rarity : '',
        requiresAttunement: Boolean(item.requiresAttunement),
        description: typeof item.description === 'string' ? item.description : '',
      }))
    : legacyAttunements.map((itemName: string) => createDefaultAttunementItem(itemName))
  const rawWeaponProficiencies = Array.isArray(nextCharacter.weaponProficiencies)
    ? nextCharacter.weaponProficiencies.filter(
        (item): item is string => typeof item === 'string',
      )
    : []
  const normalizedWeaponProficiencies = mergeWeaponProficiencies(
    getSelectedWeaponCategories(rawWeaponProficiencies),
    getCustomWeaponProficiencies(rawWeaponProficiencies),
  )
  const normalizedWeaponMasteries = Array.isArray(nextCharacter.weaponMasteries)
    ? nextCharacter.weaponMasteries.reduce<string[]>((acc, item) => {
        if (typeof item !== 'string') {
          return acc
        }

        return addUniqueTextEntry(acc, item)
      }, [])
    : defaultCharacter.weaponMasteries

  return {
    ...defaultCharacter,
    ...nextCharacter,
    armorTraining: {
      ...defaultCharacter.armorTraining,
      ...(nextCharacter.armorTraining ?? {}),
    },
    weaponProficiencies: normalizedWeaponProficiencies,
    weaponMasteries: normalizedWeaponMasteries,
    toolProficiencies: Array.isArray(nextCharacter.toolProficiencies)
      ? nextCharacter.toolProficiencies.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
    languages: Array.isArray(nextCharacter.languages)
      ? nextCharacter.languages.filter((item): item is string => typeof item === 'string')
      : [],
    attunementItems,
    currency: {
      ...defaultCharacter.currency,
      ...(nextCharacter.currency ?? {}),
    },
    deathSaves: {
      ...defaultCharacter.deathSaves,
      ...(nextCharacter.deathSaves ?? {}),
    },
    classes:
      Array.isArray(nextCharacter.classes) && nextCharacter.classes.length > 0
        ? nextCharacter.classes.map((currentClass, index) => ({
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
      typeof nextCharacter.hpAutoCalc === 'boolean'
        ? nextCharacter.hpAutoCalc
        : defaultCharacter.hpAutoCalc,
    hpBonusEntries: Array.isArray(nextCharacter.hpBonusEntries)
      ? nextCharacter.hpBonusEntries.map((entry) => ({
          value:
            typeof entry.value === 'number' && Number.isFinite(entry.value)
              ? entry.value
              : 0,
          source: typeof entry.source === 'string' ? entry.source : '',
        }))
      : defaultCharacter.hpBonusEntries,
    savingThrows: {
      ...defaultCharacter.savingThrows,
      ...(nextCharacter.savingThrows ?? {}),
    },
    skills: nextCharacter.skills ?? defaultCharacter.skills,
    attributes:
      Array.isArray(nextCharacter.attributes) && nextCharacter.attributes.length > 0
        ? nextCharacter.attributes.map((attribute, index) => ({
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

function readStore(): CharacterSheetStoreMap {
  const storage = getStorage()

  if (!storage) {
    return cloneData(inMemoryStore)
  }

  const rawValue = storage.getItem(CHARACTER_SHEETS_STORAGE_KEY)

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
      writeStore(normalizedValue)
    }

    return normalizedValue
  } catch {
    storage.removeItem(CHARACTER_SHEETS_STORAGE_KEY)
    inMemoryStore = {}
    return {}
  }
}

function writeStore(store: CharacterSheetStoreMap): void {
  const snapshot = cloneData(store)
  inMemoryStore = snapshot

  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(CHARACTER_SHEETS_STORAGE_KEY, JSON.stringify(snapshot))
}

function createCharacterSheetId(): string {
  return `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeId(id: string): string {
  const normalizedId = id.trim()

  if (!normalizedId) {
    throw new Error('Character sheet id is required.')
  }

  return normalizedId
}

export function listCharacterSheets(): StoredCharacterSheet[] {
  return Object.values(readStore())
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((entry) => cloneData(entry))
}

export function getCharacterSheet(id: string): StoredCharacterSheet | null {
  const storedCharacterSheet = readStore()[normalizeId(id)]

  return storedCharacterSheet ? cloneData(storedCharacterSheet) : null
}

export function createCharacterSheet(
  initialValue: CharacterSheet = createDefaultCharacterSheet(),
): StoredCharacterSheet {
  const store = readStore()
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
  writeStore(store)

  return cloneData(entry)
}

export function saveCharacterSheet(
  id: string,
  characterSheet: CharacterSheet,
): StoredCharacterSheet {
  const store = readStore()
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
  writeStore(store)

  return cloneData(nextEntry)
}

export function deleteCharacterSheet(id: string): boolean {
  const store = readStore()
  const normalizedId = normalizeId(id)

  if (!store[normalizedId]) {
    return false
  }

  delete store[normalizedId]
  writeStore(store)

  return true
}

export function createAndStoreCharacterSheet(): StoredCharacterSheet {
  return createCharacterSheet(defaultCharacterSheet)
}