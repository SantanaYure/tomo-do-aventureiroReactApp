// src/pages/NewCharacterPage/NewCharacterPage.tsx
// Cria uma nova CharacterSheet vazia e redireciona para a ficha

import { useNavigate, Link } from 'react-router-dom'
import { createCharacterSheet } from '../../store/characterSheetStore'

export function NewCharacterPage() {
  const navigate = useNavigate()

  function handleCreate() {
    const stored = createCharacterSheet()
    navigate(`/ficha/${stored.id}`)
  }

  return (
    <main>
      <Link to="/">← Voltar</Link>
      <h1>Nova Ficha</h1>

      {/* TODO: formulário com campos de Character */}
      <button onClick={handleCreate}>Criar Personagem</button>
    </main>
  )
}