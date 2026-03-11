export const WEAPON_PROFICIENCY_OPTIONS = [
  { key: 'simple', label: 'Simples' },
  { key: 'martial', label: 'Marcial' },
  { key: 'exotic', label: 'Exótica' },
] as const

export type WeaponProficiencyLabel =
  (typeof WEAPON_PROFICIENCY_OPTIONS)[number]['label']

interface WeaponCatalogEntry {
  name: string
  category: WeaponProficiencyLabel
}

const WEAPON_CATALOG: WeaponCatalogEntry[] = [
  { name: 'Adaga', category: 'Simples' },
  { name: 'Azagaia', category: 'Simples' },
  { name: 'Besta Leve', category: 'Simples' },
  { name: 'Bordão', category: 'Simples' },
  { name: 'Clava', category: 'Simples' },
  { name: 'Dardo', category: 'Simples' },
  { name: 'Foice', category: 'Simples' },
  { name: 'Funda', category: 'Simples' },
  { name: 'Lança', category: 'Simples' },
  { name: 'Maça', category: 'Simples' },
  { name: 'Arco Longo', category: 'Marcial' },
  { name: 'Besta de Mão', category: 'Marcial' },
  { name: 'Besta Pesada', category: 'Marcial' },
  { name: 'Chicote', category: 'Marcial' },
  { name: 'Cimitarra', category: 'Marcial' },
  { name: 'Espada Curta', category: 'Marcial' },
  { name: 'Espada Longa', category: 'Marcial' },
  { name: 'Glaive', category: 'Marcial' },
  { name: 'Machado de Batalha', category: 'Marcial' },
  { name: 'Machado Grande', category: 'Marcial' },
  { name: 'Malho', category: 'Marcial' },
  { name: 'Martelo de Guerra', category: 'Marcial' },
  { name: 'Montante', category: 'Marcial' },
  { name: 'Rapieira', category: 'Marcial' },
  { name: 'Katana', category: 'Exótica' },
  { name: 'Lâmina Dupla', category: 'Exótica' },
  { name: 'Mosquete', category: 'Exótica' },
  { name: 'Pistola', category: 'Exótica' },
]

export function normalizeWeaponText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isWeaponCategoryLabel(
  value: string,
): value is WeaponProficiencyLabel {
  const normalizedValue = normalizeWeaponText(value)

  return WEAPON_PROFICIENCY_OPTIONS.some(
    (option) => normalizeWeaponText(option.label) === normalizedValue,
  )
}

function canonicalizeWeaponCategory(value: string): WeaponProficiencyLabel | null {
  const matchedOption = WEAPON_PROFICIENCY_OPTIONS.find(
    (option) => normalizeWeaponText(option.label) === normalizeWeaponText(value),
  )

  return matchedOption?.label ?? null
}

function getUniqueValues(values: string[]): string[] {
  const seen = new Set<string>()

  return values.reduce<string[]>((acc, value) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return acc
    }

    const normalizedValue = normalizeWeaponText(trimmedValue)

    if (seen.has(normalizedValue)) {
      return acc
    }

    seen.add(normalizedValue)
    acc.push(trimmedValue)
    return acc
  }, [])
}

export function getSelectedWeaponCategories(
  weaponProficiencies: string[],
): WeaponProficiencyLabel[] {
  return getUniqueValues(weaponProficiencies)
    .map((value) => canonicalizeWeaponCategory(value))
    .filter((value): value is WeaponProficiencyLabel => value !== null)
}

export function getCustomWeaponProficiencies(
  weaponProficiencies: string[],
): string[] {
  return getUniqueValues(weaponProficiencies).filter(
    (value) => !isWeaponCategoryLabel(value),
  )
}

export function mergeWeaponProficiencies(
  categories: WeaponProficiencyLabel[],
  customValues: string[],
): string[] {
  const canonicalCategories = categories
    .map((value) => canonicalizeWeaponCategory(value))
    .filter((value): value is WeaponProficiencyLabel => value !== null)

  return [
    ...getUniqueValues(canonicalCategories),
    ...getUniqueValues(customValues).filter((value) => !isWeaponCategoryLabel(value)),
  ]
}

export function toggleWeaponCategory(
  weaponProficiencies: string[],
  category: WeaponProficiencyLabel,
  checked: boolean,
): string[] {
  const selectedCategories = getSelectedWeaponCategories(weaponProficiencies)
  const customValues = getCustomWeaponProficiencies(weaponProficiencies)

  const nextCategories = checked
    ? [...selectedCategories, category]
    : selectedCategories.filter((value) => value !== category)

  return mergeWeaponProficiencies(nextCategories, customValues)
}

export function setCustomWeaponProficiencyValues(
  weaponProficiencies: string[],
  customValues: string[],
): string[] {
  return mergeWeaponProficiencies(
    getSelectedWeaponCategories(weaponProficiencies),
    customValues,
  )
}

export function addUniqueTextEntry(values: string[], rawValue: string): string[] {
  return getUniqueValues([...values, rawValue])
}

function findWeaponCatalogEntry(weaponName: string): WeaponCatalogEntry | null {
  const normalizedWeaponName = normalizeWeaponText(weaponName)

  if (!normalizedWeaponName) {
    return null
  }

  return (
    WEAPON_CATALOG.find((entry) => {
      const normalizedEntryName = normalizeWeaponText(entry.name)
      return (
        normalizedWeaponName.includes(normalizedEntryName) ||
        normalizedEntryName.includes(normalizedWeaponName)
      )
    }) ?? null
  )
}

export function findMatchingWeaponProficiency(
  weaponName: string,
  weaponProficiencies: string[],
): string | null {
  const normalizedWeaponName = normalizeWeaponText(weaponName)

  if (!normalizedWeaponName) {
    return null
  }

  const customMatch = getCustomWeaponProficiencies(weaponProficiencies).find((value) => {
    const normalizedValue = normalizeWeaponText(value)
    return (
      normalizedWeaponName.includes(normalizedValue) ||
      normalizedValue.includes(normalizedWeaponName)
    )
  })

  if (customMatch) {
    return customMatch
  }

  const matchedCatalogEntry = findWeaponCatalogEntry(weaponName)
  const selectedCategories = getSelectedWeaponCategories(weaponProficiencies)

  if (
    matchedCatalogEntry &&
    selectedCategories.includes(matchedCatalogEntry.category)
  ) {
    return matchedCatalogEntry.category
  }

  return null
}

export function getSuggestedWeaponMasteries(
  weaponProficiencies: string[],
): string[] {
  const selectedCategories = new Set(getSelectedWeaponCategories(weaponProficiencies))
  const catalogSuggestions = WEAPON_CATALOG.filter((entry) =>
    selectedCategories.has(entry.category),
  ).map((entry) => entry.name)

  return getUniqueValues([
    ...catalogSuggestions,
    ...getCustomWeaponProficiencies(weaponProficiencies),
  ])
}