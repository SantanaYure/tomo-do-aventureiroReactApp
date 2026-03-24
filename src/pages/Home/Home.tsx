import styles from './Home.module.css'

export function Home() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tomo do Aventureiro</h1>
      <p className={styles.subtitle}>Suas fichas de personagem, monstros e NPCs</p>
      <div className={styles.ornament}>✦ ✦ ✦</div>
    </main>
  )
}
