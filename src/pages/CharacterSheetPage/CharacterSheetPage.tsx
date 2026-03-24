// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { CharacterSheet } from '../../types/system/dnd'
import { saveCharacterSheet } from '../../store/characterSheetStore'
import { recordOpened } from '../../utils/recentlyOpened'
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
import type { SavingStatus } from '../../types/savingStatus'
import styles from './CharacterSheetPage.module.css'

type SheetWithSlots = CharacterSheet & {
  spellSlots?: Record<number, { current: number; max: number }>
}

const TABS = [
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
  Principal: 'character-sheet-panel-principal',
  Combate: 'character-sheet-panel-combate',
  Magias: 'character-sheet-panel-magias',
  Habilidades: 'character-sheet-panel-habilidades',
  Inventário: 'character-sheet-panel-inventario',
  Detalhes: 'character-sheet-panel-detalhes',
}

const TAB_BUTTON_IDS: Record<Tab, string> = {
  Principal: 'character-sheet-tab-principal',
  Combate: 'character-sheet-tab-combate',
  Magias: 'character-sheet-tab-magias',
  Habilidades: 'character-sheet-tab-habilidades',
  Inventário: 'character-sheet-tab-inventario',
  Detalhes: 'character-sheet-tab-detalhes',
}

const SAVE_DEBOUNCE_MS = 800

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
  const [sheet, setSheet] = useState<SheetWithSlots | null>(null)
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle')
  const [activeTab, setActiveTab] = useState<Tab>(() => readStoredTab(id))
  const [isAtBottom, setIsAtBottom] = useState(false)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSheet = sheet !== null

  function updateSavingStatus(nextStatus: SavingStatus) {
    setSavingStatus((currentStatus) =>
      currentStatus === nextStatus ? currentStatus : nextStatus
    )
  }

  // Registra abertura da ficha para a lista de recentes
  useEffect(() => {
    if (id) recordOpened(id)
  }, [id])

  // Sync Firestore snapshot → local state (only on first load)
  useEffect(() => {
    if (storedSheet && sheet === null) {
      setSheet(storedSheet.data as SheetWithSlots)
    }
  }, [storedSheet, sheet])

  useEffect(() => {
    updateSavingStatus('idle')
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  function handleUpdate(updated: SheetWithSlots) {
    if (!id || !uid) return
    setSheet(updated)
    updateSavingStatus('saving')

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveCharacterSheet(uid, id, updated).catch(console.error)
    }, SAVE_DEBOUNCE_MS)
  }

  function handleToggleEditMode() {
    if (!sheet) return
    handleUpdate({ ...sheet, isEditMode: !sheet.isEditMode })
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
      <main className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Erro ao carregar ficha</h1>
          <p>Não foi possível carregar os dados. Verifique sua conexão.</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </section>
      </main>
    )
  }

  if (notFound) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Ficha não encontrada</h1>
          <p>O registro pedido não foi localizado.</p>
          <button onClick={() => navigate('/')}>Ir para o início</button>
        </section>
      </main>
    )
  }

  if (!sheet) {
    return (
      <main className={styles.page}>
        <section className={styles.loading}>Abrindo o tomo e restaurando os dados do personagem...</section>
      </main>
    )
  }

  const spellSlots = sheet.spellSlots ?? {}

  const handleCharacterChange = (updated: SheetWithSlots['character']) => {
    handleUpdate({ ...sheet, character: updated })
  }

  const activePanelId = TAB_PANEL_IDS[activeTab]

  function renderPrincipalTab() {
    return (
      <>
        <AttributesPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
        <SkillsPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
      </>
    )
  }

  function renderCombatTab() {
    return (
      <>
        <CombatPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={handleCharacterChange}
        />
        <AttacksPanel
          attacks={sheet.attacks}
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeAttacks={(updated) =>
            handleUpdate({ ...sheet, attacks: updated })
          }
        />
      </>
    )
  }

  function renderSpellsTab() {
    return (
      <SpellsPanel
        spells={sheet.spells}
        character={sheet.character}
        isEditMode={sheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
        onChangeSpells={(updated) => handleUpdate({ ...sheet, spells: updated })}
        slotsData={spellSlots}
        onChangeSlotsData={(updated) =>
          handleUpdate({ ...sheet, spellSlots: updated })
        }
      />
    )
  }

  function renderResourcesTab() {
    return (
      <ResourcesPanel
        resources={sheet.resources}
        isEditMode={sheet.isEditMode}
        onChangeResources={(updated) =>
          handleUpdate({ ...sheet, resources: updated })
        }
      />
    )
  }

  function renderInventoryTab() {
    return (
      <InventoryPanel
        inventory={sheet.inventory}
        character={sheet.character}
        isEditMode={sheet.isEditMode}
        onChangeInventory={(updated) =>
          handleUpdate({ ...sheet, inventory: updated })
        }
        onChangeCharacter={handleCharacterChange}
      />
    )
  }

  function renderDetailsTab() {
    return (
      <CharacterDetailsPanel
        character={sheet.character}
        isEditMode={sheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
      />
    )
  }

  function renderActiveTab(tab: Tab) {
    switch (tab) {
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
    <main className={styles.page} data-saving-status={savingStatus}>
      <Link className={styles.backLink} to="/">← Voltar</Link>

      <CharacterHeader
        character={sheet.character}
        isEditMode={sheet.isEditMode}
        onChangeCharacter={handleCharacterChange}
      />

      <div ref={tabBarRef} className={styles.tabBarShell}>
        <nav
          className={styles.tabBar}
          aria-label="Seções da ficha"
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              id={TAB_BUTTON_IDS[tab]}
              type="button"
              role="tab"
              aria-selected={tab === activeTab}
              aria-controls={TAB_PANEL_IDS[tab]}
              className={tab === activeTab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
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
            {sheet.isEditMode ? '✓ Concluir edição' : '✎ Editar ficha'}
          </button>
        </div>
      </div>
      <div className={styles.editToggleSentinel} ref={sentinelRef} />
    </main>
  )
}
