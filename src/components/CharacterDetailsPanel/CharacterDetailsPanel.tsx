// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
// Backstory, aparência, traços de espécie, feats, proficiências, idiomas e itens sintonizados

import { useId, useState } from 'react'
import type { AttunementItem, Character } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterDetailsPanel.module.css'
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
    <div className={styles.listEditor}>
      <strong className={styles.blockTitle}>{label}</strong>
      <ul className={styles.inlineList}>
        {values.map((v, i) => (
          <li className={styles.inlineListItem} key={i}>
            <input
              className={styles.listInput}
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
              className={panelStyles.removeButton}
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              −
            </button>
          </li>
        ))}
      </ul>
      <button className={panelStyles.addButton} onClick={() => onChange([...values, ''])}>+ {label}</button>
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
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Detalhes do Personagem</h2>
      </div>

      <div className={styles.textSections}>
        {textareaFields.map(({ key, label, placeholder }) => (
        <div className={styles.textBlock} key={key}>
          <h3 className={styles.blockTitle}>{label}</h3>
          {isEditMode ? (
            <textarea
              className={panelStyles.fullWidth}
              value={String(character[key] ?? '')}
              placeholder={placeholder}
              rows={4}
              onChange={(e) => set(key, e.target.value as any)}
            />
          ) : (
            <p className={styles.textContent}>{String(character[key] || '—')}</p>
          )}
        </div>
      ))}
      </div>

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
        <div className={styles.summaryList}>
          {character.languages.length > 0 && (
            <div className={styles.summaryRow}>
              <strong>Idiomas: </strong>
              <span>{character.languages.join(', ')}</span>
            </div>
          )}
          {character.toolProficiencies.length > 0 && (
            <div className={styles.summaryRow}>
              <strong>Ferramentas: </strong>
              <span>{character.toolProficiencies.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.sectionBlock}>
        <h3 className={panelStyles.sectionTitle}>Armaduras</h3>
        <div className={styles.checkboxGrid}>
          {(['light', 'medium', 'heavy', 'shields'] as const).map((type) => {
            const label = { light: 'Leve', medium: 'Média', heavy: 'Pesada', shields: 'Escudos' }[type]
            return (
              <label className={panelStyles.checkboxLabel} key={type}>
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
      </div>

      <div className={styles.sectionBlock}>
        <h3 className={panelStyles.sectionTitle}>Armas</h3>
        <div className={styles.checkboxGrid}>
          {WEAPON_PROFICIENCY_OPTIONS.map(({ label }) => (
            <label className={panelStyles.checkboxLabel} key={label}>
              <input
                type="checkbox"
                checked={selectedWeaponCategories.includes(label)}
                disabled={!isEditMode}
                onChange={(e) => setWeaponCategory(label, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        {isEditMode ? (
          <>
            <StringListEditor
              label="Proficiências específicas com armas"
              values={customWeaponProficiencies}
              placeholder="Ex: Espada longa, Rede…"
              onChange={setCustomWeaponProficiencies}
            />

            <div className={styles.sectionBlock}>
              <strong className={styles.blockTitle}>Maestrias</strong>

              {character.weaponMasteries.length === 0 ? (
                <p className={panelStyles.emptyState}>Nenhuma maestria cadastrada.</p>
              ) : (
                <ul className={styles.masteryList}>
                  {character.weaponMasteries.map((mastery, index) => (
                    <li className={styles.masteryItem} key={`${mastery}-${index}`}>
                      <span>{mastery}</span>
                      <button className={panelStyles.removeButton} onClick={() => removeWeaponMastery(index)}>−</button>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.masteryInputRow}>
                <input
                  className={panelStyles.wideInput}
                  type="text"
                  list={weaponMasteryOptionsId}
                  value={weaponMasteryInput}
                  placeholder="Selecione ou digite uma arma"
                  onChange={(e) => setWeaponMasteryInput(e.target.value)}
                />
                <button className={panelStyles.addButton} onClick={addWeaponMastery}>+ Maestria</button>
              </div>
              <datalist id={weaponMasteryOptionsId}>
                {weaponMasterySuggestions.map((weaponName) => (
                  <option key={weaponName} value={weaponName} />
                ))}
              </datalist>

              {weaponMasterySuggestions.length > 0 && (
                <p className={styles.inlineInfo}>As sugestões mudam conforme os tipos de arma marcados.</p>
              )}
            </div>
          </>
        ) : (
          <div className={styles.summaryList}>
            {selectedWeaponCategories.length > 0 && (
              <div className={styles.summaryRow}>
                <strong>Proficiências: </strong>
                <span>{selectedWeaponCategories.join(', ')}</span>
              </div>
            )}
            {customWeaponProficiencies.length > 0 && (
              <div className={styles.summaryRow}>
                <strong>Armas específicas: </strong>
                <span>{customWeaponProficiencies.join(', ')}</span>
              </div>
            )}
            {character.weaponMasteries.length > 0 && (
              <div className={styles.summaryRow}>
                <strong>Maestrias: </strong>
                <span>{character.weaponMasteries.join(', ')}</span>
              </div>
            )}
            {selectedWeaponCategories.length === 0 &&
              customWeaponProficiencies.length === 0 &&
              character.weaponMasteries.length === 0 && <p className={panelStyles.emptyState}>Nenhuma arma cadastrada.</p>}
          </div>
        )}
      </div>

      <div className={styles.sectionBlock}>
        <h3 className={panelStyles.sectionTitle}>Itens sintonizados</h3>

        {character.attunementItems.length === 0 ? (
          <p className={panelStyles.emptyState}>Nenhum item cadastrado.</p>
        ) : (
          <div className={styles.attunementGrid}>
          {character.attunementItems.map((item, index) =>
            isEditMode ? (
              <article className={styles.attunementCard} key={`${item.name}-${index}`}>
                <div className={styles.attunementMeta}>
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

                <label className={panelStyles.checkboxLabel}>
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
                    className={panelStyles.fullWidth}
                    value={item.description}
                    rows={3}
                    placeholder="Descrição do item"
                    onChange={(e) =>
                      setAttunementItem(index, { description: e.target.value })
                    }
                  />
                </label>

                <button className={panelStyles.removeButton} onClick={() => removeAttunementItem(index)}>Remover</button>
              </article>
            ) : (
              <article className={styles.attunementCard} key={`${item.name}-${index}`}>
                <strong>{item.name || 'Item sem nome'}</strong>
                <p className={styles.inlineInfo}>
                  {item.rarity || 'Raridade não informada'} ·{' '}
                  {item.requiresAttunement ? 'Requer sintonia' : 'Sem sintonia'}
                </p>
                <p className={styles.attunementDescription}>{item.description || 'Sem descrição.'}</p>
              </article>
            ),
          )}
          </div>
        )}

        {isEditMode && (
          <button className={panelStyles.addButton} onClick={addAttunementItem}>+ Item sintonizado</button>
        )}
      </div>
    </section>
  )
}