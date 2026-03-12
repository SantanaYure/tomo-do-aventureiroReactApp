import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listCharacterSheets,
  deleteCharacterSheet,
  exportCharacterSheetAsJSON,
  importCharacterSheetFromJSON,
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

  function createSheetFileName(sheet: StoredCharacterSheet): string {
    const rawName = sheet.data.character.name.trim() || sheet.id
    const normalizedName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return `tomo-personagem-${normalizedName || sheet.id}.json`
  }

  function handleExport(sheet: StoredCharacterSheet) {
    const json = exportCharacterSheetAsJSON(sheet.id)

    if (!json) {
      return
    }

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = createSheetFileName(sheet)
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
      const result = importCharacterSheetFromJSON(json)
      setImportFeedback(result)
      if (result.imported > 0) {
        setSheets(listCharacterSheets())
      }
    }
    reader.readAsText(file)

    e.target.value = ''
  }

  function feedbackMessage(result: ImportResult): string {
    if (result.imported > 0) return 'Ficha importada com sucesso.'
    if (result.skipped > 0) return 'Essa ficha já existe e não foi sobrescrita.'
    if (result.errors > 0) return 'Não foi possível importar o arquivo selecionado.'
    return 'Nenhuma ficha foi importada.'
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tomo do Aventureiro</h1>
      <p className={styles.subtitle}>Suas fichas de personagem</p>
      <div className={styles.ornament}>✦ ✦ ✦</div>

      <div className={styles.primaryActions}>
        <Link to="/ficha/nova" className={styles.newButton}>+ Nova Ficha</Link>
        <button type="button" className={styles.secondaryButton} onClick={handleImportClick}>
          ↑ Importar ficha
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {sheets.length === 0 ? (
        <p className={styles.empty}>Nenhuma ficha encontrada. Crie a primeira!</p>
      ) : (
        <ul className={styles.sheetList}>
          {sheets.map((sheet) => (
            <li key={sheet.id} className={styles.sheetItem}>
              <Link to={`/ficha/${sheet.id}`} className={styles.sheetLink}>
                {sheet.data.character.name || '(sem nome)'}
              </Link>
              <div className={styles.sheetActions}>
                <button
                  type="button"
                  className={styles.exportButton}
                  onClick={() => handleExport(sheet)}
                >
                  ↓ Exportar JSON
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(sheet.id)}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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