import { useState, useEffect } from 'react'
import { Skull } from 'lucide-react'
import { useMonsterSheets } from '../../../hooks/useMonsterSheets'
import { extractVitalsFromMonsterSheet } from '../../../store/campaignStore'
import type { CampaignCreature } from '../../../types/campaign/campaign'
import styles from './AddCreatureModal.module.css'

interface AddCreatureModalProps {
  userId: string
  onAdd: (creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>) => Promise<void> | void
  onClose: () => void
}

export function AddCreatureModal({
  userId,
  onAdd,
  onClose,
}: AddCreatureModalProps) {
  const { monsters, isLoading } = useMonsterSheets(userId)
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library')

  // Seleção de monstro da biblioteca
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState('')

  // Campos customizados
  const [customName, setCustomName] = useState('')
  const [customHp, setCustomHp] = useState('10')
  const [customAc, setCustomAc] = useState('10')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSelectMonster(id: string, name: string) {
    setSelectedMonsterId(id)
    setInstanceName(name)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      if (activeTab === 'library') {
        const monster = monsters.find((m) => m.id === selectedMonsterId)
        if (!monster) return

        const vitals = extractVitalsFromMonsterSheet(monster.data, monster.id)
        await onAdd({
          ...vitals,
          ownerId: userId,
          name: instanceName.trim() || vitals.name,
        })
      } else {
        if (!customName.trim()) return

        const hp = Math.max(1, parseInt(customHp, 10) || 10)
        const ac = Math.max(1, parseInt(customAc, 10) || 10)

        await onAdd({
          name: customName.trim(),
          monsterSheetId: null,
          avatar: null,
          hpCurrent: hp,
          hpMax: hp,
          hpTemp: 0,
          armorClass: ac,
          passivePerception: 10,
          conditions: [],
        })
      }
      onClose()
    } catch (submitError) {
      console.error('Erro ao adicionar criatura:', submitError)
      setError('Não foi possível vincular a criatura à mesa. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOverlayClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-creature-title"
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Instanciação de Encontro</p>
            <h2 id="add-creature-title" className={styles.title}>
              Adicionar Criatura à Mesa
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.tabRow} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'library' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('library')}
            role="tab"
            aria-selected={activeTab === 'library'}
          >
            Da Minha Biblioteca
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'custom' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('custom')}
            role="tab"
            aria-selected={activeTab === 'custom'}
          >
            Criatura Rápida (Manual)
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.contentArea}>
          {activeTab === 'library' ? (
            <>
              {isLoading ? (
                <div className={styles.emptyState}>Carregando monstros...</div>
              ) : monsters.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhum monstro ou criatura encontrado na sua biblioteca.</p>
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Crie fichas de monstro na aba Fichas do Tomo para importá-las diretamente aqui, ou use a aba &quot;Criatura Rápida&quot;.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.monsterList} role="listbox">
                    {monsters.map((m) => {
                      const isSelected = m.id === selectedMonsterId
                      const name = m.data.details?.name || 'Monstro Sem Nome'
                      const hp = m.data.stats?.maxHp ?? 10
                      const ac = m.data.stats?.ac ?? 10
                      const cr = m.data.traits?.challengeRating || '—'

                      return (
                        <div
                          key={m.id}
                          className={`${styles.monsterItem} ${isSelected ? styles.monsterItemActive : ''}`}
                          onClick={() => handleSelectMonster(m.id, name)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          {m.data.details?.avatar ? (
                            <img
                              src={m.data.details.avatar}
                              alt={name}
                              className={styles.monsterThumb}
                            />
                          ) : (
                            <div className={styles.monsterThumbPlaceholder}>
                              <Skull size={18} strokeWidth={1.5} />
                            </div>
                          )}

                          <div className={styles.monsterInfo}>
                            <p className={styles.monsterName}>{name}</p>
                            <p className={styles.monsterMeta}>
                              ND {cr} • PV {hp} • CA {ac}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedMonsterId && (
                    <div className={styles.field} style={{ marginTop: 'var(--space-2)' }}>
                      <label htmlFor="instance-name" className={styles.label}>
                        Nome em Cena (opcional, ex: Goblin 1)
                      </label>
                      <input
                        id="instance-name"
                        type="text"
                        className={styles.input}
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Ex.: Goblin Arqueiro 1"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="custom-name" className={styles.label}>
                  Nome da Criatura *
                </label>
                <input
                  id="custom-name"
                  type="text"
                  className={styles.input}
                  placeholder="Ex.: Lobo Atroz, Guarda 1"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="custom-hp" className={styles.label}>
                    Pontos de Vida Máximos *
                  </label>
                  <input
                    id="custom-hp"
                    type="number"
                    min="1"
                    className={styles.input}
                    value={customHp}
                    onChange={(e) => setCustomHp(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="custom-ac" className={styles.label}>
                    Classe de Armadura (CA) *
                  </label>
                  <input
                    id="custom-ac"
                    type="number"
                    min="1"
                    className={styles.input}
                    value={customAc}
                    onChange={(e) => setCustomAc(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.footer}>
            {error && <p role="alert">{error}</p>}
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={
                isSubmitting || (activeTab === 'library'
                  ? !selectedMonsterId
                  : !customName.trim())
              }
            >
              {isSubmitting ? 'Vinculando...' : 'Adicionar à Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
