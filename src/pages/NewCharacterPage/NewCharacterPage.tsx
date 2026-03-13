import { Link, useNavigate } from 'react-router-dom'
import { createCharacterSheet } from '../../store/characterSheetStore'
import styles from './NewCharacterPage.module.css'

export function NewCharacterPage() {
  const navigate = useNavigate()

  function handleCreateCharacter() {
    const stored = createCharacterSheet()
    navigate(`/ficha/${stored.id}`)
  }

  function handleCreateMonster() {
    navigate('/monstro/novo')
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Nova Ficha</h1>
      <p className={styles.subtitle}>Escolha qual tipo de ficha deseja criar</p>

      <div className={styles.optionsGrid}>
        <section className={styles.card}>
          <h2 className={styles.optionTitle}>Personagem D&amp;D</h2>
          <p className={styles.description}>
            Cria uma ficha em branco de personagem para preencher atributos, recursos, inventário e magias.
          </p>
          <button className={styles.submitBtn} onClick={handleCreateCharacter}>
            Criar Personagem
          </button>
        </section>

        <section className={styles.card}>
          <h2 className={styles.optionTitle}>Monstro e NPC</h2>
          <p className={styles.description}>
            Abre a criação de uma ficha de monstro ou NPC com combate, ações, habilidades e traços especiais.
          </p>
          <button className={styles.submitBtn} onClick={handleCreateMonster}>
            Criar Monstro/NPC
          </button>
        </section>
      </div>

      <Link to="/" className={styles.backLink}>← Voltar</Link>
    </main>
  )
}