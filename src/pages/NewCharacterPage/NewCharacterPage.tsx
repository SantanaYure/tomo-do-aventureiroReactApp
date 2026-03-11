// src/pages/NewCharacterPage/NewCharacterPage.tsx
// Cria uma nova CharacterSheet vazia e redireciona para a ficha

import { useNavigate, Link } from 'react-router-dom'
import { createCharacterSheet } from '../../store/characterSheetStore'
import styles from './NewCharacterPage.module.css'

export function NewCharacterPage() {
  const navigate = useNavigate()

  function handleCreate() {
    const stored = createCharacterSheet()
    navigate(`/ficha/${stored.id}`)
  }

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">← Voltar</Link>

      <section className={styles.card}>
        <h1 className={styles.title}>Nova Ficha</h1>
        <p className={styles.text}>
          Abra uma nova folha no tomo para começar a preencher classe, atributos, recursos, itens e magias.
        </p>

        <div className={styles.actions}>
          <button className={styles.createButton} onClick={handleCreate}>
            Criar Personagem
          </button>
        </div>
      </section>
    </main>
  )
}