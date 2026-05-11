import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { normalizeFileName, downloadJsonFile } from '../../utils/exportSheet'
import {
  createCharacterSheet,
  deleteCharacterSheet,
  exportCharacterSheetAsJSON,
  importCharacterSheetFromJSON,
  type StoredCharacterSheet,
  type ImportResult as CharacterImportResult,
} from '../../store/characterSheetStore'
import {
  createMonsterSheet,
  deleteMonsterSheet as deleteMonster,
  exportMonsterSheetAsJSON,
  importMonsterSheetFromJSON,
  type MonsterImportResult,
  type StoredMonsterSheet,
} from '../../store/monsterSheetStore'
import { useAuth } from '../../context/AuthContext'
import { useCharacterSheets } from '../../hooks/useCharacterSheets'
import { useMonsterSheets } from '../../hooks/useMonsterSheets'
import { useFirestoreSearch } from '../../hooks/useFirestoreSearch'
import styles from './CharactersPage.module.css'

type ImportFeedback = {
  scope: 'character' | 'monster' | 'npc' | 'unknown'
  result: CharacterImportResult | MonsterImportResult
}

type PendingDelete = {
  type: 'character' | 'monster'
  id: string
  name: string
}

type SheetFilterType = 'all' | 'character' | 'monster' | 'npc'
type FilterFieldKey = 'type' | 'level' | 'class' | 'race' | 'nd'

type SortOrder = 'recent' | 'alpha' | 'class' | 'level-asc' | 'level-desc' | 'race' | 'custom'

type MonsterSortOrder = 'recent' | 'alpha' | 'nd-asc' | 'nd-desc' | 'custom'

const MAX_JSON_BYTES = 2 * 1024 * 1024

function SheetSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className={styles.sheetList} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonContent}>
            <div className={`${styles.skeletonLine} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
          </div>
          <div className={styles.skeletonActions}>
            <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
          </div>
        </li>
      ))}
    </ul>
  )
}

interface SheetSectionProps<T> {
  title: string
  items: T[]
  loading: boolean
  skeletonCount?: number
  renderItem: (item: T) => React.ReactNode
  emptyMessage: string
}

function SheetSection<T>({
  title,
  items,
  loading,
  skeletonCount = 3,
  renderItem,
  emptyMessage,
}: SheetSectionProps<T>) {
  return (
    <section className={styles.collectionSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {loading ? (
        <SheetSkeleton count={skeletonCount} />
      ) : items.length > 0 ? (
        <ul className={styles.sheetList}>{items.map(renderItem)}</ul>
      ) : (
        <p className={styles.emptySection}>{emptyMessage}</p>
      )}
    </section>
  )
}

interface CharacterSheetItemProps {
  sheet: StoredCharacterSheet
  onExport: () => void
  onDelete: () => void
  isDraggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  onDragEnd?: () => void
}

function CharacterSheetItem({
  sheet,
  onExport,
  onDelete,
  isDraggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CharacterSheetItemProps) {
  const name = sheet.data.character.name || '(sem nome)'
  const race = sheet.data.character.race
  const totalLevel = sheet.data.character.classes.reduce((sum, c) => sum + c.level, 0)
  const classNames = sheet.data.character.classes
    .filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' · ')
  const meta = [race, classNames].filter(Boolean).join(' · ') || (totalLevel > 0 ? `Nível ${totalLevel}` : null)

  const liClasses = [
    styles.sheetItem,
    isDragging ? styles.sheetItemDragging : '',
    isDragOver ? styles.sheetItemDragOver : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={liClasses}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {isDraggable && (
        <span className={styles.dragHandle} aria-hidden="true">
          ⠿
        </span>
      )}
      <div className={styles.sheetInfo}>
        <Link to={`/ficha/${sheet.id}`} className={styles.sheetLink}>
          {name}
        </Link>
        {meta && <span className={styles.sheetMeta}>{meta}</span>}
      </div>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.exportButton} onClick={onExport}>
          ↓ Exportar
        </button>
        <button type="button" className={styles.deleteButton} onClick={onDelete}>
          Excluir
        </button>
      </div>
    </li>
  )
}

interface MonsterSheetItemProps {
  sheet: StoredMonsterSheet
  onExport: () => void
  onDelete: () => void
  isDraggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: () => void
  onDragEnd?: () => void
}

function MonsterSheetItem({
  sheet,
  onExport,
  onDelete,
  isDraggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: MonsterSheetItemProps) {
  const name = sheet.data.details.name || '(sem nome)'

  const liClasses = [
    styles.sheetItem,
    isDragging ? styles.sheetItemDragging : '',
    isDragOver ? styles.sheetItemDragOver : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={liClasses}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {isDraggable && (
        <span className={styles.dragHandle} aria-hidden="true">
          ⠿
        </span>
      )}
      <div className={styles.sheetInfo}>
        <Link to={`/monstro/${sheet.id}`} className={styles.sheetLink}>
          {name}
        </Link>
      </div>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.exportButton} onClick={onExport}>
          ↓ Exportar
        </button>
        <button type="button" className={styles.deleteButton} onClick={onDelete}>
          Excluir
        </button>
      </div>
    </li>
  )
}

function normalizeFilterValue(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR')
}

function getImportedSheetData(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  const entry = parsed as Record<string, unknown>

  if (entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data)) {
    return entry.data as Record<string, unknown>
  }

  const entries = Object.values(entry)

  if (entries.length !== 1) {
    return null
  }

  const nestedEntry = entries[0]

  if (!nestedEntry || typeof nestedEntry !== 'object' || Array.isArray(nestedEntry)) {
    return null
  }

  const nestedRecord = nestedEntry as Record<string, unknown>

  if (!nestedRecord.data || typeof nestedRecord.data !== 'object' || Array.isArray(nestedRecord.data)) {
    return null
  }

  return nestedRecord.data as Record<string, unknown>
}

function detectImportedSheetType(parsed: unknown): ImportFeedback['scope'] {
  const data = getImportedSheetData(parsed)

  if (!data) {
    return 'unknown'
  }

  if (data.character && typeof data.character === 'object') {
    return 'character'
  }

  if (data.details && typeof data.details === 'object') {
    const details = data.details as Record<string, unknown>

    if (details.kind === 'npc') {
      return 'npc'
    }

    if (details.kind === 'monster') {
      return 'monster'
    }
  }

  return 'unknown'
}

function getCharacterTotalLevel(sheet: StoredCharacterSheet): number {
  return sheet.data.character.classes.reduce((sum, currentClass) => sum + currentClass.level, 0)
}

function getCharacterClassNames(sheet: StoredCharacterSheet): string[] {
  return sheet.data.character.classes
    .map((currentClass) => currentClass.className.trim())
    .filter(Boolean)
}

function parseChallengeRating(cr: string): number {
  const trimmed = cr.trim()
  if (!trimmed) return -1
  if (trimmed.includes('/')) {
    const [num, den] = trimmed.split('/')
    const parsed = Number(num) / Number(den)
    return isNaN(parsed) ? -1 : parsed
  }
  const parsed = Number(trimmed)
  return isNaN(parsed) ? -1 : parsed
}

const FILTER_FIELD_OPTIONS: { key: FilterFieldKey; label: string }[] = [
  { key: 'type', label: 'Tipo' },
  { key: 'level', label: 'Nível' },
  { key: 'class', label: 'Classe' },
  { key: 'race', label: 'Raça/Linhagem' },
  { key: 'nd', label: 'ND' },
]

function applyMonsterSort(
  list: StoredMonsterSheet[],
  order: MonsterSortOrder,
  customOrder: string[],
): StoredMonsterSheet[] {
  if (order === 'custom' && customOrder.length > 0) {
    const orderMap = new Map(customOrder.map((id, i) => [id, i]))
    return [...list].sort((a, b) => {
      const ai = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : Number.MAX_SAFE_INTEGER
      const bi = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : Number.MAX_SAFE_INTEGER
      return ai - bi
    })
  }
  if (order === 'alpha') {
    return [...list].sort((a, b) =>
      (a.data.details.name || '').localeCompare(b.data.details.name || '', 'pt-BR'),
    )
  }
  if (order === 'nd-asc') {
    return [...list].sort(
      (a, b) =>
        parseChallengeRating(a.data.traits.challengeRating) -
        parseChallengeRating(b.data.traits.challengeRating),
    )
  }
  if (order === 'nd-desc') {
    return [...list].sort(
      (a, b) =>
        parseChallengeRating(b.data.traits.challengeRating) -
        parseChallengeRating(a.data.traits.challengeRating),
    )
  }
  return list // 'recent' — já ordenado pelo Firestore
}

export function CharactersPage() {
  const { uid } = useAuth()
  const navigate = useNavigate()

  const { sheets, isLoading: isLoadingSheets, error: sheetsError } = useCharacterSheets(uid)
  const { monsters, isLoading: isLoadingMonsters, error: monstersError } = useMonsterSheets(uid)

  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false)
  const [isCreatingMonster, setIsCreatingMonster] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const { characters: searchChars, monsters: searchMonsters, isSearching, searchError, retrySearch } =
    useFirestoreSearch(uid, searchTerm)

  const [typeFilter, setTypeFilter] = useState<SheetFilterType>('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [raceFilter, setRaceFilter] = useState('all')
  const [ndFilter, setNdFilter] = useState('all')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [draftTypeFilter, setDraftTypeFilter] = useState<SheetFilterType>('all')
  const [draftLevelFilter, setDraftLevelFilter] = useState('all')
  const [draftClassFilter, setDraftClassFilter] = useState('all')
  const [draftRaceFilter, setDraftRaceFilter] = useState('all')
  const [draftNdFilter, setDraftNdFilter] = useState('all')
  const [draftVisibleFilters, setDraftVisibleFilters] = useState<FilterFieldKey[]>([])

  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')
  const [customOrder, setCustomOrder] = useState<string[]>([])
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const [monsterSortOrder, setMonsterSortOrder] = useState<MonsterSortOrder>('recent')
  const [customMonsterOrder, setCustomMonsterOrder] = useState<string[]>([])
  const [monsterDragSourceId, setMonsterDragSourceId] = useState<string | null>(null)
  const [monsterDragOverId, setMonsterDragOverId] = useState<string | null>(null)

  const [npcSortOrder, setNpcSortOrder] = useState<MonsterSortOrder>('recent')
  const [customNpcOrder, setCustomNpcOrder] = useState<string[]>([])
  const [npcDragSourceId, setNpcDragSourceId] = useState<string | null>(null)
  const [npcDragOverId, setNpcDragOverId] = useState<string | null>(null)

  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const isSearchMode = searchTerm.trim().length > 0

  useEffect(() => {
    if (!isFilterModalOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsFilterModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isFilterModalOpen])

  useEffect(() => {
    if (!uid) return
    const load = (key: string, setter: (v: string[]) => void) => {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) setter(parsed)
        }
      } catch { }
    }
    load(`tomo-char-order-${uid}`, setCustomOrder)
    load(`tomo-monster-order-${uid}`, setCustomMonsterOrder)
    load(`tomo-npc-order-${uid}`, setCustomNpcOrder)
  }, [uid])

  function saveCustomOrder(newOrder: string[]) {
    if (!uid) return
    setCustomOrder(newOrder)
    try { localStorage.setItem(`tomo-char-order-${uid}`, JSON.stringify(newOrder)) } catch { }
  }

  function saveCustomMonsterOrder(newOrder: string[]) {
    if (!uid) return
    setCustomMonsterOrder(newOrder)
    try { localStorage.setItem(`tomo-monster-order-${uid}`, JSON.stringify(newOrder)) } catch { }
  }

  function saveCustomNpcOrder(newOrder: string[]) {
    if (!uid) return
    setCustomNpcOrder(newOrder)
    try { localStorage.setItem(`tomo-npc-order-${uid}`, JSON.stringify(newOrder)) } catch { }
  }

  const baseSheets = isSearchMode ? searchChars : sheets
  const baseAllMonsters = isSearchMode ? searchMonsters : monsters

  const levelOptions = useMemo(
    () => Array.from(new Set(baseSheets.map(getCharacterTotalLevel))).sort((left, right) => left - right),
    [baseSheets],
  )

  const classOptions = useMemo(
    () => Array.from(new Set(baseSheets.flatMap(getCharacterClassNames))).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [baseSheets],
  )

  const raceOptions = useMemo(
    () => Array.from(
      new Set(
        baseSheets
          .map((sheet) => sheet.data.character.race.trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [baseSheets],
  )

  const displayedSheets = useMemo(
    () => baseSheets.filter((sheet) => {
      if (typeFilter !== 'all' && typeFilter !== 'character') return false
      if (levelFilter !== 'all' && getCharacterTotalLevel(sheet) !== Number(levelFilter)) return false
      if (
        classFilter !== 'all' &&
        !getCharacterClassNames(sheet).some(
          (className) => normalizeFilterValue(className) === normalizeFilterValue(classFilter),
        )
      ) {
        return false
      }
      if (
        raceFilter !== 'all' &&
        normalizeFilterValue(sheet.data.character.race) !== normalizeFilterValue(raceFilter)
      ) {
        return false
      }
      return true
    }),
    [baseSheets, classFilter, levelFilter, raceFilter, typeFilter],
  )

  const sortedSheets = useMemo(() => {
    if (sortOrder === 'custom' && customOrder.length > 0) {
      const orderMap = new Map(customOrder.map((id, i) => [id, i]))
      return [...displayedSheets].sort((a, b) => {
        const ai = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : Number.MAX_SAFE_INTEGER
        const bi = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : Number.MAX_SAFE_INTEGER
        return ai - bi
      })
    }
    if (sortOrder === 'alpha') {
      return [...displayedSheets].sort((a, b) =>
        (a.data.character.name || '').localeCompare(b.data.character.name || '', 'pt-BR'),
      )
    }
    if (sortOrder === 'class') {
      return [...displayedSheets].sort((a, b) =>
        (getCharacterClassNames(a)[0] || '').localeCompare(getCharacterClassNames(b)[0] || '', 'pt-BR'),
      )
    }
    if (sortOrder === 'level-desc') {
      return [...displayedSheets].sort((a, b) => getCharacterTotalLevel(b) - getCharacterTotalLevel(a))
    }
    if (sortOrder === 'level-asc') {
      return [...displayedSheets].sort((a, b) => getCharacterTotalLevel(a) - getCharacterTotalLevel(b))
    }
    if (sortOrder === 'race') {
      return [...displayedSheets].sort((a, b) =>
        a.data.character.race.localeCompare(b.data.character.race, 'pt-BR'),
      )
    }
    return displayedSheets
  }, [displayedSheets, sortOrder, customOrder])

  // Usa a lista completa (não filtrada por busca) para as opções de ND
  const ndOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        monsters
          .map((m) => m.data.traits.challengeRating.trim())
          .filter(Boolean),
      ),
    )
    return values.sort((a, b) => parseChallengeRating(a) - parseChallengeRating(b))
  }, [monsters])

  // Filtra por ND; a visibilidade por tipo é controlada via showMonsterSection/showNpcSection
  const displayedAllMonsters = useMemo(
    () => baseAllMonsters.filter((monster) => {
      if (ndFilter !== 'all' && monster.data.traits.challengeRating.trim() !== ndFilter) return false
      return true
    }),
    [baseAllMonsters, ndFilter],
  )

  const displayedMonsters = useMemo(
    () => displayedAllMonsters.filter((m) => m.data.details.kind !== 'npc'),
    [displayedAllMonsters],
  )
  const displayedNpcs = useMemo(
    () => displayedAllMonsters.filter((m) => m.data.details.kind === 'npc'),
    [displayedAllMonsters],
  )

  const sortedMonsters = useMemo(
    () => applyMonsterSort(displayedMonsters, monsterSortOrder, customMonsterOrder),
    [displayedMonsters, monsterSortOrder, customMonsterOrder],
  )
  const sortedNpcs = useMemo(
    () => applyMonsterSort(displayedNpcs, npcSortOrder, customNpcOrder),
    [displayedNpcs, npcSortOrder, customNpcOrder],
  )

  const loadingSheets = isSearchMode ? isSearching : isLoadingSheets
  const loadingMonsters = isSearchMode ? isSearching : isLoadingMonsters
  const skeletonCount = isSearchMode ? 2 : 3
  const loadError = sheetsError ?? monstersError

  const hasActiveFilters =
    typeFilter !== 'all' || levelFilter !== 'all' || classFilter !== 'all' || raceFilter !== 'all' || ndFilter !== 'all'
  const activeFilterCount = [typeFilter, levelFilter, classFilter, raceFilter, ndFilter].filter((value) => value !== 'all').length

  // Visibilidade das seções por tipo e por resultado de busca/filtro
  const isFiltered = isSearchMode || hasActiveFilters
  const showCharSection = typeFilter === 'all' || typeFilter === 'character'
  const showMonsterSection =
    (typeFilter === 'all' || typeFilter === 'monster') &&
    (!isFiltered || loadingMonsters || displayedMonsters.length > 0)
  const showNpcSection =
    (typeFilter === 'all' || typeFilter === 'npc') &&
    (!isFiltered || loadingMonsters || displayedNpcs.length > 0)

  function handleCharacterDragStart(id: string) {
    setDragSourceId(id)
  }

  function handleCharacterDragOver(id: string, e: React.DragEvent) {
    e.preventDefault()
    setDragOverId(id)
  }

  function handleCharacterDrop(targetId: string) {
    if (!dragSourceId || dragSourceId === targetId) {
      setDragSourceId(null)
      setDragOverId(null)
      return
    }
    const currentIds = sortedSheets.map((s) => s.id)
    const fromIdx = currentIds.indexOf(dragSourceId)
    const toIdx = currentIds.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const newOrder = [...currentIds]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragSourceId)

    setSortOrder('custom')
    saveCustomOrder(newOrder)
    setDragSourceId(null)
    setDragOverId(null)
  }

  function handleCharacterDragEnd() {
    setDragSourceId(null)
    setDragOverId(null)
  }

  function handleMonsterDragStart(id: string) {
    setMonsterDragSourceId(id)
  }

  function handleMonsterDragOver(id: string, e: React.DragEvent) {
    e.preventDefault()
    setMonsterDragOverId(id)
  }

  function handleMonsterDrop(targetId: string) {
    if (!monsterDragSourceId || monsterDragSourceId === targetId) {
      setMonsterDragSourceId(null)
      setMonsterDragOverId(null)
      return
    }
    const currentIds = sortedMonsters.map((m) => m.id)
    const fromIdx = currentIds.indexOf(monsterDragSourceId)
    const toIdx = currentIds.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const newOrder = [...currentIds]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, monsterDragSourceId)

    setMonsterSortOrder('custom')
    saveCustomMonsterOrder(newOrder)
    setMonsterDragSourceId(null)
    setMonsterDragOverId(null)
  }

  function handleMonsterDragEnd() {
    setMonsterDragSourceId(null)
    setMonsterDragOverId(null)
  }

  function handleNpcDragStart(id: string) {
    setNpcDragSourceId(id)
  }

  function handleNpcDragOver(id: string, e: React.DragEvent) {
    e.preventDefault()
    setNpcDragOverId(id)
  }

  function handleNpcDrop(targetId: string) {
    if (!npcDragSourceId || npcDragSourceId === targetId) {
      setNpcDragSourceId(null)
      setNpcDragOverId(null)
      return
    }
    const currentIds = sortedNpcs.map((n) => n.id)
    const fromIdx = currentIds.indexOf(npcDragSourceId)
    const toIdx = currentIds.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const newOrder = [...currentIds]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, npcDragSourceId)

    setNpcSortOrder('custom')
    saveCustomNpcOrder(newOrder)
    setNpcDragSourceId(null)
    setNpcDragOverId(null)
  }

  function handleNpcDragEnd() {
    setNpcDragSourceId(null)
    setNpcDragOverId(null)
  }

  async function handleCreateCharacter() {
    if (!uid || isCreatingCharacter) return
    setIsCreatingCharacter(true)
    try {
      const stored = await createCharacterSheet(uid)
      navigate(`/ficha/${stored.id}`)
    } catch (err) {
      console.error('Erro ao criar personagem:', err)
      setIsCreatingCharacter(false)
    }
  }

  async function handleCreateMonster() {
    if (!uid || isCreatingMonster) return
    setIsCreatingMonster(true)
    try {
      const stored = await createMonsterSheet(uid)
      navigate(`/monstro/${stored.id}`, {
        state: { startEditing: true },
      })
    } catch (err) {
      console.error('Erro ao criar monstro/NPC:', err)
      setIsCreatingMonster(false)
    }
  }

  function requestDeleteSheet(id: string, name: string) {
    setPendingDelete({ type: 'character', id, name })
  }

  function requestDeleteMonster(id: string, name: string) {
    setPendingDelete({ type: 'monster', id, name })
  }

  async function confirmDelete() {
    if (!pendingDelete || !uid) return
    if (pendingDelete.type === 'character') {
      await deleteCharacterSheet(uid, pendingDelete.id)
    } else {
      await deleteMonster(uid, pendingDelete.id)
    }
    setPendingDelete(null)
  }

  function handleExportSheet(sheet: StoredCharacterSheet) {
    const json = exportCharacterSheetAsJSON(sheet)
    downloadJsonFile(json, normalizeFileName(sheet.data.character.name.trim() || sheet.id, sheet.id, 'pj'))
  }

  function handleExportMonster(monster: StoredMonsterSheet) {
    const json = exportMonsterSheetAsJSON(monster)
    const prefix = monster.data.details.kind === 'npc' ? 'npc' : 'monstro'
    downloadJsonFile(json, normalizeFileName(monster.data.details.name.trim() || monster.id, monster.id, prefix))
  }

  function handleImportClick() {
    setImportFeedback(null)
    importFileInputRef.current?.click()
  }

  function handleSearchTermChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value)
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({ scope: 'unknown', result: { imported: 0, skipped: 0, errors: 1 } })
      event.target.value = ''
      return
    }

    if (!uid) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const rawJson = String(e.target?.result ?? '')

      let parsed: unknown

      try {
        parsed = JSON.parse(rawJson)
      } catch {
        setImportFeedback({ scope: 'unknown', result: { imported: 0, skipped: 0, errors: 1 } })
        return
      }

      const detectedType = detectImportedSheetType(parsed)

      if (detectedType === 'character') {
        const result = await importCharacterSheetFromJSON(uid, rawJson)
        setImportFeedback({ scope: 'character', result })
        return
      }

      if (detectedType === 'monster' || detectedType === 'npc') {
        const result = await importMonsterSheetFromJSON(uid, rawJson)
        setImportFeedback({ scope: detectedType, result })
        return
      }

      setImportFeedback({ scope: 'unknown', result: { imported: 0, skipped: 0, errors: 1 } })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function feedbackMessage(feedback: ImportFeedback): string {
    const label =
      feedback.scope === 'character'
        ? 'PJ'
        : feedback.scope === 'npc'
          ? 'NPC'
          : feedback.scope === 'monster'
            ? 'Monstro'
            : 'Arquivo'

    const labelLow =
      feedback.scope === 'character' || feedback.scope === 'npc'
        ? label
        : label.toLowerCase()

    if (feedback.result.imported > 0) return `${label} importado com sucesso.`
    if (feedback.result.skipped > 0) return `Esse ${labelLow} já existe e não foi sobrescrito.`
    if (feedback.result.errors > 0) return 'Não foi possível importar o arquivo selecionado.'
    return `Nenhum ${labelLow} foi importado.`
  }

  function clearFilters() {
    setTypeFilter('all')
    setLevelFilter('all')
    setClassFilter('all')
    setRaceFilter('all')
    setNdFilter('all')
  }

  function getActiveFilterKeys(): FilterFieldKey[] {
    const keys: FilterFieldKey[] = []

    if (typeFilter !== 'all') keys.push('type')
    if (levelFilter !== 'all') keys.push('level')
    if (classFilter !== 'all') keys.push('class')
    if (raceFilter !== 'all') keys.push('race')
    if (ndFilter !== 'all') keys.push('nd')

    return keys
  }

  function clearDraftFilterValue(key: FilterFieldKey) {
    if (key === 'type') setDraftTypeFilter('all')
    if (key === 'level') setDraftLevelFilter('all')
    if (key === 'class') setDraftClassFilter('all')
    if (key === 'race') setDraftRaceFilter('all')
    if (key === 'nd') setDraftNdFilter('all')
  }

  function syncDraftFilters() {
    setDraftTypeFilter(typeFilter)
    setDraftLevelFilter(levelFilter)
    setDraftClassFilter(classFilter)
    setDraftRaceFilter(raceFilter)
    setDraftNdFilter(ndFilter)
    setDraftVisibleFilters(getActiveFilterKeys())
  }

  function openFilterModal() {
    syncDraftFilters()
    setIsFilterModalOpen(true)
  }

  function closeFilterModal() {
    setIsFilterModalOpen(false)
  }

  function applyDraftFilters() {
    setTypeFilter(draftVisibleFilters.includes('type') ? draftTypeFilter : 'all')
    setLevelFilter(draftVisibleFilters.includes('level') ? draftLevelFilter : 'all')
    setClassFilter(draftVisibleFilters.includes('class') ? draftClassFilter : 'all')
    setRaceFilter(draftVisibleFilters.includes('race') ? draftRaceFilter : 'all')
    setNdFilter(draftVisibleFilters.includes('nd') ? draftNdFilter : 'all')
    setIsFilterModalOpen(false)
  }

  function clearDraftFilters() {
    setDraftTypeFilter('all')
    setDraftLevelFilter('all')
    setDraftClassFilter('all')
    setDraftRaceFilter('all')
    setDraftNdFilter('all')
    setDraftVisibleFilters([])
  }

  function toggleDraftVisibleFilter(key: FilterFieldKey) {
    setDraftVisibleFilters((previous) => {
      if (previous.includes(key)) {
        clearDraftFilterValue(key)
        return previous.filter((currentKey) => currentKey !== key)
      }

      return [...previous, key]
    })
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>Erro ao carregar fichas. Verifique sua conexão.</p>
          <button
            type="button"
            className={styles.importButton}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        className={styles.hiddenInput}
        onChange={handleImportFileChange}
      />

      <header className={styles.pageTop}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Fichas</h1>
          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.createSecondary}
              onClick={handleImportClick}
            >
              ↑ Importar PJ
            </button>
            <button
              type="button"
              className={styles.createPrimary}
              onClick={handleCreateCharacter}
              disabled={isCreatingCharacter}
            >
              {isCreatingCharacter ? 'Criando...' : '+ Novo PJ'}
            </button>
            <button
              type="button"
              className={styles.createSecondary}
              onClick={handleCreateMonster}
              disabled={isCreatingMonster}
            >
              {isCreatingMonster ? 'Criando...' : '+ Monstro / NPC'}
            </button>
          </div>
        </div>
      </header>

      <header className={styles.pageHeader}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">⚲</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            aria-label="Buscar fichas"
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.headerTools}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={openFilterModal}
            aria-haspopup="dialog"
            aria-expanded={isFilterModalOpen}
          >
            Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {searchError && (
          <div className={styles.searchError}>
            <span>Erro ao buscar fichas.</span>
            <button type="button" className={styles.retryButton} onClick={retrySearch}>
              Tentar novamente
            </button>
          </div>
        )}
      </header>

      {showCharSection && (
        <SheetSection
          title="PJs"
          items={sortedSheets}
          loading={loadingSheets}
          skeletonCount={skeletonCount}
          renderItem={(sheet) => (
            <CharacterSheetItem
              key={sheet.id}
              sheet={sheet}
              onExport={() => handleExportSheet(sheet)}
              onDelete={() => requestDeleteSheet(sheet.id, sheet.data.character.name)}
              isDraggable={!isSearchMode}
              isDragging={dragSourceId === sheet.id}
              isDragOver={dragOverId === sheet.id}
              onDragStart={!isSearchMode ? () => handleCharacterDragStart(sheet.id) : undefined}
              onDragOver={!isSearchMode ? (e) => handleCharacterDragOver(sheet.id, e) : undefined}
              onDrop={!isSearchMode ? () => handleCharacterDrop(sheet.id) : undefined}
              onDragEnd={!isSearchMode ? handleCharacterDragEnd : undefined}
            />
          )}
          emptyMessage={isFiltered ? 'Nenhuma ficha encontrada.' : 'Nenhum PJ encontrado.'}
        />
      )}

      {showMonsterSection && (
        <SheetSection
          title="Monstros"
          items={sortedMonsters}
          loading={loadingMonsters}
          skeletonCount={skeletonCount}
          renderItem={(monster) => (
            <MonsterSheetItem
              key={monster.id}
              sheet={monster}
              onExport={() => handleExportMonster(monster)}
              onDelete={() => requestDeleteMonster(monster.id, monster.data.details.name)}
              isDraggable={!isSearchMode}
              isDragging={monsterDragSourceId === monster.id}
              isDragOver={monsterDragOverId === monster.id}
              onDragStart={!isSearchMode ? () => handleMonsterDragStart(monster.id) : undefined}
              onDragOver={!isSearchMode ? (e) => handleMonsterDragOver(monster.id, e) : undefined}
              onDrop={!isSearchMode ? () => handleMonsterDrop(monster.id) : undefined}
              onDragEnd={!isSearchMode ? handleMonsterDragEnd : undefined}
            />
          )}
          emptyMessage="Nenhum monstro encontrado."
        />
      )}

      {showNpcSection && (
        <SheetSection
          title="NPCs"
          items={sortedNpcs}
          loading={loadingMonsters}
          skeletonCount={skeletonCount}
          renderItem={(npc) => (
            <MonsterSheetItem
              key={npc.id}
              sheet={npc}
              onExport={() => handleExportMonster(npc)}
              onDelete={() => requestDeleteMonster(npc.id, npc.data.details.name)}
              isDraggable={!isSearchMode}
              isDragging={npcDragSourceId === npc.id}
              isDragOver={npcDragOverId === npc.id}
              onDragStart={!isSearchMode ? () => handleNpcDragStart(npc.id) : undefined}
              onDragOver={!isSearchMode ? (e) => handleNpcDragOver(npc.id, e) : undefined}
              onDrop={!isSearchMode ? () => handleNpcDrop(npc.id) : undefined}
              onDragEnd={!isSearchMode ? handleNpcDragEnd : undefined}
            />
          )}
          emptyMessage="Nenhum NPC encontrado."
        />
      )}

      {importFeedback && (
        <p
          className={
            importFeedback.result.errors > 0 && importFeedback.result.imported === 0
              ? styles.feedbackError
              : styles.feedbackOk
          }
        >
          {feedbackMessage(importFeedback)}
        </p>
      )}

      {isFilterModalOpen && (
        <div className={styles.dialogOverlay} onClick={closeFilterModal}>
          <div
            className={styles.filterDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.filterDialogHeader}>
              <div>
                <p className={styles.filterDialogEyebrow}>Refinar lista</p>
                <h2 id="filters-dialog-title" className={styles.filterDialogTitle}>Filtros</h2>
              </div>
              <button
                type="button"
                className={styles.filterDialogClose}
                onClick={closeFilterModal}
                aria-label="Fechar filtros"
              >
                ✕
              </button>
            </div>

            <div className={styles.filterPicker}>
              <p className={styles.filterPickerLabel}>Escolha quais critérios entrarão no combo</p>
              <div className={styles.filterPickerChips}>
                {FILTER_FIELD_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`${styles.filterPickerChip} ${draftVisibleFilters.includes(option.key) ? styles.filterPickerChipActive : ''}`}
                    onClick={() => toggleDraftVisibleFilter(option.key)}
                    aria-pressed={draftVisibleFilters.includes(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {draftVisibleFilters.length > 0 ? (
              <div className={styles.filterGrid}>
                {draftVisibleFilters.includes('type') && (
                  <label className={styles.filterField}>
                    <span>Tipo</span>
                    <select value={draftTypeFilter} onChange={(event) => setDraftTypeFilter(event.target.value as SheetFilterType)}>
                      <option value="all">Todos</option>
                      <option value="character">PJ</option>
                      <option value="monster">Monstro</option>
                      <option value="npc">NPC</option>
                    </select>
                  </label>
                )}

                {draftVisibleFilters.includes('level') && (
                  <label className={styles.filterField}>
                    <span>Nível</span>
                    <select value={draftLevelFilter} onChange={(event) => setDraftLevelFilter(event.target.value)}>
                      <option value="all">Todos</option>
                      {levelOptions.map((level) => (
                        <option key={level} value={String(level)}>
                          Nível {level}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {draftVisibleFilters.includes('class') && (
                  <label className={styles.filterField}>
                    <span>Classe</span>
                    <select value={draftClassFilter} onChange={(event) => setDraftClassFilter(event.target.value)}>
                      <option value="all">Todas</option>
                      {classOptions.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {draftVisibleFilters.includes('race') && (
                  <label className={styles.filterField}>
                    <span>Raça/Linhagem</span>
                    <select value={draftRaceFilter} onChange={(event) => setDraftRaceFilter(event.target.value)}>
                      <option value="all">Todas</option>
                      {raceOptions.map((race) => (
                        <option key={race} value={race}>
                          {race}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {draftVisibleFilters.includes('nd') && (
                  <label className={styles.filterField}>
                    <span>ND</span>
                    <select value={draftNdFilter} onChange={(event) => setDraftNdFilter(event.target.value)}>
                      <option value="all">Todos</option>
                      {ndOptions.map((nd) => (
                        <option key={nd} value={nd}>
                          {nd}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ) : (
              <p className={styles.filterHint}>Nenhum critério selecionado ainda. Escolha acima os filtros que deseja usar.</p>
            )}

            <div className={styles.filterDialogActions}>
              <button type="button" className={styles.createSecondary} onClick={clearDraftFilters}>
                Limpar seleção
              </button>
              <button type="button" className={styles.createPrimary} onClick={applyDraftFilters}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className={styles.dialogOverlay}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <p id="delete-dialog-title" className={styles.dialogTitle}>
              Excluir "{pendingDelete.name || '(sem nome)'}" permanentemente?
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.deleteButton} onClick={confirmDelete}>
                Confirmar exclusão
              </button>
              <button
                type="button"
                className={styles.importButton}
                onClick={() => setPendingDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
