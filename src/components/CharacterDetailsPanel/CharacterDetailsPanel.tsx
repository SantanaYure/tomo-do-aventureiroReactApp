// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
// Backstory, aparência, traços de espécie, feats, proficiências, idiomas e itens sintonizados

import type { AttunementItem, Character } from '../../types/system/dnd'

const ATTUNEMENT_RARITIES = [
  '',
  'Comum',
  'Incomum',
  'Raro',
  'Muito raro',
  'Lendário',
  'Artefato',
]

function createAttunementItem(): AttunementItem {
  return {
    name: '',
    rarity: '',
    requiresAttunement: true,
    description: '',
  }
}

interface CharacterDetailsPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

function StringListEditor({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string
  values: string[]
  placeholder: string
  onChange: (updated: string[]) => void
}) {
  return (
    <div>
      <strong>{label}</strong>
      <ul>
        {values.map((v, i) => (
          <li key={i}>
            <input
              type="text"
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const updated = [...values]
                updated[i] = e.target.value
                onChange(updated)
              }}
            />
            <button
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              −
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => onChange([...values, ''])}>+ {label}</button>
    </div>
  )
}

export function CharacterDetailsPanel({
  character,
  isEditMode,
  onChangeCharacter,
}: CharacterDetailsPanelProps) {
  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function setAttunementItem(index: number, partial: Partial<AttunementItem>) {
    set(
      'attunementItems',
      character.attunementItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...partial } : item,
      ),
    )
  }

  function addAttunementItem() {
    set('attunementItems', [...character.attunementItems, createAttunementItem()])
  }

  function removeAttunementItem(index: number) {
    set(
      'attunementItems',
      character.attunementItems.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  const textareaFields: { key: keyof Character; label: string; placeholder: string }[] = [
    { key: 'appearance',           label: 'Aparência',          placeholder: 'Descreva a aparência do personagem…' },
    { key: 'backstoryPersonality', label: 'História e Personalidade', placeholder: 'Backstory, traços de personalidade, ideais, vínculos, defeitos…' },
    { key: 'speciesTraits',        label: 'Traços de Espécie',  placeholder: 'Habilidades raciais, traços especiais…' },
    { key: 'feats',                label: 'Talentos (Feats)',   placeholder: 'Liste os talentos e seus efeitos…' },
    { key: 'classFeatures',        label: 'Habilidades de Classe', placeholder: 'Habilidades de classe e subclasse…' },
  ]

  return (
    <section>
      <h2>Detalhes do Personagem</h2>

      {/* ── Campos de texto longo ── */}
      {textareaFields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <h3>{label}</h3>
          {isEditMode ? (
            <textarea
              value={String(character[key] ?? '')}
              placeholder={placeholder}
              rows={4}
              onChange={(e) => set(key, e.target.value as any)}
              style={{ width: '100%' }}
            />
          ) : (
            <p>{String(character[key] || '—')}</p>
          )}
        </div>
      ))}

      {/* ── Listas ── */}
      {isEditMode ? (
        <>
          <StringListEditor
            label="Idiomas"
            values={character.languages}
            placeholder="Ex: Comum, Élfico…"
            onChange={(v) => set('languages', v)}
          />
          <StringListEditor
            label="Proficiências com armas"
            values={character.weaponProficiencies}
            placeholder="Ex: Espadas longas…"
            onChange={(v) => set('weaponProficiencies', v)}
          />
          <StringListEditor
            label="Proficiências com ferramentas"
            values={character.toolProficiencies}
            placeholder="Ex: Ferramentas de ladrão…"
            onChange={(v) => set('toolProficiencies', v)}
          />
        </>
      ) : (
        <>
          {character.languages.length > 0 && (
            <div>
              <strong>Idiomas: </strong>
              <span>{character.languages.join(', ')}</span>
            </div>
          )}
          {character.weaponProficiencies.length > 0 && (
            <div>
              <strong>Armas: </strong>
              <span>{character.weaponProficiencies.join(', ')}</span>
            </div>
          )}
          {character.toolProficiencies.length > 0 && (
            <div>
              <strong>Ferramentas: </strong>
              <span>{character.toolProficiencies.join(', ')}</span>
            </div>
          )}
        </>
      )}

      {/* ── Treinamento com armaduras ── */}
      <div>
        <h3>Armaduras</h3>
        {(['light', 'medium', 'heavy', 'shields'] as const).map((type) => {
          const label = { light: 'Leve', medium: 'Média', heavy: 'Pesada', shields: 'Escudos' }[type]
          return (
            <label key={type}>
              <input
                type="checkbox"
                checked={character.armorTraining[type]}
                disabled={!isEditMode}
                onChange={(e) =>
                  set('armorTraining', {
                    ...character.armorTraining,
                    [type]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          )
        })}
      </div>

      {/* ── Itens sintonizados ── */}
      <div>
        <h3>Itens sintonizados</h3>

        {character.attunementItems.length === 0 ? (
          <p>Nenhum item cadastrado.</p>
        ) : (
          character.attunementItems.map((item, index) =>
            isEditMode ? (
              <article key={`${item.name}-${index}`}>
                <div>
                  <label>
                    Nome do item
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Nome do item"
                      onChange={(e) =>
                        setAttunementItem(index, { name: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Raridade
                    <select
                      value={item.rarity}
                      onChange={(e) =>
                        setAttunementItem(index, { rarity: e.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {ATTUNEMENT_RARITIES.filter(Boolean).map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <input
                    type="checkbox"
                    checked={item.requiresAttunement}
                    onChange={(e) =>
                      setAttunementItem(index, {
                        requiresAttunement: e.target.checked,
                      })
                    }
                  />
                  Requer sintonia
                </label>

                <label>
                  Descrição
                  <textarea
                    value={item.description}
                    rows={3}
                    placeholder="Descrição do item"
                    onChange={(e) =>
                      setAttunementItem(index, { description: e.target.value })
                    }
                    style={{ width: '100%' }}
                  />
                </label>

                <button onClick={() => removeAttunementItem(index)}>Remover</button>
              </article>
            ) : (
              <article key={`${item.name}-${index}`}>
                <strong>{item.name || 'Item sem nome'}</strong>
                <p>
                  {item.rarity || 'Raridade não informada'} ·{' '}
                  {item.requiresAttunement ? 'Requer sintonia' : 'Sem sintonia'}
                </p>
                <p>{item.description || 'Sem descrição.'}</p>
              </article>
            ),
          )
        )}

        {isEditMode && (
          <button onClick={addAttunementItem}>+ Item sintonizado</button>
        )}
      </div>
    </section>
  )
}