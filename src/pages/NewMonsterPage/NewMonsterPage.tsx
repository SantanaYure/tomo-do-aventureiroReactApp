import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMonsterSheet } from '../../store/monsterSheetStore'
import { useAuth } from '../../context/AuthContext'
import styles from './NewMonsterPage.module.css'

export function NewMonsterPage() {
  const { uid } = useAuth()
  const navigate = useNavigate()
  const creatingRef = useRef(false)

  useEffect(() => {
    if (!uid || creatingRef.current) return

    creatingRef.current = true

    createMonsterSheet(uid)
      .then((stored) => {
        navigate(`/monstro/${stored.id}`, {
          replace: true,
          state: { startEditing: true },
        })
      })
      .catch(console.error)
  }, [navigate, uid])

  return (
    <div className={styles.page}>
      <section className={styles.loading}>Criando uma nova ficha de monstro e preparando o tomo...</section>
    </div>
  )
}
