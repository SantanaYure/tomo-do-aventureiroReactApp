import { useState, useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteCharacterSheet,
  exportCharacterSheetAsJSON,
  importCharacterSheetFromJSON,
  type StoredCharacterSheet,
  type ImportResult as CharacterImportResult,
} from '../../store/characterSheetStore'
import {
  deleteMonsterSheet as deleteMonster,
  exportMonsterSheetAsJSON,
  importMonsterSheetFromJSON,
  type MonsterImportResult,
  type StoredMonsterSheet,
} from '../../store/monsterSheetStore'
import { useAuth } from '../../context/AuthContext'
import { useCharacterSheets } from '../../hooks/useCharacterSheets'
import { useMonsterSheets } from '../../hooks/useMonsterSheets'
import styles from './Home.module.css'

type ImportFeedback = {
  scope: 'character' | 'monster'
  result: CharacterImportResult | MonsterImportResult
}

type PendingDelete = {
  type: 'character' | 'monster'
  id: string
  name: string
}

const MAX_JSON_BYTES = 2 * 1024 * 1024

export function Home() {
  const { uid } = useAuth()
  const sheets = useCharacterSheets(uid)
  const monsters = useMonsterSheets(uid)
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const characterFileInputRef = useRef<HTMLInputElement>(null)
  const monsterFileInputRef = useRef<HTMLInputElement>(null)

  function requestDeleteSheet(id: string, name: string) {
    setPendingDelete({ type: 'character', id, name })
  }

  function requestDeleteMonster(id: string, name: string) {
    setPendingDelete({ type: 'monster', id, name })
  }

  async function confirmDelete() {
    if (!pendingDelete || !uid) return

    if (pendingDelete.type === 'character') {
      await deleteCharacterSheet(uid, pendingDelete.id)
    } else {
      await deleteMonster(uid, pendingDelete.id)
    }

    setPendingDelete(null)
  }

  function cancelDelete() {
    setPendingDelete(null)
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
    const json = exportCharacterSheetAsJSON(sheet)
    downloadJsonFile(json, createSheetFileName(sheet))
  }

  function handleExportMonster(monster: StoredMonsterSheet) {
    const json = exportMonsterSheetAsJSON(monster)
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

    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({
        scope: 'character',
        result: { imported: 0, skipped: 0, errors: 1 },
      })
      event.target.value = ''
      return
    }

    if (!uid) return

    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const json = loadEvent.target?.result as string
      const result = await importCharacterSheetFromJSON(uid, json)
      setImportFeedback({ scope: 'character', result })
    }
    reader.readAsText(file)

    event.target.value = ''
  }

  function handleMonsterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({
        scope: 'monster',
        result: { imported: 0, skipped: 0, errors: 1 },
      })
      event.target.value = ''
      return
    }

    if (!uid) return

    const reader = new FileReader()
    reader.onload = async (loadEvent) => {
      const json = loadEvent.target?.result as string
      const result = await importMonsterSheetFromJSON(uid, json)
      setImportFeedback({ scope: 'monster', result })
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
          ↑ Importar Monstro/NPC
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
                        ↓ Exportar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => requestDeleteSheet(sheet.id, sheet.data.character.name)}
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
                        ↓ Exportar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => requestDeleteMonster(monster.id, monster.data.details.name)}
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
                        ↓ Exportar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => requestDeleteMonster(npc.id, npc.data.details.name)}
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

      {pendingDelete && (
        <div className={styles.dialogOverlay}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <p id="delete-dialog-title" className={styles.dialogTitle}>
              Excluir "{pendingDelete.name || '(sem nome)'}" permanentemente?
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.deleteButton} onClick={confirmDelete}>
                Confirmar exclusão
              </button>
              <button type="button" className={styles.secondaryButton} onClick={cancelDelete}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
