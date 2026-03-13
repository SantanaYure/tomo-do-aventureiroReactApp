import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listCharacterSheets,
  deleteCharacterSheet,
  exportCharacterSheetAsJSON,
  importCharacterSheetFromJSON,
  type StoredCharacterSheet,
  type ImportResult as CharacterImportResult,
} from '../../store/characterSheetStore'
import {
  listMonsterSheets,
  deleteMonsterSheet as deleteMonster,
  exportMonsterSheetAsJSON,
  importMonsterSheetFromJSON,
  type MonsterImportResult,
  type StoredMonsterSheet,
} from '../../store/monsterSheetStore'
import styles from './Home.module.css'

type ImportFeedback = {
  scope: 'character' | 'monster'
  result: CharacterImportResult | MonsterImportResult
}

export function Home() {
  const [sheets, setSheets] = useState<StoredCharacterSheet[]>([])
  const [monsters, setMonsters] = useState<StoredMonsterSheet[]>([])
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const characterFileInputRef = useRef<HTMLInputElement>(null)
  const monsterFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSheets(listCharacterSheets())
    setMonsters(listMonsterSheets())
  }, [])

  function handleDeleteSheet(id: string) {
    if (!confirm('Excluir esta ficha permanentemente?')) return
    deleteCharacterSheet(id)
    setSheets((prev) => prev.filter((s) => s.id !== id))
  }

  function handleDeleteMonster(id: string) {
    if (!confirm('Excluir este monstro ou NPC permanentemente?')) return
    deleteMonster(id)
    setMonsters((prev) => prev.filter((monster) => monster.id !== id))
  }

  function normalizeFileName(rawName: string, fallbackId: string, prefix: string): string {
    const normalizedName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return `${prefix}-${normalizedName || fallbackId}.json`
  }

  function createSheetFileName(sheet: StoredCharacterSheet): string {
    return normalizeFileName(
      sheet.data.character.name.trim() || sheet.id,
      sheet.id,
      'tomo-personagem',
    )
  }

  function createMonsterFileName(monster: StoredMonsterSheet): string {
    return normalizeFileName(
      monster.data.details.name.trim() || monster.id,
      monster.id,
      'tomo-monstro',
    )
  }

  function downloadJsonFile(json: string, fileName: string) {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportSheet(sheet: StoredCharacterSheet) {
    const json = exportCharacterSheetAsJSON(sheet.id)

    if (!json) {
      return
    }

    downloadJsonFile(json, createSheetFileName(sheet))
  }

  function handleExportMonster(monster: StoredMonsterSheet) {
    const json = exportMonsterSheetAsJSON(monster.id)

    if (!json) {
      return
    }

    downloadJsonFile(json, createMonsterFileName(monster))
  }

  function handleCharacterImportClick() {
    setImportFeedback(null)
    characterFileInputRef.current?.click()
  }

  function handleMonsterImportClick() {
    setImportFeedback(null)
    monsterFileInputRef.current?.click()
  }

  function handleCharacterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const json = loadEvent.target?.result as string
      const result = importCharacterSheetFromJSON(json)
      setImportFeedback({ scope: 'character', result })
      if (result.imported > 0) {
        setSheets(listCharacterSheets())
      }
    }
    reader.readAsText(file)

    event.target.value = ''
  }

  function handleMonsterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const json = loadEvent.target?.result as string
      const result = importMonsterSheetFromJSON(json)
      setImportFeedback({ scope: 'monster', result })
      if (result.imported > 0) {
        setMonsters(listMonsterSheets())
      }
    }
    reader.readAsText(file)

    event.target.value = ''
  }

  function feedbackMessage(feedback: ImportFeedback): string {
    const label = feedback.scope === 'character' ? 'Ficha' : 'Monstro ou NPC'

    if (feedback.result.imported > 0) return `${label} importado com sucesso.`
    if (feedback.result.skipped > 0) return `Esse ${label.toLowerCase()} já existe e não foi sobrescrito.`
    if (feedback.result.errors > 0) return 'Não foi possível importar o arquivo selecionado.'
    return `Nenhum ${label.toLowerCase()} foi importado.`
  }

  const monsterList = monsters.filter((m) => m.data.details.kind !== 'npc')
  const npcList = monsters.filter((m) => m.data.details.kind === 'npc')

  const hasCharacters = sheets.length > 0
  const hasMonsters = monsterList.length > 0
  const hasNpcs = npcList.length > 0
  const isCompletelyEmpty = !hasCharacters && !hasMonsters && !hasNpcs

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tomo do Aventureiro</h1>
      <p className={styles.subtitle}>Suas fichas de personagem, monstros e NPCs</p>
      <div className={styles.ornament}>✦ ✦ ✦</div>

      <div className={styles.primaryActions}>
        <Link to="/ficha/nova" className={styles.newButton}>+ Nova Ficha</Link>
        <button type="button" className={styles.secondaryButton} onClick={handleCharacterImportClick}>
          ↑ Importar personagem
        </button>
        <button type="button" className={styles.secondaryButton} onClick={handleMonsterImportClick}>
          ↑ Importar monstro
        </button>
        <input
          ref={characterFileInputRef}
          type="file"
          accept=".json,application/json"
          className={styles.hiddenInput}
          onChange={handleCharacterImportFileChange}
        />
        <input
          ref={monsterFileInputRef}
          type="file"
          accept=".json,application/json"
          className={styles.hiddenInput}
          onChange={handleMonsterImportFileChange}
        />
      </div>

      {isCompletelyEmpty ? (
        <p className={styles.empty}>Nenhuma ficha encontrada. Crie um personagem ou um monstro para começar.</p>
      ) : (
        <>
          <section className={styles.collectionSection}>
            <h2 className={styles.sectionTitle}>Personagens</h2>

            {hasCharacters ? (
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
                        onClick={() => handleExportSheet(sheet)}
                      >
                        ↓ Exportar JSON
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteSheet(sheet.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptySection}>Nenhum personagem encontrado.</p>
            )}
          </section>

          <section className={styles.collectionSection}>
            <h2 className={styles.sectionTitle}>Monstros</h2>

            {hasMonsters ? (
              <ul className={styles.sheetList}>
                {monsterList.map((monster) => (
                  <li key={monster.id} className={styles.sheetItem}>
                    <Link to={`/monstro/${monster.id}`} className={styles.sheetLink}>
                      {monster.data.details.name || '(sem nome)'}
                    </Link>
                    <div className={styles.sheetActions}>
                      <button
                        type="button"
                        className={styles.exportButton}
                        onClick={() => handleExportMonster(monster)}
                      >
                        ↓ Exportar JSON
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteMonster(monster.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptySection}>Nenhum monstro encontrado.</p>
            )}
          </section>

          <section className={styles.collectionSection}>
            <h2 className={styles.sectionTitle}>NPCs</h2>

            {hasNpcs ? (
              <ul className={styles.sheetList}>
                {npcList.map((npc) => (
                  <li key={npc.id} className={styles.sheetItem}>
                    <Link to={`/monstro/${npc.id}`} className={styles.sheetLink}>
                      {npc.data.details.name || '(sem nome)'}
                    </Link>
                    <div className={styles.sheetActions}>
                      <button
                        type="button"
                        className={styles.exportButton}
                        onClick={() => handleExportMonster(npc)}
                      >
                        ↓ Exportar JSON
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteMonster(npc.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptySection}>Nenhum NPC encontrado.</p>
            )}
          </section>
        </>
      )}

      {importFeedback && (
        <p className={
          importFeedback.result.errors > 0 && importFeedback.result.imported === 0
            ? styles.feedbackError
            : styles.feedbackOk
        }>
          {feedbackMessage(importFeedback)}
        </p>
      )}
    </main>
  )
}