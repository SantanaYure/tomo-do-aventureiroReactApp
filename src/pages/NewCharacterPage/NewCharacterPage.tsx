// src/pages/NewCharacterPage.tsx
// Formulário para criar uma nova CharacterSheet do zero

import { useNavigate, Link } from 'react-router-dom'

export function NewCharacterPage() {
  const navigate = useNavigate()

  function handleCreate() {
    // TODO: gerar id único, salvar CharacterSheet vazia, redirecionar
    const newId = crypto.randomUUID()
    navigate(`/ficha/${newId}`)
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