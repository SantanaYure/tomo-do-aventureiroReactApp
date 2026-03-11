// src/components/CharacterHeader/CharacterHeader.tsx
// Cabeçalho da ficha: nome, raça, classes, alinhamento, XP
// Edição via isEditMode — toggle global

import type { Character, Class } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterHeader.module.css'

const HIT_DICE_OPTIONS = ['1d6', '1d8', '1d10', '1d12']

interface CharacterHeaderProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
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
      hitDice: '',
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
    <header className={`${panelStyles.panel} ${styles.header}`}>
      {isEditMode ? (
        <div className={styles.editLayout}>
          <div className={styles.identityGrid}>
            <label className={styles.field}>
              Nome
              <input
                type="text"
                value={character.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nome do personagem"
              />
            </label>

            <label className={styles.field}>
              Raça
              <input
                type="text"
                value={character.race}
                onChange={(e) => set('race', e.target.value)}
                placeholder="Raça"
              />
            </label>

            <label className={styles.field}>
              Alinhamento
              <input
                type="text"
                value={character.alignment}
                onChange={(e) => set('alignment', e.target.value)}
                placeholder="Alinhamento"
              />
            </label>

            <label className={styles.field}>
              Antecedente
              <input
                type="text"
                value={character.background}
                onChange={(e) => set('background', e.target.value)}
                placeholder="Antecedente"
              />
            </label>

            <label className={styles.field}>
              XP
              <input
                type="number"
                min={0}
                value={character.xp}
                onChange={(e) => set('xp', Number(e.target.value))}
              />
            </label>
          </div>

          <fieldset className={styles.classFieldset}>
            <legend>Classes</legend>
            <div className={styles.classRows}>
              {character.classes.map((c, i) => (
                <div className={styles.classRow} key={c.id}>
                  <input
                    className={styles.classInput}
                    type="text"
                    value={c.className}
                    onChange={(e) => setClass(i, 'className', e.target.value)}
                    placeholder="Classe"
                  />
                  <select
                    className={styles.classInput}
                    value={c.hitDice}
                    onChange={(e) => setClass(i, 'hitDice', e.target.value)}
                  >
                    <option value="">Dado de vida</option>
                    {HIT_DICE_OPTIONS.map((hitDice) => (
                      <option key={hitDice} value={hitDice}>
                        {hitDice}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.classInput}
                    type="number"
                    min={1}
                    max={20}
                    value={c.level}
                    onChange={(e) => setClass(i, 'level', Number(e.target.value))}
                  />
                  <input
                    className={styles.classInput}
                    type="text"
                    value={c.subclass}
                    onChange={(e) => setClass(i, 'subclass', e.target.value)}
                    placeholder="Subclasse"
                  />
                  <div className={styles.classActions}>
                    <button
                      className={panelStyles.removeButton}
                      onClick={() => removeClass(i)}
                      disabled={character.classes.length <= 1}
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className={panelStyles.addButton} onClick={addClass}>+ Classe</button>
          </fieldset>
        </div>
      ) : (
        <div className={styles.view}>
          <h1 className={styles.viewName}>{character.name || '(sem nome)'}</h1>
          <p className={styles.viewMeta}>
            {character.race || '—'} · {character.background || '—'} · {character.alignment || '—'}
          </p>
          <p className={styles.viewDetails}>
            {formatClasses(character.classes)} · Nível {totalLevel(character.classes)}
          </p>
          <p className={styles.viewXp}>XP: {character.xp}</p>
        </div>
      )}
    </header>
  )
}