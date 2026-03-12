// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { CharacterSheet } from '../../types/system/dnd'
import {
  getCharacterSheet,
  saveCharacterSheet,
} from '../../store/characterSheetStore'
import { CharacterHeader } from '../../components/CharacterHeader/CharacterHeader'
import { AttributesPanel } from '../../components/AttributesPanel/AttributesPanel'
import { SkillsPanel } from '../../components/SkillsPanel/SkillsPanel'
import { CombatPanel } from '../../components/CombatPanel/CombatPanel'
import { ResourcesPanel } from '../../components/ResourcesPanel/ResourcesPanel'
import { AttacksPanel } from '../../components/AttacksPanel/AttacksPanel'
import { SpellsPanel } from '../../components/SpellsPanel/SpellsPanel'
import { InventoryPanel } from '../../components/InventoryPanel/InventoryPanel'
import { CharacterDetailsPanel } from '../../components/CharacterDetailsPanel/CharacterDetailsPanel'
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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<SheetWithSlots | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>(() => readStoredTab(id))
  const [notFound, setNotFound] = useState(false)
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
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasSheet])

  useEffect(() => {
    if (!id) return
    const stored = getCharacterSheet(id)
    if (!stored) {
      setNotFound(true)
      return
    }
    setNotFound(false)
    setSheet(stored.data as SheetWithSlots)
  }, [id])

  useEffect(() => {
    setActiveTab(readStoredTab(id))
  }, [id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.sessionStorage.setItem(getTabStorageKey(id), activeTab)
  }, [activeTab, id])

  function handleUpdate(updated: SheetWithSlots) {
    if (!id) return
    setSheet(updated)
    saveCharacterSheet(id, updated)
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

  if (notFound) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <Link className={styles.backLink} to="/">← Voltar</Link>
          <h1>Ficha não encontrada</h1>
          <p>O registro pedido não foi localizado no armazenamento local.</p>
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

  const renderTabPanel = (tab: Tab) => {
    switch (tab) {
      case 'Principal':
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
      case 'Combate':
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
      case 'Magias':
        return (
          <SpellsPanel
            spells={sheet.spells}
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeSpells={(updated) => handleUpdate({ ...sheet, spells: updated })}
            slotsData={spellSlots}
            onChangeSlotsData={(updated) =>
              handleUpdate({ ...sheet, spellSlots: updated })
            }
          />
        )
      case 'Habilidades':
        return (
          <ResourcesPanel
            resources={sheet.resources}
            isEditMode={sheet.isEditMode}
            onChangeResources={(updated) =>
              handleUpdate({ ...sheet, resources: updated })
            }
          />
        )
      case 'Inventário':
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
      case 'Detalhes':
        return (
          <CharacterDetailsPanel
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={handleCharacterChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <main className={styles.page}>
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
        {renderTabPanel(activeTab)}
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