import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listCharacterSheets,
  deleteCharacterSheet,
  exportAllSheetsAsJSON,
  importSheetsFromJSON,
  type StoredCharacterSheet,
  type ImportResult,
} from '../../store/characterSheetStore'
import styles from './Home.module.css'

export function Home() {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])
  const [importFeedback, setImportFeedback] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setSheets(listCharacterSheets()) }, [])

  function handleDelete(id: string) {
    if (!confirm('Excluir esta ficha permanentemente?')) return
    deleteCharacterSheet(id)
    setSheets((prev) => prev.filter((s) => s.id !== id))
  }

  function handleExport() {
    const json = exportAllSheetsAsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tomo-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportFeedback(null)
    fileInputRef.current?.click()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const result = importSheetsFromJSON(json)
      setImportFeedback(result)
      if (result.imported > 0) {
        setSheets(listCharacterSheets())
      }
    }
    reader.readAsText(file)

    e.target.value = ''
  }

  function feedbackMessage(result: ImportResult): string {
    const parts: string[] = []
    if (result.imported > 0) parts.push(`${result.imported} ficha${result.imported > 1 ? 's' : ''} importada${result.imported > 1 ? 's' : ''}`)
    if (result.skipped > 0) parts.push(`${result.skipped} já existia${result.skipped > 1 ? 'm' : ''}`)
    if (result.errors > 0) parts.push(`${result.errors} com erro`)
    return parts.join(', ') || 'Nenhuma ficha encontrada no arquivo'
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

      <div className={styles.backupRow}>
        <button className={styles.backupButton} onClick={handleExport}>
          ↓ Exportar fichas
        </button>
        <button className={styles.backupButton} onClick={handleImportClick}>
          ↑ Importar fichas
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {importFeedback && (
        <p className={
          importFeedback.errors > 0 && importFeedback.imported === 0
            ? styles.feedbackError
            : styles.feedbackOk
        }>
          {feedbackMessage(importFeedback)}
        </p>
      )}
    </main>
  )
}