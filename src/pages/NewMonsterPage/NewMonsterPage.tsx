import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDefaultMonsterSheet,
  getMonsterSheet,
  saveMonsterSheet,
} from '../../store/monsterSheetStore'
import styles from './NewMonsterPage.module.css'

const PENDING_MONSTER_CREATION_KEY = 'tomo:pending-new-monster-id'

export function NewMonsterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const pendingId = window.sessionStorage.getItem(PENDING_MONSTER_CREATION_KEY)
    const monsterId = pendingId ?? globalThis.crypto.randomUUID()

    if (!pendingId && !getMonsterSheet(monsterId)) {
      window.sessionStorage.setItem(PENDING_MONSTER_CREATION_KEY, monsterId)
      saveMonsterSheet(monsterId, createDefaultMonsterSheet())
    }

    navigate(`/monstro/${monsterId}`, {
      replace: true,
      state: { startEditing: true, clearPendingCreation: true },
    })
  }, [navigate])

  return (
    <main className={styles.page}>
      <section className={styles.loading}>Criando uma nova ficha de monstro e preparando o tomo...</section>
    </main>
  )
}