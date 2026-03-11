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
      <h1 className={styles.title}>Nova Ficha</h1>
      <p className={styles.subtitle}>Crie um novo aventureiro</p>

      <div className={styles.card}>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
          Uma ficha em branco será criada. Você poderá preencher todos os dados dentro da ficha.
        </p>
        <button className={styles.submitBtn} onClick={handleCreate}>
          Criar Personagem
        </button>
      </div>

      <Link to="/" className={styles.backLink}>← Voltar</Link>
    </main>
  )
}