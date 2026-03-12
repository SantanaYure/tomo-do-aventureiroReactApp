// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
import { useState } from 'react'
import type { AttunementItem, Character, ItemRarity } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterDetailsPanel.module.css'

const RARITIES: (ItemRarity | '')[] = ['', 'Comum', 'Incomum', 'Raro', 'Muito Raro', 'Lendário', 'Artefato']
const TEXTAREA_FIELDS = [
  {
    key: 'appearance',
    label: 'Aparência',
    placeholder: 'Descreva a aparência do personagem…',
  },
  {
    key: 'backstory',
    label: 'História do Personagem',
    placeholder: 'Backstory e eventos marcantes da jornada…',
  },
  {
    key: 'traits',
    label: 'Traços',
    placeholder: 'Maneirismos, traços de personalidade e comportamento…',
  },
  {
    key: 'ideals',
    label: 'Ideais',
    placeholder: 'Princípios, crenças e convicções do personagem…',
  },
  {
    key: 'bonds',
    label: 'Vínculos',
    placeholder: 'Pessoas, lugares, juramentos e laços importantes…',
  },
  {
    key: 'flaws',
    label: 'Fraquezas',
    placeholder: 'Medos, defeitos e vulnerabilidades…',
  },
] as const

type CharacterTextareaField = (typeof TEXTAREA_FIELDS)[number]['key']

interface StringListEditorProps {
  label: string
  values: string[]
  placeholder: string
  onChange: (updated: string[]) => void
}

function createAttunementItem(): AttunementItem {
  return { name: '', rarity: '', requiresAttunement: true, description: '' }
}

