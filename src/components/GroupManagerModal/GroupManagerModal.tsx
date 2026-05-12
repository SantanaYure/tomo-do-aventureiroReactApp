import { useEffect, useState, type FormEvent } from 'react'
import {
  createSheetGroup,
  deleteSheetGroup,
  renameSheetGroup,
} from '../../store/sheetGroupsStore'
import type { SheetGroup } from '../../types/system/dnd/SheetGroup'
import styles from './GroupManagerModal.module.css'

interface GroupManagerModalProps {
  uid: string
  groups: SheetGroup[]
  onClose: () => void
}

export function GroupManagerModal({ uid, groups, onClose }: GroupManagerModalProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<SheetGroup | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (pendingDelete) setPendingDelete(null)
        else if (editingId) setEditingId(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, pendingDelete, editingId])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || creating) return
    setCreating(true)
    setFeedback(null)
    try {
      await createSheetGroup(uid, trimmed)
      setNewName('')
    } catch (err) {
      console.error('Erro ao criar mesa:', err)
      setFeedback('Não foi possível criar a mesa.')
    } finally {
      setCreating(false)
    }
  }

  function startEditing(group: SheetGroup) {
    setEditingId(group.id)
    setEditingName(group.name)
    setFeedback(null)
  }

  async function handleSaveRename(event: FormEvent) {
    event.preventDefault()
    if (!editingId) return
    const trimmed = editingName.trim()
    if (!trimmed) return
    setBusyId(editingId)
    setFeedback(null)
    try {
      await renameSheetGroup(uid, editingId, trimmed)
      setEditingId(null)
      setEditingName('')
    } catch (err) {
      console.error('Erro ao renomear mesa:', err)
      setFeedback('Não foi possível renomear a mesa.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    setFeedback(null)
    try {
      await deleteSheetGroup(uid, pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      console.error('Erro ao excluir mesa:', err)
      setFeedback('Não foi possível excluir a mesa.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => {
        if (pendingDelete) return
        onClose()
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-manager-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Organização</p>
            <h2 id="group-manager-title" className={styles.title}>
              Mesas
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form className={styles.createForm} onSubmit={handleCreate}>
          <input
            type="text"
            className={styles.input}
            placeholder="Nome da nova mesa..."
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={60}
            disabled={creating}
          />
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={creating || newName.trim().length === 0}
          >
            {creating ? 'Criando...' : 'Criar mesa'}
          </button>
        </form>

        {groups.length === 0 ? (
          <p className={styles.empty}>Nenhuma mesa criada ainda.</p>
        ) : (
          <ul className={styles.list}>
            {groups.map((group) => {
              const isEditing = editingId === group.id
              const isBusy = busyId === group.id
              return (
                <li key={group.id} className={styles.item}>
                  {isEditing ? (
                    <form className={styles.editForm} onSubmit={handleSaveRename}>
                      <input
                        type="text"
                        className={styles.input}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={60}
                        autoFocus
                        disabled={isBusy}
                      />
                      <div className={styles.itemActions}>
                        <button
                          type="submit"
                          className={styles.secondaryBtn}
                          disabled={isBusy || editingName.trim().length === 0}
                        >
                          {isBusy ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => setEditingId(null)}
                          disabled={isBusy}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className={styles.groupName}>{group.name}</span>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => startEditing(group)}
                          disabled={isBusy}
                        >
                          Renomear
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => setPendingDelete(group)}
                          disabled={isBusy}
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        {pendingDelete && (
          <div className={styles.confirmOverlay} role="presentation">
            <div
              className={styles.confirmDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-group-title"
            >
              <p id="confirm-delete-group-title" className={styles.confirmTitle}>
                Excluir esta mesa? As fichas dentro dela não serão apagadas
                e voltarão para "Sem mesa".
              </p>
              <p className={styles.confirmSub}>
                Grupo: <strong>{pendingDelete.name}</strong>
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleConfirmDelete}
                  disabled={busyId === pendingDelete.id}
                >
                  {busyId === pendingDelete.id
                    ? 'Excluindo...'
                    : 'Confirmar exclusão'}
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => setPendingDelete(null)}
                  disabled={busyId === pendingDelete.id}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
