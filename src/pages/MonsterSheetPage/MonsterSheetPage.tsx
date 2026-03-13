import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MonsterActionsPanel } from '../../components/monster/MonsterActionsPanel/MonsterActionsPanel'
import { MonsterFeaturesPanel } from '../../components/monster/MonsterFeaturesPanel/MonsterFeaturesPanel'
import { MonsterHeader } from '../../components/monster/MonsterHeader/MonsterHeader'
import { LegendaryActionsPanel } from '../../components/monster/LegendaryActionsPanel/LegendaryActionsPanel'
import { MonsterStatsPanel } from '../../components/monster/MonsterStatsPanel/MonsterStatsPanel'
import { MonsterTraitsPanel } from '../../components/monster/MonsterTraitsPanel/MonsterTraitsPanel'
import type { DeepPartial } from '../../components/monster/shared'
import {
  getMonsterSheet,
  saveMonsterSheet,
} from '../../store/monsterSheetStore'
import type { MonsterSheet } from '../../types/system/dnd/monsterSheet'
import styles from './MonsterSheetPage.module.css'

const TABS = ['Detalhes', 'Combate', 'Habilidades', 'Ações', 'Lendárias'] as const

type Tab = (typeof TABS)[number]

type MonsterLocationState = {
  startEditing?: boolean
  clearPendingCreation?: boolean
}

const DEFAULT_TAB: Tab = 'Detalhes'
const PENDING_MONSTER_CREATION_KEY = 'tomo:pending-new-monster-id'

const TAB_PANEL_IDS: Record<Tab, string> = {
  Detalhes: 'monster-sheet-panel-detalhes',
  Combate: 'monster-sheet-panel-combate',
  Habilidades: 'monster-sheet-panel-habilidades',
  Ações: 'monster-sheet-panel-acoes',
  Lendárias: 'monster-sheet-panel-lendarias',
}

const TAB_BUTTON_IDS: Record<Tab, string> = {
  Detalhes: 'monster-sheet-tab-detalhes',
  Combate: 'monster-sheet-tab-combate',
  Habilidades: 'monster-sheet-tab-habilidades',
  Ações: 'monster-sheet-tab-acoes',
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

  return isTab(storedTab) ? storedTab : DEFAULT_TAB
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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [sheet, setSheet] = useState<MonsterSheet | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>(() => readStoredTab(id))
  const [notFound, setNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasSheet = sheet !== null

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
    if (!id) {
      setNotFound(true)
      setSheet(null)
      return
    }

    const stored = getMonsterSheet(id)

    if (!stored) {
      setNotFound(true)
      setSheet(null)
      return
    }

    setNotFound(false)
    setSheet(stored.data)
  }, [id])

  useEffect(() => {
    const locationState = location.state as MonsterLocationState | null

    if (typeof window !== 'undefined' && locationState?.clearPendingCreation) {
      window.sessionStorage.removeItem(PENDING_MONSTER_CREATION_KEY)
    }

    setIsEditing(Boolean(locationState?.startEditing))
  }, [id, location.state])

  useEffect(() => {
    setActiveTab(readStoredTab(id))
  }, [id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(getTabStorageKey(id), activeTab)
  }, [activeTab, id])

  function handleSheetChange(patch: DeepPartial<MonsterSheet>) {
    if (!sheet || !id) {
      return
    }

    const updatedSheet = mergeDeepPatch(sheet, patch)
    const stored = saveMonsterSheet(id, updatedSheet)
    setSheet(stored.data)
  }

  function handleToggleEditMode() {
    setIsEditing((previous) => !previous)
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

  if (notFound) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Ficha de monstro não encontrada</h1>
          <p>O registro pedido não foi localizado no armazenamento local.</p>
          <button onClick={() => navigate('/')}>Ir para o início</button>
        </section>
      </main>
    )
  }

  if (!sheet) {
    return (
      <main className={styles.page}>
        <section className={styles.loading}>Abrindo o tomo e restaurando os dados do monstro...</section>
      </main>
    )
  }

  function renderDetailsTab() {
    return <MonsterHeader sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderCombatTab() {
    return (
      <>
        <MonsterStatsPanel sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
        <MonsterTraitsPanel sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
      </>
    )
  }

  function renderFeaturesTab() {
    return <MonsterFeaturesPanel sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderActionsTab() {
    return <MonsterActionsPanel sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderLegendaryTab() {
    if (!isEditing && sheet.legendary.actions.length === 0) {
      return <p className={styles.emptyTab}>Este monstro não possui ações lendárias.</p>
    }

    return <LegendaryActionsPanel sheet={sheet} isEditing={isEditing} onChange={handleSheetChange} />
  }

  function renderActiveTab(tab: Tab) {
    switch (tab) {
      case 'Detalhes':
        return renderDetailsTab()
      case 'Combate':
        return renderCombatTab()
      case 'Habilidades':
        return renderFeaturesTab()
      case 'Ações':
        return renderActionsTab()
      case 'Lendárias':
        return renderLegendaryTab()
      default:
        return null
    }
  }

  const activePanelId = TAB_PANEL_IDS[activeTab]

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">← Voltar</Link>

      <div ref={tabBarRef} className={styles.tabBarShell}>
        <nav className={styles.tabBar} aria-label="Seções da ficha de monstro" role="tablist">
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
        <span className={styles.tabScrollHint} aria-hidden="true">
          ↔ Deslize para ver mais seções
        </span>
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
    </main>
  )
}