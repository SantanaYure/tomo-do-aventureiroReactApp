import { useMemo, useRef, useState, type ChangeEvent } from 'react'
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
import { useSheetGroups } from '../../hooks/useSheetGroups'
import { GroupManagerModal } from '../../components/GroupManagerModal/GroupManagerModal'
import { SheetActionsMenu } from '../../components/SheetActionsMenu/SheetActionsMenu'
import styles from './CharactersPage.module.css'

const NO_GROUP_KEY = '__no_group__'
const NO_GROUP_LABEL = 'Personagem Independente'

type SheetTypeFilter = 'all' | 'character' | 'monster' | 'npc'

type ImportFeedback = {
  scope: 'character' | 'monster' | 'npc' | 'unknown'
  result: CharacterImportResult | MonsterImportResult
}

type PendingDelete = {
  type: 'character' | 'monster'
  id: string
  name: string
}

const MAX_JSON_BYTES = 2 * 1024 * 1024

function matchesText(text: string, term: string): boolean {
  if (!term) return false
  return text.trim().toLocaleLowerCase('pt-BR').includes(term)
}

function SheetSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className={styles.sheetList} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={styles.skeletonItem}>
          <div className={`${styles.skeletonLine} ${styles.skeletonAvatar}`} />
          <div className={styles.skeletonContent}>
            <div className={`${styles.skeletonLine} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
          </div>
          <div className={styles.skeletonActions}>
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

function SheetThumbnail({
  avatar,
  alt,
  fallbackLabel,
}: {
  avatar?: string
  alt: string
  fallbackLabel: string
}) {
  const avatarSrc = avatar?.trim()

  return (
    <span className={styles.sheetThumbnail}>
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={alt}
          className={styles.sheetThumbnailImage}
          loading="lazy"
        />
      ) : (
        <span className={styles.sheetThumbnailFallback} aria-hidden="true">
          {fallbackLabel}
        </span>
      )}
    </span>
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
  const avatar = sheet.data.character.avatar
  const totalLevel = sheet.data.character.classes.reduce((sum, c) => sum + c.level, 0)
  const classNames = sheet.data.character.classes
    .filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' · ')
  const meta = [race, classNames].filter(Boolean).join(' · ') || (totalLevel > 0 ? `Nível ${totalLevel}` : null)

  return (
    <li className={styles.sheetItem}>
      <Link to={`/ficha/${sheet.id}`} className={styles.sheetCardLink}>
        <SheetThumbnail avatar={avatar} alt={`Avatar de ${name}`} fallbackLabel="PJ" />
        <span className={styles.sheetText}>
          <span className={styles.sheetName}>{name}</span>
          {meta && <span className={styles.sheetMeta}>{meta}</span>}
        </span>
      </Link>
      <div className={styles.sheetActions}>
        <SheetActionsMenu onExport={onExport} onDelete={onDelete} />
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
  const avatar = sheet.data.details.avatar
  const fallbackLabel = sheet.data.details.kind === 'npc' ? 'NPC' : 'MON'
  const cr = sheet.data.traits.challengeRating.trim()
  const meta = cr ? `ND ${cr}` : null

  return (
    <li className={styles.sheetItem}>
      <Link to={`/monstro/${sheet.id}`} className={styles.sheetCardLink}>
        <SheetThumbnail avatar={avatar} alt={`Avatar de ${name}`} fallbackLabel={fallbackLabel} />
        <span className={styles.sheetText}>
          <span className={styles.sheetName}>{name}</span>
          {meta && <span className={styles.sheetMeta}>{meta}</span>}
        </span>
      </Link>
      <div className={styles.sheetActions}>
        <SheetActionsMenu onExport={onExport} onDelete={onDelete} />
      </div>
    </li>
  )
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

export function CharactersPage() {
  const { uid } = useAuth()
  const navigate = useNavigate()

  const { sheets, isLoading: isLoadingSheets, error: sheetsError } = useCharacterSheets(uid)
  const { monsters, isLoading: isLoadingMonsters, error: monstersError } = useMonsterSheets(uid)
  const { groups, isLoading: isLoadingGroups } = useSheetGroups(uid)

  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false)
  const [isCreatingMonster, setIsCreatingMonster] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [showGroupManager, setShowGroupManager] = useState(false)
  const [typeFilter, setTypeFilter] = useState<SheetTypeFilter>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')

  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>()
    groups.forEach((group) => map.set(group.id, group.name))
    return map
  }, [groups])

  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('pt-BR')
  const hasSearch = normalizedSearchTerm.length > 0

  function sheetMatchesSearch(name: string, groupId: string, typeLabels: string[]): boolean {
    if (!hasSearch) return true
    const groupName = groupId ? groupNameById.get(groupId) ?? '' : NO_GROUP_LABEL
    if (matchesText(name, normalizedSearchTerm)) return true
    if (matchesText(groupName, normalizedSearchTerm)) return true
    return typeLabels.some((label) => matchesText(label, normalizedSearchTerm))
  }

  function matchesGroupFilter(groupId: string): boolean {
    if (groupFilter === 'all') return true
    if (groupFilter === NO_GROUP_KEY) return !groupId
    return groupId === groupFilter
  }

  function matchesTypeFilter(type: 'character' | 'monster' | 'npc'): boolean {
    if (typeFilter === 'all') return true
    return typeFilter === type
  }

  const filteredCharacters = useMemo(
    () => sheets.filter((sheet) => {
      const groupId = sheet.data.groupId ?? ''
      if (!matchesTypeFilter('character')) return false
      if (!matchesGroupFilter(groupId)) return false
      return sheetMatchesSearch(sheet.data.character.name, groupId, ['pj', 'personagem'])
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheets, typeFilter, groupFilter, normalizedSearchTerm, groupNameById],
  )

  const filteredMonsters = useMemo(
    () => monsters.filter((monster) => {
      const groupId = monster.data.groupId ?? ''
      const kind = monster.data.details.kind === 'npc' ? 'npc' : 'monster'
      if (!matchesTypeFilter(kind)) return false
      if (!matchesGroupFilter(groupId)) return false
      const labels = kind === 'npc' ? ['npc'] : ['monstro', 'monster']
      return sheetMatchesSearch(monster.data.details.name, groupId, labels)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monsters, typeFilter, groupFilter, normalizedSearchTerm, groupNameById],
  )

  type GroupedBucket = {
    key: string
    title: string
    characters: StoredCharacterSheet[]
    monsters: StoredMonsterSheet[]
    npcs: StoredMonsterSheet[]
  }

  const groupedBuckets = useMemo<GroupedBucket[]>(() => {
    const buckets = new Map<string, GroupedBucket>()

    function ensureBucket(key: string, title: string): GroupedBucket {
      const existing = buckets.get(key)
      if (existing) return existing
      const created: GroupedBucket = {
        key,
        title,
        characters: [],
        monsters: [],
        npcs: [],
      }
      buckets.set(key, created)
      return created
    }

    // Apenas cria buckets para mesas que passam o filtro atual
    if (groupFilter === 'all' || (groupFilter !== NO_GROUP_KEY && groupFilter !== 'all')) {
      groups.forEach((group) => {
        if (groupFilter !== 'all' && groupFilter !== group.id) return
        ensureBucket(group.id, group.name)
      })
    }

    filteredCharacters.forEach((sheet) => {
      const id = sheet.data.groupId ?? ''
      const key = id && groupNameById.has(id) ? id : NO_GROUP_KEY
      const title = key === NO_GROUP_KEY ? NO_GROUP_LABEL : groupNameById.get(key) ?? NO_GROUP_LABEL
      ensureBucket(key, title).characters.push(sheet)
    })

    filteredMonsters.forEach((monster) => {
      const id = monster.data.groupId ?? ''
      const key = id && groupNameById.has(id) ? id : NO_GROUP_KEY
      const title = key === NO_GROUP_KEY ? NO_GROUP_LABEL : groupNameById.get(key) ?? NO_GROUP_LABEL
      const bucket = ensureBucket(key, title)
      if (monster.data.details.kind === 'npc') {
        bucket.npcs.push(monster)
      } else {
        bucket.monsters.push(monster)
      }
    })

    // Sem mesa vai por último (a não ser que seja o único filtro)
    const noGroupBucket = buckets.get(NO_GROUP_KEY)
    buckets.delete(NO_GROUP_KEY)
    const ordered = Array.from(buckets.values())
    if (noGroupBucket) ordered.push(noGroupBucket)
    return ordered
  }, [groups, groupNameById, groupFilter, filteredCharacters, filteredMonsters])

  const isFiltered = hasSearch || typeFilter !== 'all' || groupFilter !== 'all'
  const loadError = sheetsError ?? monstersError
  const isLoading = isLoadingSheets || isLoadingMonsters
  const skeletonCount = hasSearch ? 2 : 3

  const visibleBuckets = groupedBuckets.filter(
    (bucket) => bucket.characters.length + bucket.monsters.length + bucket.npcs.length > 0,
  )

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

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>Erro ao carregar fichas. Verifique sua conexão.</p>
          <button
            type="button"
            className={styles.tertiaryAction}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  function renderBucketContent(bucket: GroupedBucket) {
    return (
      <ul className={styles.sheetList}>
        {bucket.characters.map((sheet) => (
          <CharacterSheetItem
            key={`char-${sheet.id}`}
            sheet={sheet}
            onExport={() => handleExportSheet(sheet)}
            onDelete={() => requestDeleteSheet(sheet.id, sheet.data.character.name)}
          />
        ))}
        {bucket.monsters.map((monster) => (
          <MonsterSheetItem
            key={`mon-${monster.id}`}
            sheet={monster}
            onExport={() => handleExportMonster(monster)}
            onDelete={() => requestDeleteMonster(monster.id, monster.data.details.name)}
          />
        ))}
        {bucket.npcs.map((npc) => (
          <MonsterSheetItem
            key={`npc-${npc.id}`}
            sheet={npc}
            onExport={() => handleExportMonster(npc)}
            onDelete={() => requestDeleteMonster(npc.id, npc.data.details.name)}
          />
        ))}
      </ul>
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
              className={styles.tertiaryAction}
              onClick={handleImportClick}
            >
              ↑ Importar PJ
            </button>
            <button
              type="button"
              className={styles.tertiaryAction}
              onClick={() => setShowGroupManager(true)}
              disabled={isLoadingGroups}
            >
              Gerenciar mesas
            </button>
            <button
              type="button"
              className={styles.createSecondary}
              onClick={handleCreateMonster}
              disabled={isCreatingMonster}
            >
              {isCreatingMonster ? 'Criando...' : '+ Monstro / NPC'}
            </button>
            <button
              type="button"
              className={styles.createPrimary}
              onClick={handleCreateCharacter}
              disabled={isCreatingCharacter}
            >
              {isCreatingCharacter ? 'Criando...' : '+ Novo PJ'}
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
            placeholder="Buscar por nome, mesa ou tipo..."
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

        <div className={styles.inlineFilters}>
          <label className={styles.inlineFilter}>
            <span className={styles.inlineFilterLabel}>Mesa</span>
            <select
              className={styles.inlineFilterSelect}
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              disabled={isLoadingGroups}
            >
              <option value="all">Todas</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
              <option value={NO_GROUP_KEY}>{NO_GROUP_LABEL}</option>
            </select>
          </label>

          <label className={styles.inlineFilter}>
            <span className={styles.inlineFilterLabel}>Tipo</span>
            <select
              className={styles.inlineFilterSelect}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as SheetTypeFilter)}
            >
              <option value="all">Todos</option>
              <option value="character">PJ</option>
              <option value="npc">NPC</option>
              <option value="monster">Monstro</option>
            </select>
          </label>
        </div>
      </header>

      {isLoading && (
        <SheetSection
          title="Carregando"
          items={[]}
          loading={true}
          skeletonCount={skeletonCount}
          renderItem={() => null}
          emptyMessage=""
        />
      )}

      {!isLoading && visibleBuckets.length === 0 && (
        <p className={styles.emptySection}>
          {isFiltered
            ? 'Nenhuma ficha encontrada com os filtros atuais.'
            : 'Nenhuma ficha por aqui ainda. Crie um PJ ou um Monstro/NPC para começar.'}
        </p>
      )}

      {!isLoading && visibleBuckets.map((bucket) => (
        <section key={bucket.key} className={styles.collectionSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{bucket.title}</h2>
          </div>
          {renderBucketContent(bucket)}
        </section>
      ))}

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

      {showGroupManager && uid && (
        <GroupManagerModal
          uid={uid}
          groups={groups}
          onClose={() => setShowGroupManager(false)}
        />
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
              <button type="button" className={styles.confirmDangerBtn} onClick={confirmDelete}>
                Confirmar exclusão
              </button>
              <button
                type="button"
                className={styles.tertiaryAction}
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
