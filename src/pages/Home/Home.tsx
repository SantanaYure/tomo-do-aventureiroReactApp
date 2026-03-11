import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listCharacterSheets, deleteCharacterSheet, type StoredCharacterSheet } from '../../store/characterSheetStore'
import styles from './Home.module.css'

export function Home() {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])

  useEffect(() => { setSheets(listCharacterSheets()) }, [])

  function handleDelete(id: string) {
    if (!confirm('Excluir esta ficha permanentemente?')) return
    deleteCharacterSheet(id)
    setSheets((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tomo do Aventureiro</h1>
      <p className={styles.subtitle}>Suas fichas de personagem</p>
      <div className={styles.ornament}>✦ ✦ ✦</div>

      <Link to="/ficha/nova" className={styles.newButton}>+ Nova Ficha</Link>

      {sheets.length === 0 ? (
        <p className={styles.empty}>Nenhuma ficha encontrada. Crie a primeira!</p>
      ) : (
        <ul className={styles.sheetList}>
          {sheets.map((sheet) => (
            <li key={sheet.id} className={styles.sheetItem}>
              <Link to={`/ficha/${sheet.id}`} className={styles.sheetLink}>
                {sheet.data.character.name || '(sem nome)'}
              </Link>
              <button className={styles.deleteButton} onClick={() => handleDelete(sheet.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}