function StringListEditor({
  label,
  values,
  placeholder,
  onChange,
}: StringListEditorProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{label}</div>
      <div className={styles.tagList}>
        {values.map((value, index) => (
          <span key={index} className={styles.tag}>
            {value}
            <button
              className={styles.tagRemove}
              onClick={() => onChange(values.filter((_, currentIndex) => currentIndex !== index))}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className={styles.addRow}>
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.currentTarget.value.trim()) {
              onChange([...values, event.currentTarget.value.trim()])
              event.currentTarget.value = ''
            }
          }}
        />
        <button
          onClick={(event) => {
            const input = event.currentTarget.previousSibling as HTMLInputElement

            if (input.value.trim()) {
              onChange([...values, input.value.trim()])
              input.value = ''
            }
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

interface CharacterDetailsPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

export function CharacterDetailsPanel({ character, isEditMode, onChangeCharacter }: CharacterDetailsPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  function toggleCollapse(id: string) {
    setCollapsedIds((previous) => {
      const next = new Set(previous)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function setTextareaField(key: CharacterTextareaField, value: string) {
    set(key, value)
  }

  const attunementItems = character.attunementItems ?? []

  function setAttunementItem(index: number, partial: Partial<AttunementItem>) {
    set('attunementItems', attunementItems.map((item, i) => i === index ? { ...item, ...partial } : item))
  }
  function addAttunementItem() { set('attunementItems', [...attunementItems, createAttunementItem()]) }
  function removeAttunementItem(index: number) { set('attunementItems', attunementItems.filter((_, i) => i !== index)) }

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Detalhes do Personagem</h2>

      {TEXTAREA_FIELDS.map(({ key, label, placeholder }) => {
        const sectionId = String(key)
        const isCollapsed = !isEditMode && collapsedIds.has(sectionId)

        return (
          <div key={key} className={styles.section}>
            <button
              type="button"
              className={styles.featureHeader}
              onClick={() => {
                if (!isEditMode) {
                  toggleCollapse(sectionId)
                }
              }}
              aria-expanded={!isCollapsed}
            >
              <span className={`${styles.sectionTitle} ${styles.featureTitle}`}>{label}</span>
              <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
            </button>

            {!isCollapsed && (
              <div className={styles.featureBody}>
                {isEditMode ? (
                  <textarea
                    className={styles.textareaInput}
                    value={String(character[key] ?? '')}
                    placeholder={placeholder}
                    rows={4}
                    onChange={(event) => setTextareaField(key, event.target.value)}
                  />
                ) : (
                  <div className={`${styles.textareaView} ${!character[key] ? styles.emptyText : ''}`}>
                    {String(character[key] || '—')}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {isEditMode ? (
        <>
          <StringListEditor label="Idiomas" values={character.languages} placeholder="Ex: Comum, Élfico… (Enter)" onChange={(v) => set('languages', v)} />
          <StringListEditor label="Armas" values={character.weaponProficiencies} placeholder="Ex: Espadas longas… (Enter)" onChange={(v) => set('weaponProficiencies', v)} />
          <StringListEditor label="Ferramentas" values={character.toolProficiencies} placeholder="Ex: Ferramentas de ladrão… (Enter)" onChange={(v) => set('toolProficiencies', v)} />
        </>
      ) : (
        <div className={styles.section}>
          {character.languages.length > 0 && <div><strong>Idiomas: </strong>{character.languages.join(', ')}</div>}
          {character.weaponProficiencies.length > 0 && <div><strong>Armas: </strong>{character.weaponProficiencies.join(', ')}</div>}
          {character.toolProficiencies.length > 0 && <div><strong>Ferramentas: </strong>{character.toolProficiencies.join(', ')}</div>}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Armaduras</div>
        <div className={styles.armorGrid}>
          {(['light', 'medium', 'heavy', 'shields'] as const).map((type) => {
            const label = { light: 'Leve', medium: 'Média', heavy: 'Pesada', shields: 'Escudos' }[type]
            return (
              <label key={type} className={styles.armorCheck}>
                <input type="checkbox" checked={character.armorTraining[type]} disabled={!isEditMode}
                  onChange={(e) => set('armorTraining', { ...character.armorTraining, [type]: e.target.checked })} />
                {label}
              </label>
            )
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Itens Sintonizados</div>

        {attunementItems.length === 0 && !isEditMode && (
          <p className={panelStyles.emptyState}>Nenhum item cadastrado.</p>
        )}

        <div className={styles.attunementList}>
          {attunementItems.map((item, index) => (
            <div key={index} className={styles.attunementCard}>
              {isEditMode ? (
                <>
                  <div className={styles.attunementCardHeader}>
                    <input
                      className={styles.attunementNameInput}
                      type="text"
                      value={item.name}
                      placeholder="Nome do item"
                      onChange={(event) => setAttunementItem(index, { name: event.target.value })}
                    />
                    <button className={panelStyles.removeButton} onClick={() => removeAttunementItem(index)}>✕</button>
                  </div>
                  <div className={styles.attunementMeta}>
                    <select
                      className={styles.raritySelect}
                      value={item.rarity}
                      onChange={(event) =>
                        setAttunementItem(index, { rarity: event.target.value as ItemRarity | '' })
                      }
                    >
                      {RARITIES.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity || '— Raridade —'}
                        </option>
                      ))}
                    </select>
                    <label className={styles.attunementCheck}>
                      <input
                        type="checkbox"
                        checked={item.requiresAttunement}
                        onChange={(event) =>
                          setAttunementItem(index, { requiresAttunement: event.target.checked })
                        }
                      />
                      Requer sintonia
                    </label>
                  </div>
                  <textarea
                    className={styles.attunementDescriptionInput}
                    value={item.description}
                    placeholder="Descrição do item e seus efeitos…"
                    rows={3}
                    onChange={(event) =>
                      setAttunementItem(index, { description: event.target.value })
                    }
                  />
                </>
              ) : (
                <>
                  <div className={styles.attunementViewName}>{item.name || '(sem nome)'}</div>
                  {item.rarity && <div className={styles.attunementViewRarity}>{item.rarity}{item.requiresAttunement ? ' · Requer sintonia' : ''}</div>}
                  {item.description && <div className={styles.attunementViewDesc}>{item.description}</div>}
                </>
              )}
            </div>
          ))}
        </div>

        {isEditMode && <button className={panelStyles.addButton} onClick={addAttunementItem}>+ Item Sintonizado</button>}
      </div>
    </section>
  )
}
