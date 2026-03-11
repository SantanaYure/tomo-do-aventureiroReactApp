// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
import type { AttunementItem, Character, ItemRarity } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterDetailsPanel.module.css'

const RARITIES: (ItemRarity | '')[] = ['', 'Comum', 'Incomum', 'Raro', 'Muito Raro', 'Lendário', 'Artefato']

function createAttunementItem(): AttunementItem {
  return { name: '', rarity: '', requiresAttunement: true, description: '' }
}

function StringListEditor({ label, values, placeholder, onChange }: {
  label: string; values: string[]; placeholder: string; onChange: (updated: string[]) => void
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{label}</div>
      <div className={styles.tagList}>
        {values.map((v, i) => (
          <span key={i} className={styles.tag}>
            {v}
            <button className={styles.tagRemove} onClick={() => onChange(values.filter((_, j) => j !== i))}>✕</button>
          </span>
        ))}
      </div>
      <div className={styles.addRow}>
        <input type="text" placeholder={placeholder} onKeyDown={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            onChange([...values, e.currentTarget.value.trim()])
            e.currentTarget.value = ''
          }
        }} />
        <button onClick={(e) => {
          const input = (e.currentTarget.previousSibling as HTMLInputElement)
          if (input.value.trim()) { onChange([...values, input.value.trim()]); input.value = '' }
        }}>+</button>
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
  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  const attunementItems = character.attunementItems ?? []

  function setAttunementItem(index: number, partial: Partial<AttunementItem>) {
    set('attunementItems', attunementItems.map((item, i) => i === index ? { ...item, ...partial } : item))
  }
  function addAttunementItem() { set('attunementItems', [...attunementItems, createAttunementItem()]) }
  function removeAttunementItem(index: number) { set('attunementItems', attunementItems.filter((_, i) => i !== index)) }

  const textareaFields: { key: keyof Character; label: string; placeholder: string }[] = [
    { key: 'appearance',           label: 'Aparência',               placeholder: 'Descreva a aparência do personagem…' },
    { key: 'backstoryPersonality', label: 'História e Personalidade', placeholder: 'Backstory, traços, ideais, vínculos, defeitos…' },
    { key: 'speciesTraits',        label: 'Traços de Espécie',        placeholder: 'Habilidades raciais e traços especiais…' },
    { key: 'feats',                label: 'Talentos (Feats)',         placeholder: 'Liste os talentos e seus efeitos…' },
    { key: 'classFeatures',        label: 'Habilidades de Classe',   placeholder: 'Habilidades de classe e subclasse…' },
  ]

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Detalhes do Personagem</h2>

      {textareaFields.map(({ key, label, placeholder }) => (
        <div key={key} className={styles.section}>
          <div className={styles.sectionTitle}>{label}</div>
          {isEditMode ? (
            <textarea value={String(character[key] ?? '')} placeholder={placeholder} rows={4} onChange={(e) => set(key, e.target.value as any)} style={{ width: '100%' }} />
          ) : (
            <div className={`${styles.textareaView} ${!character[key] ? styles.emptyText : ''}`}>
              {String(character[key] || '—')}
            </div>
          )}
        </div>
      ))}

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
          {attunementItems.map((item, i) => (
            <div key={i} className={styles.attunementCard}>
              {isEditMode ? (
                <>
                  <div className={styles.attunementCardHeader}>
                    <input type="text" value={item.name} placeholder="Nome do item" onChange={(e) => setAttunementItem(i, { name: e.target.value })} style={{ flex: 1 }} />
                    <button className={panelStyles.removeButton} onClick={() => removeAttunementItem(i)}>✕</button>
                  </div>
                  <div className={styles.attunementMeta}>
                    <select className={styles.raritySelect} value={item.rarity} onChange={(e) => setAttunementItem(i, { rarity: e.target.value as ItemRarity | '' })}>
                      {RARITIES.map((r) => <option key={r} value={r}>{r || '— Raridade —'}</option>)}
                    </select>
                    <label className={styles.attunementCheck}>
                      <input type="checkbox" checked={item.requiresAttunement} onChange={(e) => setAttunementItem(i, { requiresAttunement: e.target.checked })} />
                      Requer sintonia
                    </label>
                  </div>
                  <textarea value={item.description} placeholder="Descrição do item e seus efeitos…" rows={3}
                    onChange={(e) => setAttunementItem(i, { description: e.target.value })} style={{ width: '100%' }} />
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
