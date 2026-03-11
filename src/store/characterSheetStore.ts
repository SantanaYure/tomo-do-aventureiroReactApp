import type { CharacterSheet } from '../types/system/dnd'
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
    inMemoryStore = cloneData(parsedValue)
    return parsedValue
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

  const entry: StoredCharacterSheet = {
    id,
    data: cloneData(initialValue),
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

  const nextEntry: StoredCharacterSheet = {
    id: normalizedId,
    data: cloneData(characterSheet),
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