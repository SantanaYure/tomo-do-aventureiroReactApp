// src/pages/Home.tsx
// Lista todas as fichas de personagem salvas

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteCharacterSheet,
  listCharacterSheets,
  type StoredCharacterSheet,
} from '../../store/characterSheetStore'
import styles from './Home.module.css'

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
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.kicker}>Crônicas e Fichas</span>
        <h1 className={styles.title}>Tomo do Aventureiro</h1>
        <p className={styles.lead}>
          Organize personagens, recursos, magias e equipamentos em uma ficha com aparência de manuscrito.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.createLink} to="/ficha/nova">
            Nova Ficha
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Fichas salvas</h2>
          <span className={styles.sectionNote}>{sheets.length} registro(s)</span>
        </div>

        {sheets.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma ficha encontrada.</p>
        ) : (
          <ul className={styles.list}>
            {sheets.map((sheet) => (
              <li className={styles.item} key={sheet.id}>
                <div className={styles.itemMeta}>
                  <Link className={styles.itemLink} to={`/ficha/${sheet.id}`}>
                    {sheet.data.character.name || '(sem nome)'}
                  </Link>
                  <span className={styles.itemCaption}>ID: {sheet.id}</span>
                </div>

                <div className={styles.itemActions}>
                  <Link className={styles.createLink} to={`/ficha/${sheet.id}`}>
                    Abrir
                  </Link>
                  <button className={styles.deleteButton} onClick={() => handleDelete(sheet.id)}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}