import type { DamagePart } from '../../types/system/dnd/DamagePart'
import panelStyles from '../../styles/panel.module.css'
import styles from './DamagesEditor.module.css'

function createDamagePart(): DamagePart {
  return { dice: '', type: '', bonus: '' }
}

interface DamagesEditorProps {
  damages: DamagePart[]
  onChange: (updated: DamagePart[]) => void
}

export function DamagesEditor({ damages, onChange }: DamagesEditorProps) {
  function setPart(index: number, patch: Partial<DamagePart>) {
    onChange(damages.map((p, i) => i === index ? { ...p, ...patch } : p))
  }

  function addPart() {
    onChange([...damages, createDamagePart()])
  }

  function removePart(index: number) {
    onChange(damages.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.editor}>
      {damages.length > 0 && (
        <div className={styles.partList}>
          {damages.map((part, i) => (
            <div key={i} className={styles.partRow}>
              <div className={styles.partFields}>
                <input
                  type="text"
                  className={styles.diceInput}
                  value={part.dice}
                  placeholder="2d6"
                  aria-label={`Dado do dano ${i + 1}`}
                  onChange={(e) => setPart(i, { dice: e.target.value })}
                />
                <input
                  type="text"
                  className={styles.typeInput}
                  value={part.type}
                  placeholder="Cortante"
                  aria-label={`Tipo do dano ${i + 1}`}
                  onChange={(e) => setPart(i, { type: e.target.value })}
                />
                <input
                  type="text"
                  className={styles.bonusInput}
                  value={part.bonus}
                  placeholder="+4"
                  aria-label={`Bônus do dano ${i + 1}`}
                  onChange={(e) => setPart(i, { bonus: e.target.value })}
                />
              </div>
              <button
                type="button"
                className={`${panelStyles.removeButton} ${styles.removeBtn}`}
                onClick={() => removePart(i)}
                aria-label={`Remover dano ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" className={`${panelStyles.addButton} ${styles.addBtn}`} onClick={addPart}>
        + Dano
      </button>
    </div>
  )
}
