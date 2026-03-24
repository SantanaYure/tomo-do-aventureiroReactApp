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
import styles from './CharactersPage.module.css'

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

// ── SheetSkeleton ─────────────────────────────────────────────────────────────

function SheetSkeleton() {
  return (
    <ul className={styles.sheetList} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonItem}>
          <div className={styles.skeletonContent}>
            <div className={`${styles.skeletonLine} ${styles.skeletonName}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
          </div>
          <div className={styles.skeletonActions}>
            <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── SheetSection ──────────────────────────────────────────────────────────────

interface SheetSectionProps<T> {
  title: string
  items: T[]
  loading: boolean
  importLabel: string
  onImport: () => void
  renderItem: (item: T) => React.ReactNode
  emptyMessage: string
}

function SheetSection<T>({
  title,
  items,
  loading,
  importLabel,
  onImport,
  renderItem,
  emptyMessage,
}: SheetSectionProps<T>) {
  return (
    <section className={styles.collectionSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <button type="button" className={styles.importButton} onClick={onImport}>
          {importLabel}
        </button>
      </div>
      {loading ? (
        <SheetSkeleton />
      ) : items.length > 0 ? (
        <ul className={styles.sheetList}>{items.map(renderItem)}</ul>
      ) : (
        <p className={styles.emptySection}>{emptyMessage}</p>
      )}
    </section>
  )
}

// ── CharacterSheetItem ────────────────────────────────────────────────────────

interface CharacterSheetItemProps {
  sheet: StoredCharacterSheet
  onExport: () => void
  onDelete: () => void
}

function CharacterSheetItem({ sheet, onExport, onDelete }: CharacterSheetItemProps) {
  const name = sheet.data.character.name || '(sem nome)'
  const race = sheet.data.character.race
  const totalLevel = sheet.data.character.classes.reduce((sum, c) => sum + c.level, 0)
  const classNames = sheet.data.character.classes
    .filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' / ')
  const meta = [race, classNames].filter(Boolean).join(' · ') || (totalLevel > 0 ? `Nível ${totalLevel}` : null)

  return (
    <li className={styles.sheetItem}>
      <div className={styles.sheetInfo}>
        <Link to={`/ficha/${sheet.id}`} className={styles.sheetLink}>
          {name}
        </Link>
        {meta && <span className={styles.sheetMeta}>{meta}</span>}
      </div>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.exportButton} onClick={onExport}>
          ↓ Exportar
        </button>
        <button type="button" className={styles.deleteButton} onClick={onDelete}>
          Excluir
        </button>
      </div>
    </li>
  )
}

// ── MonsterSheetItem ──────────────────────────────────────────────────────────

interface MonsterSheetItemProps {
  sheet: StoredMonsterSheet
  onExport: () => void
  onDelete: () => void
}

function MonsterSheetItem({ sheet, onExport, onDelete }: MonsterSheetItemProps) {
  const name = sheet.data.details.name || '(sem nome)'
  const kindLabel = sheet.data.details.kind === 'npc' ? 'NPC' : 'Monstro'

  return (
    <li className={styles.sheetItem}>
      <div className={styles.sheetInfo}>
        <Link to={`/monstro/${sheet.id}`} className={styles.sheetLink}>
          {name}
        </Link>
        <span className={styles.sheetMeta}>{kindLabel}</span>
      </div>
      <div className={styles.sheetActions}>
        <button type="button" className={styles.exportButton} onClick={onExport}>
          ↓ Exportar
        </button>
        <button type="button" className={styles.deleteButton} onClick={onDelete}>
          Excluir
        </button>
      </div>
    </li>
  )
}

// ── CharactersPage ────────────────────────────────────────────────────────────

export function CharactersPage() {
  const { uid } = useAuth()
  const { sheets, loading: loadingSheets, error: sheetsError } = useCharacterSheets(uid)
  const { monsters, loading: loadingMonsters, error: monstersError } = useMonsterSheets(uid)
  const [search, setSearch] = useState('')
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const characterFileInputRef = useRef<HTMLInputElement>(null)
  const monsterFileInputRef = useRef<HTMLInputElement>(null)

  const error = sheetsError ?? monstersError

  // ── Search filtering ────────────────────────────────────────────────────────

  const term = search.trim().toLowerCase()

  const filteredSheets = term
    ? sheets.filter((s) => s.data.character.name.toLowerCase().includes(term))
    : sheets

  const allMonsters = monsters.filter((m) => m.data.details.kind !== 'npc')
  const allNpcs = monsters.filter((m) => m.data.details.kind === 'npc')

  const filteredMonsters = term
    ? allMonsters.filter((m) => m.data.details.name.toLowerCase().includes(term))
    : allMonsters

  const filteredNpcs = term
    ? allNpcs.filter((m) => m.data.details.name.toLowerCase().includes(term))
    : allNpcs

  // ── Delete ──────────────────────────────────────────────────────────────────

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

  // ── Export ──────────────────────────────────────────────────────────────────

  function normalizeFileName(rawName: string, fallbackId: string, prefix: string): string {
    const normalizedName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${prefix}-${normalizedName || fallbackId}.json`
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
    downloadJsonFile(json, normalizeFileName(sheet.data.character.name.trim() || sheet.id, sheet.id, 'tomo-personagem'))
  }

  function handleExportMonster(monster: StoredMonsterSheet) {
    const json = exportMonsterSheetAsJSON(monster)
    downloadJsonFile(json, normalizeFileName(monster.data.details.name.trim() || monster.id, monster.id, 'tomo-monstro'))
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  function handleImportClick(scope: 'character' | 'monster') {
    setImportFeedback(null)
    if (scope === 'character') characterFileInputRef.current?.click()
    else monsterFileInputRef.current?.click()
  }

  function handleCharacterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({ scope: 'character', result: { imported: 0, skipped: 0, errors: 1 } })
      event.target.value = ''
      return
    }
    if (!uid) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = await importCharacterSheetFromJSON(uid, e.target?.result as string)
      setImportFeedback({ scope: 'character', result })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function handleMonsterImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_JSON_BYTES) {
      setImportFeedback({ scope: 'monster', result: { imported: 0, skipped: 0, errors: 1 } })
      event.target.value = ''
      return
    }
    if (!uid) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const result = await importMonsterSheetFromJSON(uid, e.target?.result as string)
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

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>Erro ao carregar fichas. Verifique sua conexão.</p>
          <button
            type="button"
            className={styles.importButton}
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>
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

      {/* ── Search ── */}
      <header className={styles.pageHeader}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">⚲</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar fichas"
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* ── Personagens ── */}
      <SheetSection
        title="Personagens"
        items={filteredSheets}
        loading={loadingSheets}
        importLabel="↑ Importar personagem"
        onImport={() => handleImportClick('character')}
        renderItem={(sheet) => (
          <CharacterSheetItem
            key={sheet.id}
            sheet={sheet}
            onExport={() => handleExportSheet(sheet)}
            onDelete={() => requestDeleteSheet(sheet.id, sheet.data.character.name)}
          />
        )}
        emptyMessage="Nenhum personagem encontrado."
      />

      {/* ── Monstros & NPCs ── */}
      <SheetSection
        title="Monstros & NPCs"
        items={[...filteredMonsters, ...filteredNpcs]}
        loading={loadingMonsters}
        importLabel="↑ Importar Monstro/NPC"
        onImport={() => handleImportClick('monster')}
        renderItem={(monster) => (
          <MonsterSheetItem
            key={monster.id}
            sheet={monster}
            onExport={() => handleExportMonster(monster)}
            onDelete={() => requestDeleteMonster(monster.id, monster.data.details.name)}
          />
        )}
        emptyMessage="Nenhum monstro ou NPC encontrado."
      />

      {/* ── Feedback ── */}
      {importFeedback && (
        <p
          className={
            importFeedback.result.errors > 0 && importFeedback.result.imported === 0
              ? styles.feedbackError
              : styles.feedbackOk
          }
        >
          {feedbackMessage(importFeedback)}
        </p>
      )}

      {/* ── Delete dialog ── */}
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
              <button
                type="button"
                className={styles.importButton}
                onClick={() => setPendingDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
