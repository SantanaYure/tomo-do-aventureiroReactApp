// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { CharacterSheet } from '../../types/system/dnd'
import {
  saveCharacterSheet,
  deleteCharacterSheet,
  exportCharacterSheetAsJSON,
  parseUntrustedCharacterSheet,
  type StoredCharacterSheet,
} from '../../store/characterSheetStore'
import { normalizeFileName, downloadJsonFile } from '../../utils/exportSheet'
import { recordOpened } from '../../utils/recentlyOpened'
import { applyRestToCharacterSheet, calcEffectiveHpMaxForRest, hasWarlockClass } from '../../utils/restRules'
import { useAuth } from '../../context/AuthContext'
import { useCharacterSheet } from '../../hooks/useCharacterSheet'
import { CharacterHeader } from '../../components/CharacterHeader/CharacterHeader'
import { AttributesPanel } from '../../components/AttributesPanel/AttributesPanel'
import { SkillsPanel } from '../../components/SkillsPanel/SkillsPanel'
import { CombatPanel } from '../../components/CombatPanel/CombatPanel'
import { ResourcesPanel } from '../../components/ResourcesPanel/ResourcesPanel'
import { AttacksPanel } from '../../components/AttacksPanel/AttacksPanel'
import { SpellsPanel } from '../../components/SpellsPanel/SpellsPanel'
import { InventoryPanel } from '../../components/InventoryPanel/InventoryPanel'
import { CharacterDetailsPanel } from '../../components/CharacterDetailsPanel/CharacterDetailsPanel'
import { CharacterTableMode } from '../../components/CharacterTableMode/CharacterTableMode'
import { CharacterCombatSummary } from '../../components/CharacterCombatSummary/CharacterCombatSummary'
import { ShortRestModal } from '../../components/ShortRestModal/ShortRestModal'
import { GroupManagerModal } from '../../components/GroupManagerModal/GroupManagerModal'
import { SheetActionsMenu } from '../../components/SheetActionsMenu/SheetActionsMenu'
import { SheetNotices } from '../../components/SheetNotices/SheetNotices'
import { SheetTabs } from '../../components/SheetTabs/SheetTabs'
import { useSheetGroups } from '../../hooks/useSheetGroups'
import { useSheetAutosave } from '../../hooks/useSheetAutosave'
import { SAVING_STATUS_LABELS } from '../../types/savingStatus'
import styles from './CharacterSheetPage.module.css'

const TABS = [
  'Mesa',
  'Principal',
  'Combate',
  'Magias',
  'Habilidades',
  'Inventário',
  'Detalhes',
] as const

type Tab = (typeof TABS)[number]

const DEFAULT_TAB: Tab = 'Principal'

const TAB_PANEL_IDS: Record<Tab, string> = {
  Mesa: 'character-sheet-panel-mesa',
  Principal: 'character-sheet-panel-principal',
  Combate: 'character-sheet-panel-combate',
  Magias: 'character-sheet-panel-magias',
  Habilidades: 'character-sheet-panel-habilidades',
  Inventário: 'character-sheet-panel-inventario',
  Detalhes: 'character-sheet-panel-detalhes',
}

const TAB_BUTTON_IDS: Record<Tab, string> = {
  Mesa: 'character-sheet-tab-mesa',
  Principal: 'character-sheet-tab-principal',
  Combate: 'character-sheet-tab-combate',
  Magias: 'character-sheet-tab-magias',
  Habilidades: 'character-sheet-tab-habilidades',
  Inventário: 'character-sheet-tab-inventario',
  Detalhes: 'character-sheet-tab-detalhes',
}

function getTabStorageKey(id?: string) {
  return `character-sheet-active-tab:${id ?? 'default'}`
}

function isTab(value: string | null): value is Tab {
  return value !== null && TABS.some((tab) => tab === value)
}

function readStoredTab(id?: string): Tab {
  if (typeof window === 'undefined') {
    return DEFAULT_TAB
  }

  const storedTab = window.sessionStorage.getItem(getTabStorageKey(id))

  if (storedTab === 'Recursos') {
    return 'Habilidades'
  }

  return isTab(storedTab) ? storedTab : DEFAULT_TAB
}

