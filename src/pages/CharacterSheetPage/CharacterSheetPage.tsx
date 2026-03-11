// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { CharacterSheet } from '../../types/system/dnd'
import {
  getCharacterSheet,
  saveCharacterSheet,
} from '../../store/characterSheetStore'
import { CharacterHeader } from '../../components/CharacterHeader/CharacterHeader'
import { AttributesPanel } from '../../components/AttributesPanel/AttributesPanel'
import { SkillsPanel } from '../../components/SkillPanel/SkillPanel'
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

      <div className={styles.sheetStack}>
        <CharacterHeader
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={(updated) =>
            handleUpdate({ ...sheet, character: updated })
          }
          onToggleEditMode={() =>
            handleUpdate({ ...sheet, isEditMode: !sheet.isEditMode })
          }
        />

        <AttributesPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={(updated) =>
            handleUpdate({ ...sheet, character: updated })
          }
        />

        <SkillsPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={(updated) =>
            handleUpdate({ ...sheet, character: updated })
          }
        />

        <CombatPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={(updated) =>
            handleUpdate({ ...sheet, character: updated })
          }
        />

        <ResourcesPanel
          resources={sheet.resources}
          isEditMode={sheet.isEditMode}
          onChangeResources={(updated) =>
            handleUpdate({ ...sheet, resources: updated })
          }
        />

        <AttacksPanel
          attacks={sheet.attacks}
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeAttacks={(updated) =>
            handleUpdate({ ...sheet, attacks: updated })
          }
        />

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

        <CharacterDetailsPanel
          character={sheet.character}
          isEditMode={sheet.isEditMode}
          onChangeCharacter={(updated) =>
            handleUpdate({ ...sheet, character: updated })
          }
        />
      </div>
    </main>
  )
}