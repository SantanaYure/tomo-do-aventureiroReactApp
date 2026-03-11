// src/pages/CharacterSheetPage/CharacterSheetPage.tsx
// Carrega e persiste a ficha de um personagem pelo id da rota

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { CharacterSheet } from '../../types/system/dnd'
import {
  getCharacterSheet,
  saveCharacterSheet,
} from '../../store/characterSheetStore'

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
      <h1>{sheet.character.name || '(sem nome)'}</h1>

      {/* TODO: renderizar seções com sheet e handleUpdate */}
    </main>
  )
}