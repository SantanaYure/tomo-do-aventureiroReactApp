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
import { SkillsPanel } from '../../components/SkillsPanel/SkillsPanel'
import { CombatPanel } from '../../components/CombatPanel/CombatPanel'
import { ResourcesPanel } from '../../components/ResourcesPanel/ResourcesPanel'

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<CharacterSheet | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const stored = getCharacterSheet(id)
    if (!stored) {
      setNotFound(true)
      return
    }
    setSheet(stored.data)
  }, [id])

  function handleUpdate(updated: CharacterSheet) {
    if (!id) return
    setSheet(updated)
    saveCharacterSheet(id, updated)
  }

  if (notFound) {
    return (
      <main>
        <Link to="/">← Voltar</Link>
        <p>Ficha não encontrada.</p>
        <button onClick={() => navigate('/')}>Ir para o início</button>
      </main>
    )
  }

  if (!sheet) return <p>Carregando…</p>

  return (
    <main>
      <Link to="/">← Voltar</Link>

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

      {/* TODO: Inventory, Spells, Attacks */}
    </main>
  )
}