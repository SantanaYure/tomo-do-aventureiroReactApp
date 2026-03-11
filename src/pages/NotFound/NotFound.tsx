// src/pages/NotFound.tsx

import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>Página não encontrada.</p>
        <Link className={styles.link} to="/">Voltar ao início</Link>
      </section>
    </main>
  )
}