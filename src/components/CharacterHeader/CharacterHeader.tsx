import { useState } from 'react'
import type { Character, Class } from '../../types/system/dnd'
import type { SheetGroup } from '../../types/system/dnd/SheetGroup'
import { AvatarCropper } from '../AvatarCropper/AvatarCropper'
import { NumberInput } from '../NumberInput/NumberInput'
import panelStyles from '../../styles/panel.module.css'
import styles from './CharacterHeader.module.css'

const HIT_DICE_OPTIONS = ['1d6', '1d8', '1d10', '1d12']
const INDEPENDENT_LABEL = 'Personagem Independente'
const MANAGE_VALUE = '__manage__'

interface CharacterHeaderProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
  onShortRest: () => void
  onLongRest: () => void
  restFeedback?: string | null
  groups?: SheetGroup[]
  groupId?: string
  onGroupChange?: (id: string) => void
  onManage?: () => void
  isLoadingGroups?: boolean
}

function formatClasses(classes: Class[]): string {
  return classes
    .map((currentClass) => `${currentClass.className || '—'} ${currentClass.level}`)
    .join(' / ')
}

function totalLevel(classes: Class[]): number {
  return classes.reduce((sum, currentClass) => sum + currentClass.level, 0)
}

function getGroupLabel(groups: SheetGroup[], groupId: string): string {
  const group = groups.find((currentGroup) => currentGroup.id === groupId)
  return group?.name ?? INDEPENDENT_LABEL
}

function ViewLayout({
  character,
  groups,
  groupId,
}: {
  character: Character
  groups: SheetGroup[]
  groupId: string
}) {
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
        <p className={styles.viewGroupMeta}>
          Mesa: {getGroupLabel(groups, groupId)}
        </p>
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
  groups = [],
  groupId = '',
  onGroupChange,
  onManage,
  isLoadingGroups,
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

              {onGroupChange && (
                <label className={styles.field}>
                  Mesa
                  <select
                    value={groupId && groups.some((group) => group.id === groupId) ? groupId : ''}
                    onChange={(event) => {
                      if (event.target.value === MANAGE_VALUE) {
                        onManage?.()
                        return
                      }
                      onGroupChange(event.target.value)
                    }}
                    disabled={isLoadingGroups}
                  >
                    <option value="">{INDEPENDENT_LABEL}</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                    {onManage && <option value={MANAGE_VALUE}>Gerenciar mesas...</option>}
                  </select>
                </label>
              )}
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
        <ViewLayout character={character} groups={groups} groupId={groupId} />
      )}
    </header>
  )
}
