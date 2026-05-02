// src/components/CharacterHeader/CharacterHeader.tsx
// Cabeçalho da ficha: nome, raça, classes, alinhamento, XP
// Edição via isEditMode — toggle global

import { useState } from 'react'
import type { Character, Class } from '../../types/system/dnd'
import { AvatarCropper } from '../AvatarCropper/AvatarCropper'
import { NumberInput } from '../NumberInput/NumberInput'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterHeader.module.css'

const HIT_DICE_OPTIONS = ['1d6', '1d8', '1d10', '1d12']

interface CharacterHeaderProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
  onShortRest: () => void
  onLongRest: () => void
  restFeedback?: string | null
}

function formatClasses(classes: Class[]): string {
  return classes
    .map((currentClass) => `${currentClass.className || '—'} ${currentClass.level}`)
    .join(' / ')
}

function totalLevel(classes: Class[]): number {
  return classes.reduce((sum, currentClass) => sum + currentClass.level, 0)
}

function fmt(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function getAttrMod(character: Character, name: string): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function calcEffectiveHpMax(character: Character): number {
  if (!character.hpAutoCalc) return Math.max(0, Math.trunc(character.hpMax))
  const conMod = getAttrMod(character, 'Constituição')
  let total = 0
  let firstLevel = false
  for (const cls of character.classes) {
    const levels = Math.max(0, Math.trunc(cls.level))
    const match = /d(\d+)/i.exec(cls.hitDice)
    const sides = match ? Number(match[1]) : 0
    if (levels === 0 || sides === 0) continue
    const avg = Math.floor(sides / 2) + 1
    for (let i = 0; i < levels; i++) {
      total += Math.max(1, (firstLevel ? avg : sides) + conMod)
      firstLevel = true
    }
  }
  const bonus = character.hpBonusEntries.reduce((sum, e) => {
    const v = Number(e.value)
    return sum + (Number.isFinite(v) ? Math.trunc(v) : 0)
  }, 0)
  return Math.max(0, total + bonus)
}

function calcPassivePerception(character: Character, profBonus: number): number {
  const wisMod = getAttrMod(character, 'Sabedoria')
  const perc = character.skills.perception
  const profLevel = Math.max(0, Math.min(2, Math.trunc(perc?.proficiency ?? 0)))
  return 10 + wisMod + profLevel * profBonus + (perc?.misc ?? 0) + (character.passivePerceptionBonus ?? 0)
}

function ViewLayout({ character }: { character: Character }) {
  const profBonus = calcProficiencyBonus(character.classes)
  const ac = Math.max(0, Math.trunc(character.armorClassBase))
  const initiative = getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
  const hpMax = calcEffectiveHpMax(character)
  const hpCurrent = Math.min(Math.max(0, character.hpCurrent), hpMax)
  const hpTemp = Math.max(0, character.hpTemp)
  const passivePerception = calcPassivePerception(character, profBonus)

  return (
    <div className={styles.viewLayout}>
      {character.avatar && (
        <img
          src={character.avatar}
          alt={`Avatar de ${character.name || 'personagem'}`}
          className={styles.avatar}
        />
      )}
      <div className={styles.view}>
        <h1 className={styles.viewName}>{character.name || '(sem nome)'}</h1>
        <p className={styles.viewMeta}>
          {character.race || '—'} · {character.background || '—'} · {character.alignment || '—'}
        </p>
        <p className={styles.viewDetails}>
          {formatClasses(character.classes)} · Nível {totalLevel(character.classes)}
          {character.xp > 0 && <span className={styles.viewXp}> · XP {character.xp}</span>}
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statChip}>
            <span className={styles.statLabel}>CA</span>
            <strong className={styles.statValue}>{ac}</strong>
          </div>

          <div className={`${styles.statChip} ${styles.statChipHp}`}>
            <span className={styles.statLabel}>PV</span>
            <strong className={styles.statValue}>
              {hpCurrent}<span className={styles.statMax}>/{hpMax}</span>
            </strong>
            {hpTemp > 0 && <span className={styles.statSub}>+{hpTemp} temp</span>}
          </div>

          <div className={styles.statChip}>
            <span className={styles.statLabel}>Iniciativa</span>
            <strong className={styles.statValue}>{fmt(initiative)}</strong>
          </div>

          <div className={styles.statChip}>
            <span className={styles.statLabel}>Deslocamento</span>
            <strong className={styles.statValue}>{character.speed || '—'}</strong>
          </div>

          <div className={styles.statChip}>
            <span className={styles.statLabel}>Proficiência</span>
            <strong className={styles.statValue}>{fmt(profBonus)}</strong>
          </div>

          <div className={styles.statChip}>
            <span className={styles.statLabel}>Percep. Passiva</span>
            <strong className={styles.statValue}>{passivePerception}</strong>
          </div>

          {character.spellcastingAbility && (
            <div className={styles.statChip}>
              <span className={styles.statLabel}>Conjuração</span>
              <strong className={styles.statValue}>
                {character.spellcastingAbility.slice(0, 3).toUpperCase()}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CharacterHeader({
  character,
  isEditMode,
  onChangeCharacter,
  onShortRest,
  onLongRest,
  restFeedback,
}: CharacterHeaderProps) {
  const [showCropper, setShowCropper] = useState(false)

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function setClass(index: number, field: keyof Class, value: string | number) {
    const updated = character.classes.map((currentClass, classIndex) =>
      classIndex === index ? { ...currentClass, [field]: value } : currentClass,
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
      classes: character.classes.filter((_, classIndex) => classIndex !== index),
    })
  }

  function handleAvatarSave(base64: string) {
    onChangeCharacter({ ...character, avatar: base64 })
    setShowCropper(false)
  }

  const avatarElement = character.avatar ? (
    <img
      src={character.avatar}
      alt={`Avatar de ${character.name || 'personagem'}`}
      className={styles.avatar}
    />
  ) : (
    <span className={styles.avatarPlaceholder}>+ Foto</span>
  )

  return (
    <header className={`${panelStyles.panel} ${styles.header}`}>
      {showCropper && (
        <AvatarCropper
          currentImage={character.avatar}
          onSave={handleAvatarSave}
          onCancel={() => setShowCropper(false)}
        />
      )}

      <div className={styles.restActions}>
        <button type="button" className={styles.restButton} onClick={onShortRest}>
          Descanso curto
        </button>
        <button type="button" className={styles.restButton} onClick={onLongRest}>
          Descanso longo
        </button>
        <span aria-live="polite" aria-atomic="true" className={styles.restFeedback}>
          {restFeedback}
        </span>
      </div>

      {isEditMode ? (
        <div className={styles.editLayout}>
          <div className={styles.identityRow}>
            <button
              type="button"
              onClick={() => setShowCropper(true)}
              className={styles.avatarButton}
            >
              {avatarElement}
            </button>

            <div className={styles.identityGrid}>
              <label className={styles.field}>
                Nome
                <input
                  type="text"
                  value={character.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="Nome do personagem"
                />
              </label>

              <label className={styles.field}>
                Raça
                <input
                  type="text"
                  value={character.race}
                  onChange={(event) => set('race', event.target.value)}
                  placeholder="Raça"
                />
              </label>

              <label className={styles.field}>
                Alinhamento
                <input
                  type="text"
                  value={character.alignment}
                  onChange={(event) => set('alignment', event.target.value)}
                  placeholder="Alinhamento"
                />
              </label>

              <label className={styles.field}>
                Antecedente
                <input
                  type="text"
                  value={character.background}
                  onChange={(event) => set('background', event.target.value)}
                  placeholder="Antecedente"
                />
              </label>

              <label className={styles.field}>
                XP
                <NumberInput
                  min={0}
                  value={character.xp}
                  onChange={(value) => set('xp', value)}
                />
              </label>
            </div>
          </div>

          <fieldset className={styles.classFieldset}>
            <legend>Classes</legend>
            <div className={styles.classRows}>
              {character.classes.map((currentClass, index) => (
                <div className={styles.classRow} key={currentClass.id}>
                  <input
                    className={styles.classInput}
                    type="text"
                    value={currentClass.className}
                    onChange={(event) =>
                      setClass(index, 'className', event.target.value)
                    }
                    placeholder="Classe"
                  />
                  <select
                    className={styles.classInput}
                    value={currentClass.hitDice}
                    onChange={(event) => setClass(index, 'hitDice', event.target.value)}
                  >
                    <option value="">Dado de vida</option>
                    {HIT_DICE_OPTIONS.map((hitDice) => (
                      <option key={hitDice} value={hitDice}>
                        {hitDice}
                      </option>
                    ))}
                  </select>
                  <NumberInput
                    className={styles.classInput}
                    min={1}
                    max={20}
                    value={currentClass.level}
                    emptyValue={1}
                    onChange={(value) => setClass(index, 'level', value)}
                  />
                  <input
                    className={styles.classInput}
                    type="text"
                    value={currentClass.subclass}
                    onChange={(event) =>
                      setClass(index, 'subclass', event.target.value)
                    }
                    placeholder="Subclasse"
                  />
                  <div className={styles.classActions}>
                    <button
                      type="button"
                      className={panelStyles.removeButton}
                      onClick={() => removeClass(index)}
                      disabled={character.classes.length <= 1}
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className={panelStyles.addButton} onClick={addClass}>
              + Classe
            </button>
          </fieldset>
        </div>
      ) : (
        <ViewLayout character={character} />
      )}
    </header>
  )
}
