import { useState } from 'react'
import type { CreatureSize, MonsterKind, MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import { AvatarCropper } from '../../AvatarCropper/AvatarCropper'
import panelStyles from '../../../styles/panel.module.css'
import type { DeepPartial, MonsterComponentProps } from '../shared'
import styles from './MonsterHeader.module.css'

const SIZE_OPTIONS: CreatureSize[] = [
  'Minúsculo',
  'Pequeno',
  'Médio',
  'Grande',
  'Enorme',
  'Colossal',
]

const KIND_LABELS: Record<MonsterKind, string> = {
  monster: 'Monstro',
  npc: 'NPC',
}

function buildMeta(details: MonsterSheet['details']): string {
  const parts = [details.species, details.size, details.alignment].filter(
    (value): value is string => value.trim().length > 0,
  )

  return parts.length > 0 ? parts.join(' · ') : 'Espécie, tamanho e alinhamento não informados'
}

export function MonsterHeader({ sheet, isEditing, onChange }: MonsterComponentProps) {
  const { details } = sheet
  const [showCropper, setShowCropper] = useState(false)

  function updateDetails(patch: DeepPartial<MonsterSheet['details']>) {
    onChange({ details: patch })
  }

  function handleAvatarSave(base64: string) {
    updateDetails({ avatar: base64 })
    setShowCropper(false)
  }

  const meta = buildMeta(details)
  const description = details.description.trim()
  const lore = details.lore.trim()

  const avatarElement = details.avatar ? (
    <img src={details.avatar} alt={`Foto de ${details.name || 'monstro'}`} className={styles.avatar} />
  ) : (
    <span className={styles.avatarPlaceholder}>+ Foto</span>
  )

  return (
    <header className={`${panelStyles.panel} ${styles.header}`}>
      {showCropper && (
        <AvatarCropper
          currentImage={details.avatar || undefined}
          onSave={handleAvatarSave}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {isEditing ? (
        <div className={styles.editLayout}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setShowCropper(true)}
          >
            {avatarElement}
          </button>

          <label className={`${styles.field} ${styles.nameField}`}>
            Nome
            <input
              type="text"
              value={details.name}
              onChange={(event) => updateDetails({ name: event.target.value })}
              placeholder="Nome do monstro ou NPC"
            />
          </label>

          <label className={styles.field}>
            Tipo
            <select
              value={details.kind}
              onChange={(event) => updateDetails({ kind: event.target.value as MonsterKind })}
            >
              <option value="monster">Monstro</option>
              <option value="npc">NPC</option>
            </select>
          </label>

          <div className={styles.metaGrid}>
            <label className={styles.field}>
              Espécie
              <input
                type="text"
                value={details.species}
                onChange={(event) => updateDetails({ species: event.target.value })}
                placeholder="Humanoide, fera, construto..."
              />
            </label>

            <label className={styles.field}>
              Tamanho
              <select
                value={details.size}
                onChange={(event) =>
                  updateDetails({ size: event.target.value as CreatureSize | '' })
                }
              >
                <option value="">Selecione</option>
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Alinhamento
              <input
                type="text"
                value={details.alignment}
                onChange={(event) => updateDetails({ alignment: event.target.value })}
                placeholder="Leal e bom, neutro..."
              />
            </label>
          </div>

          <label className={styles.field}>
            Classe/Tipo
            <input
              type="text"
              value={details.creatureClass}
              onChange={(event) => updateDetails({ creatureClass: event.target.value })}
              placeholder="Soldado veterano, dragão, morto-vivo..."
            />
          </label>

          <label className={styles.field}>
            Descrição
            <textarea
              value={details.description}
              onChange={(event) => updateDetails({ description: event.target.value })}
              placeholder="Descrição curta da criatura"
            />
          </label>

          <label className={styles.field}>
            Sobre
            <textarea
              value={details.lore}
              onChange={(event) => updateDetails({ lore: event.target.value })}
              placeholder="Contexto, história e observações"
            />
          </label>
        </div>
      ) : (
        <div className={styles.viewLayout}>
          {details.avatar && (
            <img
              src={details.avatar}
              alt={`Foto de ${details.name || 'monstro'}`}
              className={styles.avatarView}
            />
          )}
          <h1 className={styles.name}>{details.name || '(sem nome)'}</h1>
          <p className={styles.kindBadge}>{KIND_LABELS[details.kind]}</p>
          <p className={styles.meta}>{meta}</p>
          {details.creatureClass.trim().length > 0 ? (
            <p className={styles.classification}>{details.creatureClass}</p>
          ) : null}

          <div className={styles.divider} />
          <p className={description ? styles.bodyText : styles.placeholder}>
            {description || 'Descrição não informada.'}
          </p>

          <div className={styles.divider} />
          <p className={lore ? styles.bodyText : styles.placeholder}>
            {lore || 'Sem informações adicionais.'}
          </p>
        </div>
      )}
    </header>
  )
}