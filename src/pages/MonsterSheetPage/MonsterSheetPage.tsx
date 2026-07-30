import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MonsterActionsPanel } from '../../components/monster/MonsterActionsPanel/MonsterActionsPanel'
import { MonsterFeaturesPanel } from '../../components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel'
import { MonsterHeader } from '../../components/monster/MonsterHeader/MonsterHeader'
import { LegendaryActionsPanel } from '../../components/monster/LegendaryActionsPanel/LegendaryActionsPanel'
import { MonsterSpellsPanel } from '../../components/monster/MonsterSpellsPanel/MonsterSpellsPanel'
import { MonsterStatsPanel } from '../../components/monster/MonsterStatsPanel/MonsterStatsPanel'
import { MonsterTraitsPanel } from '../../components/monster/MonsterTraitsPanel/MonsterTraitsPanel'
import { MonsterTableMode } from '../../components/monster/MonsterTableMode/MonsterTableMode'
import { MonsterCombatSummary } from '../../components/monster/MonsterCombatSummary/MonsterCombatSummary'
import { GroupManagerModal } from '../../components/GroupManagerModal/GroupManagerModal'
import { SheetActionsMenu } from '../../components/SheetActionsMenu/SheetActionsMenu'
import { SheetNotices } from '../../components/SheetNotices/SheetNotices'
import { SheetTabs } from '../../components/SheetTabs/SheetTabs'
import { useSheetGroups } from '../../hooks/useSheetGroups'
import { useSheetAutosave } from '../../hooks/useSheetAutosave'
import type { DeepPartial } from '../../components/monster/shared'
import {
  saveMonsterSheet,
  deleteMonsterSheet,
  exportMonsterSheetAsJSON,
  parseUntrustedMonsterSheet,
  type StoredMonsterSheet,
} from '../../store/monsterSheetStore'
import { normalizeFileName, downloadJsonFile } from '../../utils/exportSheet'
import { applyRestToMonsterSheet } from '../../utils/restRules'
import { recordOpened } from '../../utils/recentlyOpened'
import { useAuth } from '../../context/AuthContext'
import { useMonsterSheet } from '../../hooks/useMonsterSheet'
import { SAVING_STATUS_LABELS } from '../../types/savingStatus'
import type { MonsterSheet } from '../../types/system/dnd/monsterSheet'
import styles from './MonsterSheetPage.module.css'

const TABS = ['Mesa', 'Detalhes', 'Combate', 'Habilidades e Ações', 'Magias', 'Lendárias'] as const

type Tab = (typeof TABS)[number]

// Abas legadas (sessionStorage de versões anteriores) → aba unificada
const LEGACY_TAB_ALIASES: Record<string, Tab> = {
  Habilidades: 'Habilidades e Ações',
  Ações: 'Habilidades e Ações',
}

type MonsterLocationState = {
  startEditing?: boolean
}

const DEFAULT_TAB: Tab = 'Detalhes'

const TAB_PANEL_IDS: Record<Tab, string> = {
  Mesa: 'monster-sheet-panel-mesa',
  Detalhes: 'monster-sheet-panel-detalhes',
  Combate: 'monster-sheet-panel-combate',
  'Habilidades e Ações': 'monster-sheet-panel-habilidades-acoes',
  Magias: 'monster-sheet-panel-magias',
  Lendárias: 'monster-sheet-panel-lendarias',
}

const TAB_BUTTON_IDS: Record<Tab, string> = {
  Mesa: 'monster-sheet-tab-mesa',
  Detalhes: 'monster-sheet-tab-detalhes',
  Combate: 'monster-sheet-tab-combate',
  'Habilidades e Ações': 'monster-sheet-tab-habilidades-acoes',
  Magias: 'monster-sheet-tab-magias',
  Lendárias: 'monster-sheet-tab-lendarias',
}

function getTabStorageKey(id?: string) {
  return `monster-sheet-active-tab:${id ?? 'default'}`
}

