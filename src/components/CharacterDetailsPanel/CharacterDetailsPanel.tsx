// src/components/CharacterDetailsPanel/CharacterDetailsPanel.tsx
// Backstory, aparência, traços de espécie, feats, proficiências, idiomas e sintonias

import type { Character } from '../../types/system/dnd'

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

  function setAttunement(index: number, value: string) {
    const updated = [...character.attunements] as [string, string, string]
    updated[index] = value
    set('attunements', updated)
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

      {/* ── Sintonias (3 slots) ── */}
      <div>
        <h3>Sintonias</h3>
        {character.attunements.map((slot, i) =>
          isEditMode ? (
            <input
              key={i}
              type="text"
              value={slot}
              placeholder={`Sintonia ${i + 1}`}
              onChange={(e) => setAttunement(i, e.target.value)}
            />
          ) : (
            <span key={i}>{slot || `(vazio)`}{i < 2 ? ' · ' : ''}</span>
          )
        )}
      </div>
    </section>
  )
}