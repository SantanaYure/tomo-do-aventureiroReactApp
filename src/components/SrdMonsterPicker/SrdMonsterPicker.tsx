import { useEffect, useMemo, useState } from 'react'
import { SRD_MONSTER_TEMPLATES, type SrdMonsterTemplate } from '../../data/srd/monsters'
import { useRuleset } from '../../context/RulesetContext'
import { RULESET_LABELS, matchesRuleset } from '../../utils/ruleset'
import styles from './SrdMonsterPicker.module.css'

interface SrdMonsterPickerProps {
  onSelect: (template: SrdMonsterTemplate) => void | Promise<void>
  onClose: () => void
}

/**
 * Lista monstros do SRD (5.1/2014 e 5.2/2024) filtrados pela preferência de
 * regras do usuário (Configurações → Aparência), para criar uma nova ficha
 * de monstro/NPC já preenchida a partir de um stat block oficial.
 */
export function SrdMonsterPicker({ onSelect, onClose }: SrdMonsterPickerProps) {
  const { ruleset } = useRuleset()
  const [search, setSearch] = useState('')
  const [creatingId, setCreatingId] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const visibleTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    return SRD_MONSTER_TEMPLATES.filter((template) => {
      if (!matchesRuleset(ruleset, template.ruleset)) return false
      if (!term) return true
      return template.name.toLowerCase().includes(term)
    })
  }, [ruleset, search])

  async function handlePick(template: SrdMonsterTemplate) {
    if (creatingId) return
    setCreatingId(template.id)
    try {
      await onSelect(template)
    } finally {
      setCreatingId(null)
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
        aria-labelledby="srd-monster-picker-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="srd-monster-picker-title" className={styles.title}>
              Monstro do SRD
            </h2>
            <p className={styles.subtitle}>
              Mostrando: {RULESET_LABELS[ruleset]} — troque em Configurações → Aparência
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar monstro..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />

        <div className={styles.list}>
          {visibleTemplates.length === 0 && (
            <p className={styles.empty}>Nenhum monstro do SRD encontrado para esse filtro.</p>
          )}
          {visibleTemplates.map((template) => (
            <div key={template.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{template.name}</span>
                <span className={styles.itemMeta}>
                  {RULESET_LABELS[template.ruleset]} · ND {template.challengeRating}
                </span>
              </div>
              <button
                type="button"
                className={styles.itemAction}
                disabled={creatingId !== null}
                onClick={() => handlePick(template)}
              >
                {creatingId === template.id ? 'Criando...' : 'Usar'}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.footer}>
          Conteúdo do System Reference Document, Wizards of the Coast, licenciado sob Creative Commons CC-BY-4.0.
        </p>
      </div>
    </div>
  )
}
