// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
// Backstory, aparência, traços de espécie, feats, proficiências, idiomas e itens sintonizados

import { useId, useState } from 'react'
import type { AttunementItem, Character } from '../../types/system/dnd'
import {
  addUniqueTextEntry,
  getCustomWeaponProficiencies,
  getSelectedWeaponCategories,
  getSuggestedWeaponMasteries,
  setCustomWeaponProficiencyValues,
  toggleWeaponCategory,
  WEAPON_PROFICIENCY_OPTIONS,
  type WeaponProficiencyLabel,
} from '../../utils/weaponCatalog'

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
  const weaponMasteryOptionsId = useId()
  const [weaponMasteryInput, setWeaponMasteryInput] = useState('')
  const selectedWeaponCategories = getSelectedWeaponCategories(character.weaponProficiencies)
  const customWeaponProficiencies = getCustomWeaponProficiencies(character.weaponProficiencies)
  const weaponMasterySuggestions = getSuggestedWeaponMasteries(character.weaponProficiencies)

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function setWeaponCategory(category: WeaponProficiencyLabel, checked: boolean) {
    set(
      'weaponProficiencies',
      toggleWeaponCategory(character.weaponProficiencies, category, checked),
    )
  }

  function setCustomWeaponProficiencies(values: string[]) {
    set(
      'weaponProficiencies',
      setCustomWeaponProficiencyValues(character.weaponProficiencies, values),
    )
  }

  function addWeaponMastery() {
    const updated = addUniqueTextEntry(character.weaponMasteries, weaponMasteryInput)

    if (updated.length !== character.weaponMasteries.length) {
      set('weaponMasteries', updated)
    }

    setWeaponMasteryInput('')
  }

  function removeWeaponMastery(index: number) {
    set(
      'weaponMasteries',
      character.weaponMasteries.filter((_, currentIndex) => currentIndex !== index),
    )
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

      <div>
        <h3>Armas</h3>
        {WEAPON_PROFICIENCY_OPTIONS.map(({ label }) => (
          <label key={label}>
            <input
              type="checkbox"
              checked={selectedWeaponCategories.includes(label)}
              disabled={!isEditMode}
              onChange={(e) => setWeaponCategory(label, e.target.checked)}
            />
            {label}
          </label>
        ))}

        {isEditMode ? (
          <>
            <StringListEditor
              label="Proficiências específicas com armas"
              values={customWeaponProficiencies}
              placeholder="Ex: Espada longa, Rede…"
              onChange={setCustomWeaponProficiencies}
            />

            <div>
              <strong>Maestrias</strong>

              {character.weaponMasteries.length === 0 ? (
                <p>Nenhuma maestria cadastrada.</p>
              ) : (
                <ul>
                  {character.weaponMasteries.map((mastery, index) => (
                    <li key={`${mastery}-${index}`}>
                      <span>{mastery}</span>
                      <button onClick={() => removeWeaponMastery(index)}>−</button>
                    </li>
                  ))}
                </ul>
              )}

              <input
                type="text"
                list={weaponMasteryOptionsId}
                value={weaponMasteryInput}
                placeholder="Selecione ou digite uma arma"
                onChange={(e) => setWeaponMasteryInput(e.target.value)}
              />
              <datalist id={weaponMasteryOptionsId}>
                {weaponMasterySuggestions.map((weaponName) => (
                  <option key={weaponName} value={weaponName} />
                ))}
              </datalist>
              <button onClick={addWeaponMastery}>+ Maestria</button>

              {weaponMasterySuggestions.length > 0 && (
                <p>As sugestões mudam conforme os tipos de arma marcados.</p>
              )}
            </div>
          </>
        ) : (
          <>
            {selectedWeaponCategories.length > 0 && (
              <div>
                <strong>Proficiências: </strong>
                <span>{selectedWeaponCategories.join(', ')}</span>
              </div>
            )}
            {customWeaponProficiencies.length > 0 && (
              <div>
                <strong>Armas específicas: </strong>
                <span>{customWeaponProficiencies.join(', ')}</span>
              </div>
            )}
            {character.weaponMasteries.length > 0 && (
              <div>
                <strong>Maestrias: </strong>
                <span>{character.weaponMasteries.join(', ')}</span>
              </div>
            )}
            {selectedWeaponCategories.length === 0 &&
              customWeaponProficiencies.length === 0 &&
              character.weaponMasteries.length === 0 && <p>Nenhuma arma cadastrada.</p>}
          </>
        )}
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