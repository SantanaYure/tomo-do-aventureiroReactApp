import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { normalizeFileName, downloadJsonFile } from '../../utils/exportSheet'
import {
  importSheetFiles,
  summarizeImport,
  type ImportSummary,
} from '../../utils/importSheetFiles'
import { DiceRollLoader } from '../../components/DiceRollLoader/DiceRollLoader'
import {
  deleteSheets,
  sheetKey,
  summarizeDelete,
  type SheetDeleteTarget,
} from '../../utils/deleteSheets'
import {
  createCharacterSheet,
  exportCharacterSheetAsJSON,
  type StoredCharacterSheet,
} from '../../store/characterSheetStore'
import {
  createMonsterSheet,
  exportMonsterSheetAsJSON,
  type StoredMonsterSheet,
} from '../../store/monsterSheetStore'
import { useAuth } from '../../context/AuthContext'
import { useCharacterSheets } from '../../hooks/useCharacterSheets'
import { useMonsterSheets } from '../../hooks/useMonsterSheets'
import { useSheetGroups } from '../../hooks/useSheetGroups'
import { GroupManagerModal } from '../../components/GroupManagerModal/GroupManagerModal'
import { SheetActionsMenu } from '../../components/SheetActionsMenu/SheetActionsMenu'
import { LinkToCampaignModal } from '../../components/campaign/LinkToCampaignModal/LinkToCampaignModal'
import { SrdMonsterPicker } from '../../components/SrdMonsterPicker/SrdMonsterPicker'
import type { SrdMonsterTemplate } from '../../data/srd/monsters'
import styles from './CharactersPage.module.css'

const NO_GROUP_KEY = '__no_group__'
const NO_GROUP_LABEL = 'Personagem Independente'

type SheetTypeFilter = 'all' | 'character' | 'monster' | 'npc'

/** Resumo mostrado depois de importar ou excluir em lote. */
type FeedbackSummary = Pick<ImportSummary, 'message' | 'problems' | 'tone'>

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

