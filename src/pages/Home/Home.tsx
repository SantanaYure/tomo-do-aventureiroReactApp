// src/pages/Home.tsx
// Lista todas as fichas de personagem salvas

import { Link } from 'react-router-dom'

export function Home() {
  return (
    <main>
      <h1>Tomo do Aventureiro</h1>
      <Link to="/ficha/nova">Nova Ficha</Link>

      {/* TODO: listar fichas salvas */}
      <p>Nenhuma ficha encontrada.</p>
    </main>
  )
}