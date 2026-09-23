import { useState, useEffect } from 'react'
import { Skull } from 'lucide-react'
import { useMonsterSheets } from '../../../hooks/useMonsterSheets'
import { extractVitalsFromMonsterSheet } from '../../../store/campaignStore'
import type { CampaignCreature } from '../../../types/campaign/campaign'
import styles from './AddCreatureModal.module.css'

interface AddCreatureModalProps {
  userId: string
  /** `quantity` cópias da mesma criatura; com mais de uma, os nomes são numerados. */
  onAdd: (
    creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>,
    quantity: number,
  ) => Promise<void> | void
  onClose: () => void
}

export function AddCreatureModal({
  userId,
  onAdd,
  onClose,
}: AddCreatureModalProps) {
  const { monsters, isLoading } = useMonsterSheets(userId)
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library')

  // Biblioteca: clicar na criatura já adiciona. Guarda qual está sendo adicionada.
  const [addingId, setAddingId] = useState<string | null>(null)

  // Campos customizados
  const [customName, setCustomName] = useState('')
  const [customHp, setCustomHp] = useState('10')
  const [customAc, setCustomAc] = useState('10')
  const [customInit, setCustomInit] = useState('0')
  const [quantity, setQuantity] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const safeQuantity = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1))

  /** Clique numa criatura da biblioteca: adiciona à sessão na hora e fecha. */
  async function handlePickMonster(monsterId: string) {
    if (addingId) return
    const monster = monsters.find((m) => m.id === monsterId)
    if (!monster) return
    try {
      setAddingId(monsterId)
      setError(null)
      const vitals = extractVitalsFromMonsterSheet(monster.data, monster.id)
      await onAdd({ ...vitals, ownerId: userId }, safeQuantity)
      onClose()
    } catch (addError) {
      console.error('Erro ao adicionar criatura:', addError)
      setError('Não foi possível vincular a criatura à mesa. Tente novamente.')
      setAddingId(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeTab !== 'custom') return

    try {
      setIsSubmitting(true)
      setError(null)
      if (!customName.trim()) return

      const hp = Math.max(1, parseInt(customHp, 10) || 10)
      const ac = Math.max(1, parseInt(customAc, 10) || 10)
      const initBonus = parseInt(customInit, 10) || 0

      await onAdd(
        {
          name: customName.trim(),
          monsterSheetId: null,
          avatar: null,
          hpCurrent: hp,
          hpMax: hp,
          hpTemp: 0,
          armorClass: ac,
          passivePerception: 10,
          conditions: [],
          initiativeBonus: initBonus,
        },
        safeQuantity,
      )
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
                  <div className={styles.quantityRow}>
                    <label htmlFor="library-quantity" className={styles.label}>
                      Quantidade
                    </label>
                    <input
                      id="library-quantity"
                      type="number"
                      min="1"
                      max="20"
                      className={`${styles.input} ${styles.quantityInput}`}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={addingId !== null}
                    />
                    <span className={styles.quantityHint}>
                      Clique na criatura para adicionar{safeQuantity > 1 ? ` ${safeQuantity} cópias` : ''}.
                    </span>
                  </div>

                  <div className={styles.monsterList}>
                    {monsters.map((m) => {
                      const isAdding = m.id === addingId
                      const name = m.data.details?.name || 'Monstro Sem Nome'
                      const hp = m.data.stats?.maxHp ?? 10
                      const ac = m.data.stats?.ac ?? 10
                      const cr = m.data.traits?.challengeRating || '—'

                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`${styles.monsterItem} ${isAdding ? styles.monsterItemActive : ''}`}
                          onClick={() => handlePickMonster(m.id)}
                          disabled={addingId !== null}
                          aria-label={`Adicionar ${name} à sessão`}
                        >
                          {m.data.details?.avatar ? (
                            <img
                              src={m.data.details.avatar}
                              alt=""
                              className={styles.monsterThumb}
                            />
                          ) : (
                            <span className={styles.monsterThumbPlaceholder}>
                              <Skull size={18} strokeWidth={1.5} />
                            </span>
                          )}

                          <span className={styles.monsterInfo}>
                            <span className={styles.monsterName}>{name}</span>
                            <span className={styles.monsterMeta}>
                              {isAdding
                                ? 'Adicionando...'
                                : `${m.data.details?.kind === 'npc' ? 'NPC • ' : ''}ND ${cr} • PV ${hp} • CA ${ac}`}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
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

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="custom-init" className={styles.label}>
                    Bônus de Iniciativa
                  </label>
                  <input
                    id="custom-init"
                    type="number"
                    className={styles.input}
                    value={customInit}
                    onChange={(e) => setCustomInit(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="custom-quantity" className={styles.label}>
                    Quantidade (1 a 20)
                  </label>
                  <input
                    id="custom-quantity"
                    type="number"
                    min="1"
                    max="20"
                    className={styles.input}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
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
            {activeTab === 'custom' && (
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !customName.trim()}
              >
                {isSubmitting
                  ? 'Vinculando...'
                  : safeQuantity > 1
                    ? `Adicionar ${safeQuantity} à Sessão`
                    : 'Adicionar à Sessão'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