/** Estado de seleção de um card no modo "Selecionar". */
interface SelectionProps {
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

/**
 * Corpo do card. No modo de seleção vira um rótulo com caixa de marcar (clicar
 * em qualquer parte do card marca ou desmarca); fora dele, é o link da ficha.
 */
function SheetCardBody({
  href,
  name,
  children,
  selectable,
  selected,
  onToggleSelect,
}: SelectionProps & { href: string; name: string; children: React.ReactNode }) {
  if (selectable) {
    return (
      <label className={styles.sheetCardLink}>
        <input
          type="checkbox"
          className={styles.selectCheckbox}
          checked={selected ?? false}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${name}`}
        />
        {children}
      </label>
    )
  }
  return (
    <Link to={href} className={styles.sheetCardLink}>
      {children}
    </Link>
  )
}

interface CharacterSheetItemProps extends SelectionProps {
  sheet: StoredCharacterSheet
  onExport: () => void
  onDelete: () => void
  onLink?: () => void
}

function CharacterSheetItem({
  sheet,
  onExport,
  onDelete,
  onLink,
  ...selection
}: CharacterSheetItemProps) {
  const name = sheet.data.character.name || '(sem nome)'
  const race = sheet.data.character.race
  const avatar = sheet.data.character.avatar
  const totalLevel = sheet.data.character.classes.reduce((sum, c) => sum + c.level, 0)
  const classNames = sheet.data.character.classes
    .filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' · ')
  const meta = [race, classNames].filter(Boolean).join(' · ') || (totalLevel > 0 ? `Nível ${totalLevel}` : null)
  const campaignName = sheet.data.campaignName
  const campaignId = sheet.data.campaignId

  return (
    <li className={`${styles.sheetItem} ${selection.selected ? styles.sheetItemSelected : ''}`}>
      <SheetCardBody href={`/ficha/${sheet.id}`} name={name} {...selection}>
        <SheetThumbnail avatar={avatar} alt={`Avatar de ${name}`} fallbackLabel="PJ" />
        <span className={styles.sheetText}>
          <span className={styles.sheetName}>{name}</span>
          {meta && <span className={styles.sheetMeta}>{meta}</span>}
          {campaignName && (
            <span className={styles.campaignBadge}>
              ♜ {campaignName}
            </span>
          )}
        </span>
      </SheetCardBody>
      {!selection.selectable && (
        <div className={styles.sheetActions}>
          <SheetActionsMenu
            onExport={onExport}
            onDelete={onDelete}
            onLinkToCampaign={onLink}
            linkToCampaignLabel={campaignId ? 'Gerenciar Vínculo com Mesa' : 'Vincular à Mesa'}
          />
        </div>
      )}
    </li>
  )
}

interface MonsterSheetItemProps extends SelectionProps {
  sheet: StoredMonsterSheet
  onExport: () => void
  onDelete: () => void
  onLink?: () => void
}

function MonsterSheetItem({
  sheet,
  onExport,
  onDelete,
  onLink,
  ...selection
}: MonsterSheetItemProps) {
  const name = sheet.data.details.name || '(sem nome)'
  const avatar = sheet.data.details.avatar
  const fallbackLabel = sheet.data.details.kind === 'npc' ? 'NPC' : 'MON'
  const cr = sheet.data.traits.challengeRating.trim()
  const meta = cr ? `ND ${cr}` : null
  const campaignName = sheet.data.campaignName
  const campaignId = sheet.data.campaignId

  return (
    <li className={`${styles.sheetItem} ${selection.selected ? styles.sheetItemSelected : ''}`}>
      <SheetCardBody href={`/monstro/${sheet.id}`} name={name} {...selection}>
        <SheetThumbnail avatar={avatar} alt={`Avatar de ${name}`} fallbackLabel={fallbackLabel} />
        <span className={styles.sheetText}>
          <span className={styles.sheetName}>{name}</span>
          {meta && <span className={styles.sheetMeta}>{meta}</span>}
          {campaignName && (
            <span className={styles.campaignBadge}>
              ♜ {campaignName}
            </span>
          )}
        </span>
      </SheetCardBody>
      {!selection.selectable && (
        <div className={styles.sheetActions}>
          <SheetActionsMenu
            onExport={onExport}
            onDelete={onDelete}
            onLinkToCampaign={onLink}
            linkToCampaignLabel={campaignId ? 'Gerenciar Vínculo com Mesa' : 'Vincular à Mesa'}
          />
        </div>
      )}
    </li>
  )
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
  const [showSrdPicker, setShowSrdPicker] = useState(false)
  const [typeFilter, setTypeFilter] = useState<SheetTypeFilter>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')

  const [importFeedback, setImportFeedback] = useState<FeedbackSummary | null>(null)
  const [importProgress, setImportProgress] = useState<{
    done: number
    total: number
    fileName: string
  } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SheetDeleteTarget[] | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [deleteProgress, setDeleteProgress] = useState<{
    done: number
    total: number
    name: string
  } | null>(null)
  const [linkingSheet, setLinkingSheet] = useState<{
    type: 'character' | 'monster' | 'npc'
    id: string
    name: string
    data: any
    campaignId?: string | null
    campaignName?: string | null
  } | null>(null)
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

  async function handleCreateMonsterFromSrd(template: SrdMonsterTemplate) {
    if (!uid) return
    try {
      const stored = await createMonsterSheet(uid, template.data)
      setShowSrdPicker(false)
      navigate(`/monstro/${stored.id}`, {
        state: { startEditing: true },
      })
    } catch (err) {
      console.error('Erro ao criar monstro/NPC a partir do SRD:', err)
    }
  }

  function characterTarget(sheet: StoredCharacterSheet): SheetDeleteTarget {
    return {
      type: 'character',
      id: sheet.id,
      name: sheet.data.character.name,
      campaignId: sheet.data.campaignId,
    }
  }

  function monsterTarget(monster: StoredMonsterSheet): SheetDeleteTarget {
    return {
      type: 'monster',
      id: monster.id,
      name: monster.data.details.name,
      campaignId: monster.data.campaignId,
    }
  }

  /** Fichas visíveis agora (depois de busca e filtros), na ordem da tela. */
  function visibleTargets(): SheetDeleteTarget[] {
    return visibleBuckets.flatMap((bucket) => [
      ...bucket.characters.map(characterTarget),
      ...bucket.monsters.map(monsterTarget),
      ...bucket.npcs.map(monsterTarget),
    ])
  }

  function toggleSelected(target: SheetDeleteTarget) {
    const key = sheetKey(target.type, target.id)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function startSelection() {
    setImportFeedback(null)
    setSelectedKeys(new Set())
    setSelectionMode(true)
  }

  function exitSelection() {
    setSelectionMode(false)
    setSelectedKeys(new Set())
  }

  const visibleKeys = visibleTargets().map((t) => sheetKey(t.type, t.id))
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key))

  function toggleSelectAllVisible() {
    setSelectedKeys(allVisibleSelected ? new Set() : new Set(visibleKeys))
  }

  function requestDeleteSelected() {
    // Resolve a partir das listas atuais: uma ficha excluída em outra aba some daqui.
    const targets = [
      ...sheets.map(characterTarget),
      ...monsters.map(monsterTarget),
    ].filter((t) => selectedKeys.has(sheetKey(t.type, t.id)))
    if (targets.length > 0) setPendingDelete(targets)
  }

  async function confirmDelete() {
    if (!pendingDelete || !uid) return
    const targets = pendingDelete
    setPendingDelete(null)
    setImportFeedback(null)

    if (targets.length > 1) {
      setDeleteProgress({ done: 0, total: targets.length, name: targets[0].name })
    }
    try {
      const outcomes = await deleteSheets(uid, targets, (done, total, current) => {
        if (total > 1) setDeleteProgress({ done, total, name: current.name })
      })
      setImportFeedback(summarizeDelete(outcomes))
      if (selectionMode) exitSelection()
    } finally {
      setDeleteProgress(null)
    }
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

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    // Copia a lista antes de limpar o input: FileList é viva e esvazia junto.
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0 || !uid || importProgress) return

    setImportFeedback(null)
    setImportProgress({ done: 0, total: files.length, fileName: files[0].name })

    try {
      const outcomes = await importSheetFiles(uid, files, (done, total, current) =>
        setImportProgress({ done, total, fileName: current.name }),
      )
      setImportFeedback(summarizeImport(outcomes))
    } finally {
      setImportProgress(null)
    }
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
            onDelete={() => setPendingDelete([characterTarget(sheet)])}
            selectable={selectionMode}
            selected={selectedKeys.has(sheetKey('character', sheet.id))}
            onToggleSelect={() => toggleSelected(characterTarget(sheet))}
            onLink={() =>
              setLinkingSheet({
                type: 'character',
                id: sheet.id,
                name: sheet.data.character.name,
                data: sheet.data,
                campaignId: sheet.data.campaignId,
                campaignName: sheet.data.campaignName,
              })
            }
          />
        ))}
        {bucket.monsters.map((monster) => (
          <MonsterSheetItem
            key={`mon-${monster.id}`}
            sheet={monster}
            onExport={() => handleExportMonster(monster)}
            onDelete={() => setPendingDelete([monsterTarget(monster)])}
            selectable={selectionMode}
            selected={selectedKeys.has(sheetKey('monster', monster.id))}
            onToggleSelect={() => toggleSelected(monsterTarget(monster))}
            onLink={() =>
              setLinkingSheet({
                type: 'monster',
                id: monster.id,
                name: monster.data.details.name,
                data: monster.data,
                campaignId: monster.data.campaignId,
                campaignName: monster.data.campaignName,
              })
            }
          />
        ))}
        {bucket.npcs.map((npc) => (
          <MonsterSheetItem
            key={`npc-${npc.id}`}
            sheet={npc}
            onExport={() => handleExportMonster(npc)}
            onDelete={() => setPendingDelete([monsterTarget(npc)])}
            selectable={selectionMode}
            selected={selectedKeys.has(sheetKey('monster', npc.id))}
            onToggleSelect={() => toggleSelected(monsterTarget(npc))}
            onLink={() =>
              setLinkingSheet({
                type: 'npc',
                id: npc.id,
                name: npc.data.details.name,
                data: npc.data,
                campaignId: npc.data.campaignId,
                campaignName: npc.data.campaignName,
              })
            }
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
        multiple
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
              onClick={selectionMode ? exitSelection : startSelection}
              aria-pressed={selectionMode}
              disabled={deleteProgress !== null}
            >
              {selectionMode ? 'Cancelar seleção' : '☐ Selecionar'}
            </button>
            <button
              type="button"
              className={styles.tertiaryAction}
              onClick={handleImportClick}
              disabled={importProgress !== null}
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
              className={styles.tertiaryAction}
              onClick={() => setShowSrdPicker(true)}
            >
              Monstro do SRD
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

      {selectionMode && (
        <div className={styles.selectionBar} role="toolbar" aria-label="Ações da seleção">
          <span className={styles.selectionCount} aria-live="polite">
            {selectedKeys.size === 0
              ? 'Toque nas fichas para selecionar'
              : selectedKeys.size === 1
                ? '1 ficha selecionada'
                : `${selectedKeys.size} fichas selecionadas`}
          </span>
          <div className={styles.selectionActions}>
            <button
              type="button"
              className={styles.tertiaryAction}
              onClick={toggleSelectAllVisible}
              disabled={visibleKeys.length === 0}
            >
              {allVisibleSelected ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
            <button
              type="button"
              className={styles.confirmDangerBtn}
              onClick={requestDeleteSelected}
              disabled={selectedKeys.size === 0}
            >
              Excluir selecionadas
            </button>
          </div>
        </div>
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
        <div
          className={importFeedback.tone === 'error' ? styles.feedbackError : styles.feedbackOk}
          role="status"
        >
          <p className={styles.feedbackMessage}>{importFeedback.message}</p>
          {importFeedback.problems.length > 0 && (
            <ul className={styles.feedbackProblems}>
              {importFeedback.problems.map((problem, index) => (
                <li key={`${problem.fileName}-${index}`}>
                  <span className={styles.feedbackFile}>{problem.fileName}</span>: {problem.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {deleteProgress && (
        <div className={styles.importOverlay} aria-busy="true">
          <div className={styles.importCard}>
            <DiceRollLoader
              label={`Excluindo ${deleteProgress.done + 1} de ${deleteProgress.total}`}
              detail={deleteProgress.name || '(sem nome)'}
            />
          </div>
        </div>
      )}

      {importProgress && (
        <div className={styles.importOverlay} aria-busy="true">
          <div className={styles.importCard}>
            <DiceRollLoader
              label={
                importProgress.total > 1
                  ? `Importando ${importProgress.done + 1} de ${importProgress.total}`
                  : 'Importando ficha'
              }
              detail={importProgress.fileName}
            />
          </div>
        </div>
      )}

      {showSrdPicker && uid && (
        <SrdMonsterPicker
          onSelect={handleCreateMonsterFromSrd}
          onClose={() => setShowSrdPicker(false)}
        />
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
              {pendingDelete.length === 1
                ? `Excluir "${pendingDelete[0].name || '(sem nome)'}" permanentemente?`
                : `Excluir ${pendingDelete.length} fichas permanentemente?`}
            </p>
            {pendingDelete.length > 1 && (
              <ul className={styles.dialogList}>
                {pendingDelete.slice(0, 6).map((target) => (
                  <li key={sheetKey(target.type, target.id)}>{target.name || '(sem nome)'}</li>
                ))}
                {pendingDelete.length > 6 && <li>e mais {pendingDelete.length - 6}</li>}
              </ul>
            )}
            {pendingDelete.some((target) => target.campaignId) && (
              <p className={styles.dialogNote}>
                {pendingDelete.length === 1 ? 'Ela está' : 'Algumas estão'} numa mesa e{' '}
                {pendingDelete.length === 1 ? 'será retirada' : 'serão retiradas'} de lá também.
              </p>
            )}
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

      {linkingSheet && uid && (
        <LinkToCampaignModal
          userId={uid}
          sheetType={linkingSheet.type}
          sheetId={linkingSheet.id}
          sheetName={linkingSheet.name}
          sheetData={linkingSheet.data}
          currentCampaignId={linkingSheet.campaignId}
          currentCampaignName={linkingSheet.campaignName}
          onClose={() => setLinkingSheet(null)}
        />
      )}
    </div>
  )
}
