// src/components/CharacterHeader/CharacterHeader.tsx
// Cabeçalho da ficha: nome, raça, classes, alinhamento, XP
// Edição via isEditMode — toggle global

import type { Character, Class } from '../../types/system/dnd'

interface CharacterHeaderProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
  onToggleEditMode: () => void
}

function formatClasses(classes: Class[]): string {
  return classes
    .map((c) => `${c.className || '—'} ${c.level}`)
    .join(' / ')
}

function totalLevel(classes: Class[]): number {
  return classes.reduce((sum, c) => sum + c.level, 0)
}

export function CharacterHeader({
  character,
  isEditMode,
  onChangeCharacter,
  onToggleEditMode,
}: CharacterHeaderProps) {
  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function setClass(index: number, field: keyof Class, value: string | number) {
    const updated = character.classes.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    )
    onChangeCharacter({ ...character, classes: updated })
  }

  function addClass() {
    const newClass: Class = {
      id: Date.now(),
      className: '',
      subclass: '',
      level: 1,
      hitDice: '1d8',
      notes: '',
    }
    onChangeCharacter({ ...character, classes: [...character.classes, newClass] })
  }

  function removeClass(index: number) {
    if (character.classes.length <= 1) return
    onChangeCharacter({
      ...character,
      classes: character.classes.filter((_, i) => i !== index),
    })
  }

  return (
    <header>
      <div>
        <button onClick={onToggleEditMode}>
          {isEditMode ? '✓ Concluir edição' : '✎ Editar ficha'}
        </button>
      </div>

      {isEditMode ? (
        <div>
          {/* Nome */}
          <label>
            Nome
            <input
              type="text"
              value={character.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome do personagem"
            />
          </label>

          {/* Raça */}
          <label>
            Raça
            <input
              type="text"
              value={character.race}
              onChange={(e) => set('race', e.target.value)}
              placeholder="Raça"
            />
          </label>

          {/* Alinhamento */}
          <label>
            Alinhamento
            <input
              type="text"
              value={character.alignment}
              onChange={(e) => set('alignment', e.target.value)}
              placeholder="Alinhamento"
            />
          </label>

          {/* Background */}
          <label>
            Antecedente
            <input
              type="text"
              value={character.background}
              onChange={(e) => set('background', e.target.value)}
              placeholder="Antecedente"
            />
          </label>

          {/* XP */}
          <label>
            XP
            <input
              type="number"
              min={0}
              value={character.xp}
              onChange={(e) => set('xp', Number(e.target.value))}
            />
          </label>

          {/* Classes */}
          <fieldset>
            <legend>Classes</legend>
            {character.classes.map((c, i) => (
              <div key={c.id}>
                <input
                  type="text"
                  value={c.className}
                  onChange={(e) => setClass(i, 'className', e.target.value)}
                  placeholder="Classe"
                />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={c.level}
                  onChange={(e) => setClass(i, 'level', Number(e.target.value))}
                />
                <input
                  type="text"
                  value={c.subclass}
                  onChange={(e) => setClass(i, 'subclass', e.target.value)}
                  placeholder="Subclasse"
                />
                <button
                  onClick={() => removeClass(i)}
                  disabled={character.classes.length <= 1}
                >
                  −
                </button>
              </div>
            ))}
            <button onClick={addClass}>+ Classe</button>
          </fieldset>
        </div>
      ) : (
        <div>
          <h1>{character.name || '(sem nome)'}</h1>
          <p>
            {character.race || '—'} · {character.background || '—'} · {character.alignment || '—'}
          </p>
          <p>
            {formatClasses(character.classes)} · Nível {totalLevel(character.classes)}
          </p>
          <p>XP: {character.xp}</p>
        </div>
      )}
    </header>
  )
}