function isTab(value: string | null): value is Tab {
  return value !== null && TABS.some((tab) => tab === value)
}

function readStoredTab(id?: string): Tab {
  if (typeof window === 'undefined') {
    return DEFAULT_TAB
  }

  const storedTab = window.sessionStorage.getItem(getTabStorageKey(id))

  if (isTab(storedTab)) {
    return storedTab
  }

  if (storedTab !== null && storedTab in LEGACY_TAB_ALIASES) {
    return LEGACY_TAB_ALIASES[storedTab]
  }

  return DEFAULT_TAB
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeDeepPatch<T>(current: T, patch: DeepPartial<T>): T {
  if (Array.isArray(patch)) {
    return patch as T
  }

  if (!isRecord(current) || !isRecord(patch)) {
    return patch as T
  }

  const next = { ...current } as Record<string, unknown>

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue
    }

    const currentValue = next[key]

    if (Array.isArray(value)) {
      next[key] = value
      continue
    }

    if (isRecord(currentValue) && isRecord(value)) {
      next[key] = mergeDeepPatch(currentValue, value)
      continue
    }

    next[key] = value
  }

  return next as T
}

export function MonsterSheetPage() {
  const { uid } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { monster: storedMonster, notFound, error } = useMonsterSheet(uid, id ?? null)
  const {
    sheet,
    commit,
    savingStatus,
    saveNow,
    discardPending,
    undo,
    redo,
    canUndo,
    canRedo,
    recoveredDraftAt,
    dismissRecovery,
    localBackupError,
  } = useSheetAutosave<MonsterSheet>({
    uid,
    id: id ?? null,
    remote: storedMonster,
    scope: 'monstro',
    save: saveMonsterSheet,
    parseDraft: parseUntrustedMonsterSheet,
  })
  const [activeTab, setActiveTab] = useState<Tab>(() => readStoredTab(id))
  const [isEditing, setIsEditing] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [restFeedback, setRestFeedback] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showGroupManager, setShowGroupManager] = useState(false)
  const { groups, isLoading: isLoadingGroups } = useSheetGroups(uid)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const restFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSheet = sheet !== null

  // Registra abertura da ficha para a lista de recentes
  useEffect(() => {
    if (id) recordOpened(id)
  }, [id])

  useEffect(() => {
    if (!hasSheet) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsAtBottom(entry.isIntersecting),
      { threshold: 0 },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasSheet])

  useEffect(() => {
    const locationState = location.state as MonsterLocationState | null
    setIsEditing(Boolean(locationState?.startEditing))
  }, [id, location.state])

  useEffect(() => {
    setActiveTab(readStoredTab(id))
  }, [id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(getTabStorageKey(id), activeTab)
  }, [activeTab, id])

  useEffect(() => {
    return () => {
      if (restFeedbackTimerRef.current) clearTimeout(restFeedbackTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!sheet) return
    const name = sheet.details.name.trim()
    document.title = name || 'Tomo do Aventureiro'
    return () => { document.title = 'Tomo do Aventureiro' }
  }, [sheet?.details.name])

  // A persistência (debounce + teto de espera + rascunho local + histórico)
  // vive em `useSheetAutosave`.
  //
  // Estável entre renders (a forma funcional de `commit` lê a ficha de uma ref):
  // é o que permite ao `memo` do resumo de combate abortar o render quando a
  // edição foi em outro painel.
  const handleSheetChange = useCallback(
    (patch: DeepPartial<MonsterSheet>) => {
      commit((current) => mergeDeepPatch(current, patch))
    },
    [commit],
  )

  function showRestFeedback(message: string) {
    if (restFeedbackTimerRef.current) clearTimeout(restFeedbackTimerRef.current)
    setRestFeedback(message)
    restFeedbackTimerRef.current = setTimeout(() => setRestFeedback(null), 2000)
  }

  function handleExport() {
    if (!sheet || !storedMonster || !id) return
    const stored: StoredMonsterSheet = { ...storedMonster, data: sheet }
    const json = exportMonsterSheetAsJSON(stored)
    const prefix = sheet.details.kind === 'npc' ? 'npc' : 'monstro'
    downloadJsonFile(json, normalizeFileName(sheet.details.name.trim() || id, id, prefix))
  }

  function handleShortRest() {
    if (!sheet) return
    handleSheetChange(applyRestToMonsterSheet(sheet, 'short'))
    showRestFeedback('Recursos restaurados (descanso curto)')
  }

  function handleLongRest() {
    if (!sheet) return
    handleSheetChange(applyRestToMonsterSheet(sheet, 'long'))
    showRestFeedback('Recursos restaurados (descanso longo)')
  }

  function handleToggleEditMode() {
    setIsEditing((previous) => !previous)
  }

  function handleRequestDelete() {
    setShowDeleteDialog(true)
  }

  async function handleConfirmDelete() {
    if (!uid || !id || isDeleting) return
    setIsDeleting(true)
    discardPending()
    try {
      await deleteMonsterSheet(uid, id)
      setShowDeleteDialog(false)
      navigate('/')
    } catch (deleteError) {
      console.error('Erro ao excluir ficha:', deleteError)
      setIsDeleting(false)
    }
  }

  function handleTabChange(tab: Tab) {
    if (tab === activeTab) return

    setActiveTab(tab)

    const tabBar = tabBarRef.current
    if (!tabBar) return

    const nextTop = tabBar.getBoundingClientRect().top + window.scrollY

    window.scrollTo({
      top: Math.max(0, nextTop - 12),
      behavior: 'smooth',
    })
  }

  if (error) {
    return (
      <div className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Erro ao carregar ficha</h1>
          <p>Não foi possível carregar os dados. Verifique sua conexão.</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </section>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Ficha de monstro não encontrada</h1>
          <p>O registro pedido não foi localizado.</p>
          <button onClick={() => navigate('/')}>Ir para o início</button>
        </section>
      </div>
    )
  }

  if (!sheet) {
    return (
      <div className={styles.page}>
        <section className={styles.loading}>Abrindo o tomo e restaurando os dados do monstro...</section>
      </div>
    )
  }

  const currentSheet = sheet

  function renderDetailsTab() {
    return (
      <MonsterHeader
        sheet={currentSheet}
        isEditing={isEditing}
        onChange={handleSheetChange}
        groups={groups}
        groupId={currentSheet.groupId ?? ''}
        onGroupChange={(nextGroupId) => handleSheetChange({ groupId: nextGroupId })}
        onManage={() => setShowGroupManager(true)}
        isLoadingGroups={isLoadingGroups}
      />
    )
  }

  function renderCombatTab() {
    return (
      <>
        <MonsterStatsPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
        <MonsterTraitsPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
      </>
    )
  }

  function renderFeaturesAndActionsTab() {
    return (
      <>
        <MonsterFeaturesPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
        <MonsterActionsPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
      </>
    )
  }

  function renderSpellsTab() {
    return <MonsterSpellsPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderLegendaryTab() {
    if (!isEditing && currentSheet.legendary.actions.length === 0) {
      return <p className={styles.emptyTab}>Este monstro não possui ações lendárias.</p>
    }

    return <LegendaryActionsPanel sheet={currentSheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderActiveTab(tab: Tab) {
    switch (tab) {
      case 'Mesa':
        return (
          <MonsterTableMode
            sheet={currentSheet}
            onChange={handleSheetChange}
          />
        )
      case 'Detalhes':
        return renderDetailsTab()
      case 'Combate':
        return renderCombatTab()
      case 'Habilidades e Ações':
        return renderFeaturesAndActionsTab()
      case 'Magias':
        return renderSpellsTab()
      case 'Lendárias':
        return renderLegendaryTab()
      default:
        return null
    }
  }

  const activePanelId = TAB_PANEL_IDS[activeTab]

  return (
    <div className={styles.page} data-saving-status={savingStatus}>
      <div className={styles.topBar}>
        <Link className={styles.backLink} to="/">← Voltar</Link>
        <div className={styles.topBarActions}>
          <div className={styles.historyControls}>
            <button
              type="button"
              className={styles.historyButton}
              onClick={undo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              aria-label="Desfazer última alteração"
            >
              ↶ Desfazer
            </button>
            <button
              type="button"
              className={styles.historyButton}
              onClick={redo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Shift+Z)"
              aria-label="Refazer alteração desfeita"
            >
              ↷ Refazer
            </button>
          </div>
          {savingStatus !== 'idle' && (
            <span
              className={styles.savingIndicator}
              data-status={savingStatus}
              role="status"
              aria-live="polite"
            >
              {SAVING_STATUS_LABELS[savingStatus]}
              {savingStatus === 'error' && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={saveNow}
                >
                  Tentar novamente
                </button>
              )}
            </span>
          )}
          <SheetActionsMenu
            onExport={handleExport}
            onDelete={handleRequestDelete}
            exportLabel={currentSheet.details.kind === 'npc' ? 'Exportar NPC' : 'Exportar Monstro'}
            deleteLabel={currentSheet.details.kind === 'npc' ? 'Excluir NPC' : 'Excluir Monstro'}
            disabled={!sheet || isDeleting}
          />
        </div>
      </div>

      <SheetNotices
        localBackupError={localBackupError}
        recoveredDraftAt={recoveredDraftAt}
        onSaveNow={saveNow}
        onDismissRecovery={dismissRecovery}
      />
      <div ref={tabBarRef} className={styles.tabBarShell}>
        <SheetTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabButtonIds={TAB_BUTTON_IDS}
          tabPanelIds={TAB_PANEL_IDS}
          ariaLabel="Seções da ficha de monstro"
          className={styles.tabBar}
          tabClassName={styles.tab}
          activeTabClassName={styles.tabActive}
        />
      </div>

      <div className={styles.restBar}>
        <button type="button" className={styles.restButton} onClick={handleShortRest}>
          Descanso curto
        </button>
        <button type="button" className={styles.restButton} onClick={handleLongRest}>
          Descanso longo
        </button>
        <span aria-live="polite" aria-atomic="true" className={styles.restFeedback}>
          {restFeedback}
        </span>
      </div>

      <MonsterCombatSummary
        stats={currentSheet.stats}
        traits={currentSheet.traits}
        onChange={handleSheetChange}
      />

      <div
        id={TAB_PANEL_IDS[activeTab]}
        role="tabpanel"
        aria-labelledby={TAB_BUTTON_IDS[activeTab]}
        className={styles.tabContent}
      >
        {renderActiveTab(activeTab)}
      </div>

      <div className={styles.editToggleSlot}>
        <div className={isAtBottom ? styles.editToggleAnchored : styles.editToggle}>
          <button
            className={styles.editToggleButton}
            onClick={handleToggleEditMode}
            aria-controls={activePanelId}
          >
            {isEditing ? '✓ Concluir edição' : '✎ Editar ficha'}
          </button>
        </div>
      </div>

      <div className={styles.editToggleSentinel} ref={sentinelRef} />

      {showGroupManager && uid && (
        <GroupManagerModal
          uid={uid}
          groups={groups}
          onClose={() => setShowGroupManager(false)}
        />
      )}

      {showDeleteDialog && (
        <div
          className={styles.dialogOverlay}
          onClick={() => { if (!isDeleting) setShowDeleteDialog(false) }}
          role="presentation"
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-monster-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="delete-monster-title" className={styles.dialogTitle}>
              Tem certeza que deseja excluir esta ficha? Essa ação não pode ser desfeita.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
              <button
                type="button"
                className={styles.cancelDeleteBtn}
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
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

