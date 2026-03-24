import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  scope: 'character' | 'monster'
  result: CharacterImportResult | MonsterImportResult
}

type PendingDelete = {
  type: 'character' | 'monster'
  id: string
  name: string
}

type SheetFilterType = 'all' | 'character' | 'monster' | 'npc'

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
  importLabel: string
  onImport: () => void
  renderItem: (item: T) => React.ReactNode
  emptyMessage: string
}

function SheetSection<T>({
  title,
  items,
  loading,
  skeletonCount = 3,
  importLabel,
  onImport,
  renderItem,
  emptyMessage,
}: SheetSectionProps<T>) {
  return (
    <section className={styles.collectionSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <button type="button" className={styles.importButton} onClick={onImport}>
          {importLabel}
        </button>
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
}

function CharacterSheetItem({ sheet, onExport, onDelete }: CharacterSheetItemProps) {
  const name = sheet.data.character.name || '(sem nome)'
  const race = sheet.data.character.race
  const totalLevel = sheet.data.character.classes.reduce((sum, c) => sum + c.level, 0)
  const classNames = sheet.data.character.classes
    .filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' · ')
  const meta = [race, classNames].filter(Boolean).join(' · ') || (totalLevel > 0 ? `Nível ${totalLevel}` : null)

  return (
    <li className={styles.sheetItem}>
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
}

function MonsterSheetItem({ sheet, onExport, onDelete }: MonsterSheetItemProps) {
  const name = sheet.data.details.name || '(sem nome)'
  const kindLabel = sheet.data.details.kind === 'npc' ? 'NPC' : 'Monstro'

  return (
    <li className={styles.sheetItem}>
      <div className={styles.sheetInfo}>
        <Link to={`/monstro/${sheet.id}`} className={styles.sheetLink}>
          {name}
        </Link>
        <span className={styles.sheetMeta}>{kindLabel}</span>
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

function getCharacterTotalLevel(sheet: StoredCharacterSheet): number {
  return sheet.data.character.classes.reduce((sum, currentClass) => sum + currentClass.level, 0)
}

function getCharacterClassNames(sheet: StoredCharacterSheet): string[] {
  return sheet.data.character.classes
    .map((currentClass) => currentClass.className.trim())
    .filter(Boolean)
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

  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const characterFileInputRef = useRef<HTMLInputElement>(null)
  const monsterFileInputRef = useRef<HTMLInputElement>(null)

  const isSearchMode = searchTerm.trim().length > 0

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

  const displayedAllMonsters = useMemo(
    () => baseAllMonsters.filter((monster) => {
      if (typeFilter === 'all') return true
      return monster.data.details.kind === typeFilter
    }),
    [baseAllMonsters, typeFilter],
  )

  const displayedMonsters = displayedAllMonsters.filter((m) => m.data.details.kind !== 'npc')
  const displayedNpcs = displayedAllMonsters.filter((m) => m.data.details.kind === 'npc')

  const loadingSheets = isSearchMode ? isSearching : isLoadingSheets
  const loadingMonsters = isSearchMode ? isSearching : isLoadingMonsters
  const skeletonCount = isSearchMode ? 2 : 3
  const loadError = sheetsError ?? monstersError

  const hasActiveFilters =
    typeFilter !== 'all' || levelFilter !== 'all' || classFilter !== 'all' || raceFilter !== 'all'

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

  function normalizeFileName(rawName: string, fallbackId: string, prefix: string): string {
    const normalizedName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${prefix}-${normalizedName || fallbackId}.json`
  }

  function downloadJsonFile(json: string, fileName: string) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportSheet(sheet: StoredCharacterSheet) {
    const json = exportCharacterSheetAsJSON(sheet)
    downloadJsonFile(json, normalizeFileName(sheet.data.character.name.trim() || sheet.id, sheet.id, 'tomo-personagem'))
  }

  function handleExportMonster(monster: StoredMonsterSheet) {
    const json = exportMonsterSheetAsJSON(monster)
    downloadJsonFile(json, normalizeFileName(monster.data.details.name.trim() || monster.id, monster.id, 'tomo-monstro'))
  }

  function handleImportClick(scope: 'character' | 'monster') {
    setImportFeedback(null)
    if (scope === 'character') characterFileInputRef.current?.click()
    else monsterFileInputRef.current?.click()
  }

  function handleSearchTermChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value)
  }

  function handleCharacterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({ scope: 'character', result: { imported: 0, skipped: 0, errors: 1 } })
      event.target.value = ''
      return
    }
    if (!uid) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = await importCharacterSheetFromJSON(uid, e.target?.result as string)
      setImportFeedback({ scope: 'character', result })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function handleMonsterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({ scope: 'monster', result: { imported: 0, skipped: 0, errors: 1 } })
      event.target.value = ''
      return
    }
    if (!uid) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = await importMonsterSheetFromJSON(uid, e.target?.result as string)
      setImportFeedback({ scope: 'monster', result })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function feedbackMessage(feedback: ImportFeedback): string {
    const label = feedback.scope === 'character' ? 'Ficha' : 'Monstro ou NPC'
    if (feedback.result.imported > 0) return `${label} importado com sucesso.`
    if (feedback.result.skipped > 0) return `Esse ${label.toLowerCase()} já existe e não foi sobrescrito.`
    if (feedback.result.errors > 0) return 'Não foi possível importar o arquivo selecionado.'
    return `Nenhum ${label.toLowerCase()} foi importado.`
  }

  function clearFilters() {
    setTypeFilter('all')
    setLevelFilter('all')
    setClassFilter('all')
    setRaceFilter('all')
  }

  if (loadError) {
    return (
      <main className={styles.page}>
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
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <input
        ref={characterFileInputRef}
        type="file"
        accept=".json,application/json"
        className={styles.hiddenInput}
        onChange={handleCharacterImportFileChange}
      />
      <input
        ref={monsterFileInputRef}
        type="file"
        accept=".json,application/json"
        className={styles.hiddenInput}
        onChange={handleMonsterImportFileChange}
      />

      <header className={styles.pageTop}>
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Personagens</h1>
          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.createPrimary}
              onClick={handleCreateCharacter}
              disabled={isCreatingCharacter}
            >
              {isCreatingCharacter ? 'Criando...' : '+ Novo Personagem'}
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

        <div className={styles.filterGrid}>
          <label className={styles.filterField}>
            <span>Tipo</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as SheetFilterType)}>
              <option value="all">Todos</option>
              <option value="character">Personagem</option>
              <option value="monster">Monstro</option>
              <option value="npc">NPC</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Nível</span>
            <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              <option value="all">Todos</option>
              {levelOptions.map((level) => (
                <option key={level} value={String(level)}>
                  Nível {level}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Classe</span>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">Todas</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Raça/Linhagem</span>
            <select value={raceFilter} onChange={(event) => setRaceFilter(event.target.value)}>
              <option value="all">Todas</option>
              {raceOptions.map((race) => (
                <option key={race} value={race}>
                  {race}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className={styles.filterActions}>
            <button type="button" className={styles.retryButton} onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        )}

        {searchError && (
          <div className={styles.searchError}>
            <span>Erro ao buscar fichas.</span>
            <button type="button" className={styles.retryButton} onClick={retrySearch}>
              Tentar novamente
            </button>
          </div>
        )}
      </header>

      <SheetSection
        title="Personagens"
        items={displayedSheets}
        loading={loadingSheets}
        skeletonCount={skeletonCount}
        importLabel="↑ Importar personagem"
        onImport={() => handleImportClick('character')}
        renderItem={(sheet) => (
          <CharacterSheetItem
            key={sheet.id}
            sheet={sheet}
            onExport={() => handleExportSheet(sheet)}
            onDelete={() => requestDeleteSheet(sheet.id, sheet.data.character.name)}
          />
        )}
        emptyMessage={isSearchMode || hasActiveFilters ? 'Nenhuma ficha encontrada.' : 'Nenhum personagem encontrado.'}
      />

      <SheetSection
        title="Monstros & NPCs"
        items={[...displayedMonsters, ...displayedNpcs]}
        loading={loadingMonsters}
        skeletonCount={skeletonCount}
        importLabel="↑ Importar Monstro/NPC"
        onImport={() => handleImportClick('monster')}
        renderItem={(monster) => (
          <MonsterSheetItem
            key={monster.id}
            sheet={monster}
            onExport={() => handleExportMonster(monster)}
            onDelete={() => requestDeleteMonster(monster.id, monster.data.details.name)}
          />
        )}
        emptyMessage={isSearchMode || hasActiveFilters ? 'Nenhum monstro ou NPC encontrado.' : 'Nenhum monstro ou NPC encontrado.'}
      />

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
    </main>
  )
}
