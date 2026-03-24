import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDefaultMonsterSheet,
  getMonsterSheet,
  saveMonsterSheet,
} from '../../store/monsterSheetStore'
import { useAuth } from '../../context/AuthContext'
import styles from './NewMonsterPage.module.css'

const PENDING_MONSTER_CREATION_KEY = 'tomo:pending-new-monster-id'

export function NewMonsterPage() {
  const { uid } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined' || !uid) {
      return
    }

    const pendingId = window.sessionStorage.getItem(PENDING_MONSTER_CREATION_KEY)
    const monsterId = pendingId ?? globalThis.crypto.randomUUID()

    if (!pendingId && !getMonsterSheet(uid, monsterId)) {
      window.sessionStorage.setItem(PENDING_MONSTER_CREATION_KEY, monsterId)
      saveMonsterSheet(uid, monsterId, createDefaultMonsterSheet())
    }

    navigate(`/monstro/${monsterId}`, {
      replace: true,
      state: { startEditing: true, clearPendingCreation: true },
    })
  }, [navigate, uid])

  return (
    <main className={styles.page}>
      <section className={styles.loading}>Criando uma nova ficha de monstro e preparando o tomo...</section>
    </main>
  )
}