export function CharacterSheetPage() {
  const { uid } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sheet: storedSheet, notFound, error } = useCharacterSheet(uid, id ?? null)
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
    remoteChangedElsewhere,
    dismissRemoteChange,
  } = useSheetAutosave<CharacterSheet>({
    uid,
    id: id ?? null,
    remote: storedSheet,
    scope: 'pj',
    save: saveCharacterSheet,
    parseDraft: parseUntrustedCharacterSheet,
  })
  const [activeTab, setActiveTab] = useState<Tab>(() => readStoredTab(id))
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [restFeedback, setRestFeedback] = useState<string | null>(null)
  const [showShortRestModal, setShowShortRestModal] = useState(false)
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
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasSheet])

  useEffect(() => {
    setActiveTab(readStoredTab(id))
  }, [id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(getTabStorageKey(id), activeTab)
  }, [activeTab, id])

  useEffect(() => {
    if (!sheet) return
    const name = sheet.character.name.trim()
    document.title = name || 'Tomo do Aventureiro'
    return () => { document.title = 'Tomo do Aventureiro' }
  }, [sheet?.character.name])

  useEffect(() => {
    return () => {
      if (restFeedbackTimerRef.current) clearTimeout(restFeedbackTimerRef.current)
    }
  }, [])

  // A persistência (debounce + teto de espera + rascunho local + histórico)
  // vive em `useSheetAutosave`.
  //
  // Todos os handlers abaixo usam a forma funcional de `commit`, que lê a ficha
  // atual de uma ref. Isso os torna estáveis entre renders — condição para que
  // o `memo` dos painéis realmente aborte o render. Um handler recriado a cada
  // render invalida a comparação rasa e anula a memoização.
  const handleUpdate = commit

  const handleCharacterChange = useCallback(
    (updated: CharacterSheet['character']) => {
      commit((current) => ({ ...current, character: updated }))
    },
    [commit],
  )

  const handleChangeAttacks = useCallback(
    (updated: CharacterSheet['attacks']) => {
      commit((current) => ({ ...current, attacks: updated }))
    },
    [commit],
  )

  const handleChangeSpells = useCallback(
    (updated: CharacterSheet['spells']) => {
      commit((current) => ({ ...current, spells: updated }))
    },
    [commit],
  )

  const handleChangeSpellSlots = useCallback(
    (updated: CharacterSheet['spellSlots']) => {
      commit((current) => ({ ...current, spellSlots: updated }))
    },
    [commit],
  )

  const handleChangeResources = useCallback(
    (updated: CharacterSheet['resources']) => {
      commit((current) => ({ ...current, resources: updated }))
    },
    [commit],
  )

  const handleChangeInventory = useCallback(
    (updated: CharacterSheet['inventory']) => {
      commit((current) => ({ ...current, inventory: updated }))
    },
    [commit],
  )

  const handleToggleEditMode = useCallback(() => {
    commit((current) => ({ ...current, isEditMode: !current.isEditMode }))
  }, [commit])

  const handleGroupChange = useCallback(
    (nextGroupId: string) => {
      commit((current) => ({ ...current, groupId: nextGroupId }))
    },
    [commit],
  )

  const handleOpenGroupManager = useCallback(() => setShowGroupManager(true), [])
  const handleShortRest = useCallback(() => setShowShortRestModal(true), [])

  const showRestFeedback = useCallback((message: string) => {
    if (restFeedbackTimerRef.current) clearTimeout(restFeedbackTimerRef.current)
    setRestFeedback(message)
    restFeedbackTimerRef.current = setTimeout(() => setRestFeedback(null), 2000)
  }, [])

  const handleShortRestConfirm = useCallback(
    (hpHealed: number, diceSpent: number) => {
      setShowShortRestModal(false)
      let warlock = false
      commit((current) => {
        const rested = applyRestToCharacterSheet(current, 'short')
        const hpMax = calcEffectiveHpMaxForRest(rested.character)
        warlock = hasWarlockClass(rested.character.classes)
        return {
          ...rested,
          character: {
            ...rested.character,
            hpCurrent: Math.min(hpMax, rested.character.hpCurrent + hpHealed),
            hitDiceSpent: (rested.character.hitDiceSpent ?? 0) + diceSpent,
          },
        }
      })
      if (diceSpent > 0) {
        showRestFeedback(
          warlock
            ? `Descanso curto: +${hpHealed} PV | Espaços de bruxo restaurados`
            : `Descanso curto: +${hpHealed} PV recuperados`,
        )
      } else {
        showRestFeedback(
          warlock
            ? 'Recursos restaurados — Bruxo recuperou os espaços de magia'
            : 'Recursos restaurados (descanso curto)',
        )
      }
    },
    [commit, showRestFeedback],
  )

  const handleLongRest = useCallback(() => {
    commit((current) => applyRestToCharacterSheet(current, 'long'))
    showRestFeedback('Recursos e espaços de magia restaurados (descanso longo)')
  }, [commit, showRestFeedback])

  function handleExport() {
    if (!sheet || !storedSheet || !id) return
    const stored: StoredCharacterSheet = { ...storedSheet, data: sheet }
    const json = exportCharacterSheetAsJSON(stored)
    downloadJsonFile(json, normalizeFileName(sheet.character.name.trim() || id, id, 'pj'))
  }

  function handleRequestDelete() {
    setShowDeleteDialog(true)
  }

  async function handleConfirmDelete() {
    if (!uid || !id || isDeleting) return
    setIsDeleting(true)
    discardPending()
    try {
      await deleteCharacterSheet(uid, id)
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
          <h1>Ficha não encontrada</h1>
          <p>O registro pedido não foi localizado.</p>
          <button onClick={() => navigate('/')}>Ir para o início</button>
        </section>
      </div>
    )
  }

  if (!sheet) {
    return (
      <div className={styles.page}>
        <section className={styles.loading}>Abrindo o tomo e restaurando os dados do PJ...</section>
      </div>
    )
  }

  const currentSheet = sheet

  const activePanelId = TAB_PANEL_IDS[activeTab]

  function renderPrincipalTab() {
    return (
      <>
        <AttributesPanel
          character={currentSheet.character}
          isEditMode={currentSheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
        <SkillsPanel
          character={currentSheet.character}
          isEditMode={currentSheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
      </>
    )
  }

  function renderCombatTab() {
    return (
      <>
        <CombatPanel
          character={currentSheet.character}
          isEditMode={currentSheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
        <AttacksPanel
          attacks={currentSheet.attacks}
          character={currentSheet.character}
          isEditMode={currentSheet.isEditMode}
          onChangeAttacks={handleChangeAttacks}
        />
      </>
    )
  }

  function renderSpellsTab() {
    return (
      <SpellsPanel
        spells={currentSheet.spells}
        character={currentSheet.character}
        isEditMode={currentSheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
        onChangeSpells={handleChangeSpells}
        slotsData={currentSheet.spellSlots}
        onChangeSlotsData={handleChangeSpellSlots}
      />
    )
  }

  function renderResourcesTab() {
    return (
      <ResourcesPanel
        resources={currentSheet.resources}
        isEditMode={currentSheet.isEditMode}
        onChangeResources={handleChangeResources}
      />
    )
  }

  function renderInventoryTab() {
    return (
      <InventoryPanel
        inventory={currentSheet.inventory}
        character={currentSheet.character}
        isEditMode={currentSheet.isEditMode}
        onChangeInventory={handleChangeInventory}
        onChangeCharacter={handleCharacterChange}
      />
    )
  }

  function renderDetailsTab() {
    return (
      <CharacterDetailsPanel
        character={currentSheet.character}
        isEditMode={currentSheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
      />
    )
  }

  function renderActiveTab(tab: Tab) {
    switch (tab) {
      case 'Mesa':
        return (
          <CharacterTableMode
            sheet={currentSheet}
            onUpdate={handleUpdate}
          />
        )
      case 'Principal':
        return renderPrincipalTab()
      case 'Combate':
        return renderCombatTab()
      case 'Magias':
        return renderSpellsTab()
      case 'Habilidades':
        return renderResourcesTab()
      case 'Inventário':
        return renderInventoryTab()
      case 'Detalhes':
        return renderDetailsTab()
      default:
        return null
    }
  }

  return (
    <div className={styles.page} data-saving-status={savingStatus}>
      {showShortRestModal && (
        <ShortRestModal
          character={currentSheet.character}
          hpMax={calcEffectiveHpMaxForRest(currentSheet.character)}
          onConfirm={handleShortRestConfirm}
          onCancel={() => setShowShortRestModal(false)}
        />
      )}
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
            exportLabel="Exportar PJ"
            deleteLabel="Excluir PJ"
            disabled={!sheet || isDeleting}
          />
        </div>
      </div>

      <SheetNotices
        localBackupError={localBackupError}
        recoveredDraftAt={recoveredDraftAt}
        remoteChangedElsewhere={remoteChangedElsewhere}
        onSaveNow={saveNow}
        onDismissRecovery={dismissRecovery}
        onDismissRemoteChange={dismissRemoteChange}
      />

      <CharacterHeader
        character={currentSheet.character}
        isEditMode={currentSheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
        onShortRest={handleShortRest}
        onLongRest={handleLongRest}
        restFeedback={restFeedback}
        groups={groups}
        groupId={currentSheet.groupId ?? ''}
        onGroupChange={handleGroupChange}
        onManage={handleOpenGroupManager}
        isLoadingGroups={isLoadingGroups}
      />

      <div ref={tabBarRef} className={styles.tabBarShell}>
        <SheetTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabButtonIds={TAB_BUTTON_IDS}
          tabPanelIds={TAB_PANEL_IDS}
          ariaLabel="Seções da ficha"
          className={styles.tabBar}
          tabClassName={styles.tab}
          activeTabClassName={styles.tabActive}
        />
      </div>

      <div className={styles.combatSummary}>
        <CharacterCombatSummary
          character={currentSheet.character}
          onChangeCharacter={handleCharacterChange}
        />
      </div>

      <div
        id={TAB_PANEL_IDS[activeTab]}
        role="tabpanel"
        aria-labelledby={TAB_BUTTON_IDS[activeTab]}
        className={styles.tabContent}
      >
        {renderActiveTab(activeTab)}
      </div>
      <div className={styles.editToggleSlot}>
        <div
          className={isAtBottom ? styles.editToggleAnchored : styles.editToggle}
        >
          <button
            className={styles.editToggleButton}
            onClick={handleToggleEditMode}
            aria-controls={activePanelId}
          >
            {currentSheet.isEditMode ? '✓ Concluir edição' : '✎ Editar ficha'}
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
            aria-labelledby="delete-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="delete-sheet-title" className={styles.dialogTitle}>
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

