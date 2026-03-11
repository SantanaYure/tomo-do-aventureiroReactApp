// src/pages/CharacterSheetPage.tsx
// Exibe a ficha completa de um personagem (CharacterSheet)
// A edição é inline via isEditMode na própria ficha

import { useParams, Link } from 'react-router-dom'

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>()

  // TODO: carregar CharacterSheet pelo id
  // TODO: renderizar seções: Character, Resources, Inventory, Spells, Attacks

  return (
    <main>
      <Link to="/">← Voltar</Link>
      <h1>Ficha #{id}</h1>
      <p>Carregando personagem…</p>
    </main>
  )
}