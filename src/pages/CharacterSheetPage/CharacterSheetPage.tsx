// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
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

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<SheetWithSlots | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const sheetStackRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pendingScrollAnchorRef = useRef<{
    panelId: string
    top: number
  } | null>(null)
  const hasSheet = sheet !== null

  function captureScrollAnchor() {
    const stack = sheetStackRef.current
    if (!stack) return

    const panelSlots = Array.from(
      stack.querySelectorAll<HTMLElement>('[data-panel-id]'),
    )

    if (panelSlots.length === 0) return

    const anchorY = Math.max(
      96,
      Math.min(window.innerHeight * 0.35, window.innerHeight - 160),
    )
    const anchorX = window.innerWidth / 2
    const elementAtPoint = document.elementFromPoint(anchorX, anchorY)

    const anchoredPanel =
      panelSlots.find((panel) => elementAtPoint && panel.contains(elementAtPoint)) ??
      panelSlots.reduce((closestPanel, currentPanel) => {
        const closestDistance = Math.abs(
          closestPanel.getBoundingClientRect().top - anchorY,
        )
        const currentDistance = Math.abs(
          currentPanel.getBoundingClientRect().top - anchorY,
        )

        return currentDistance < closestDistance ? currentPanel : closestPanel
      })

    const panelId = anchoredPanel.dataset.panelId
    if (!panelId) return

    pendingScrollAnchorRef.current = {
      panelId,
      top: anchoredPanel.getBoundingClientRect().top,
    }
  }

  useLayoutEffect(() => {
    const anchor = pendingScrollAnchorRef.current
    if (!anchor) return

    const stack = sheetStackRef.current
    const anchoredPanel = stack?.querySelector<HTMLElement>(
      `[data-panel-id="${anchor.panelId}"]`,
    )

    pendingScrollAnchorRef.current = null

    if (!anchoredPanel) return

    const delta = anchoredPanel.getBoundingClientRect().top - anchor.top

    if (Math.abs(delta) > 1) {
      window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
    }
  }, [sheet?.isEditMode])

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
    setSheet(stored.data as SheetWithSlots)
  }, [id])

  function handleUpdate(updated: SheetWithSlots) {
    if (!id) return
    setSheet(updated)
    saveCharacterSheet(id, updated)
  }

  function handleToggleEditMode() {
    if (!sheet) return
    captureScrollAnchor()
    handleUpdate({ ...sheet, isEditMode: !sheet.isEditMode })
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

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">← Voltar</Link>

      <div className={styles.sheetStack} ref={sheetStackRef}>
        <div data-panel-id="character-header">
          <CharacterHeader
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>

        <div data-panel-id="attributes">
          <AttributesPanel
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>

        <div data-panel-id="skills">
          <SkillsPanel
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>

        <div data-panel-id="combat">
          <CombatPanel
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>

        <div data-panel-id="resources">
          <ResourcesPanel
            resources={sheet.resources}
            isEditMode={sheet.isEditMode}
            onChangeResources={(updated) =>
              handleUpdate({ ...sheet, resources: updated })
            }
          />
        </div>

        <div data-panel-id="attacks">
          <AttacksPanel
            attacks={sheet.attacks}
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeAttacks={(updated) =>
              handleUpdate({ ...sheet, attacks: updated })
            }
          />
        </div>

        <div data-panel-id="spells">
          <SpellsPanel
            spells={sheet.spells}
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeSpells={(updated) =>
              handleUpdate({ ...sheet, spells: updated })
            }
            slotsData={spellSlots}
            onChangeSlotsData={(updated) =>
              handleUpdate({ ...sheet, spellSlots: updated })
            }
          />
        </div>

        <div data-panel-id="inventory">
          <InventoryPanel
            inventory={sheet.inventory}
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeInventory={(updated) =>
              handleUpdate({ ...sheet, inventory: updated })
            }
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>

        <div data-panel-id="details">
          <CharacterDetailsPanel
            character={sheet.character}
            isEditMode={sheet.isEditMode}
            onChangeCharacter={(updated) =>
              handleUpdate({ ...sheet, character: updated })
            }
          />
        </div>
      </div>
      <div className={styles.editToggleSlot}>
        <div
          className={isAtBottom ? styles.editToggleAnchored : styles.editToggle}
        >
          <button
            className={styles.editToggleButton}
            onClick={handleToggleEditMode}
          >
            {sheet.isEditMode ? '✓ Concluir edição' : '✎ Editar ficha'}
          </button>
        </div>
      </div>
      <div className={styles.editToggleSentinel} ref={sentinelRef} />
    </main>
  )
}