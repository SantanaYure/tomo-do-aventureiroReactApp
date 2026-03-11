// src/pages/Home.tsx
// Lista todas as fichas de personagem salvas

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteCharacterSheet,
  listCharacterSheets,
  type StoredCharacterSheet,
} from '../../store/characterSheetStore'

export function Home() {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])

  useEffect(() => {
    setSheets(listCharacterSheets())
  }, [])

  function handleDelete(id: string) {
    deleteCharacterSheet(id)
    setSheets((previousSheets) => previousSheets.filter((sheet) => sheet.id !== id))
  }

  return (
    <main>
      <h1>Tomo do Aventureiro</h1>
      <Link to="/ficha/nova">Nova Ficha</Link>

      {sheets.length === 0 ? (
        <p>Nenhuma ficha encontrada.</p>
      ) : (
        <ul>
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <Link to={`/ficha/${sheet.id}`}>
                {sheet.data.character.name || '(sem nome)'}
              </Link>
              <button onClick={() => handleDelete(sheet.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}