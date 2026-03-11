// src/pages/NotFound.tsx

import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <Link to="/">Voltar ao início</Link>
    </main>
  )
}