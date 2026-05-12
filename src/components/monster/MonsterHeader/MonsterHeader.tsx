import { useState } from 'react'
import type { CreatureSize, MonsterKind, MonsterSheet } from '../../../types/system/dnd/monsterSheet'
import type { SheetGroup } from '../../../types/system/dnd/SheetGroup'
import { AvatarCropper } from '../../AvatarCropper/AvatarCropper'
import { GroupSelector } from '../../GroupSelector/GroupSelector'
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

interface MonsterHeaderProps extends MonsterComponentProps {
  groups?: SheetGroup[]
  groupId?: string
  onGroupChange?: (id: string) => void
  onManage?: () => void
  isLoadingGroups?: boolean
}

const MANAGE_VALUE = '__manage__'

export function MonsterHeader({
  sheet,
  isEditing,
  onChange,
  groups = [],
  groupId = '',
  onGroupChange,
  onManage,
  isLoadingGroups,
}: MonsterHeaderProps) {
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
  const guide = details.guide.trim()
  const contentSections = [
    description ? { title: 'Descricao', body: description } : null,
    lore ? { title: 'Sobre', body: lore } : null,
    guide ? { title: 'Guia do Personagem', body: guide } : null,
  ].filter((section): section is { title: string; body: string } => section !== null)

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

          <div className={styles.classeRow}>
            <label className={styles.field}>
              Classe
              <input
                type="text"
                value={details.creatureClass}
                onChange={(event) => updateDetails({ creatureClass: event.target.value })}
                placeholder="Soldado veterano, arcanista, caçador..."
              />
            </label>
            {onGroupChange && (
              <label className={styles.field}>
                Mesa
                <select
                  value={groupId && groups.some((g) => g.id === groupId) ? groupId : ''}
                  onChange={(event) => {
                    if (event.target.value === MANAGE_VALUE) {
                      onManage?.()
                      return
                    }
                    onGroupChange(event.target.value)
                  }}
                  disabled={isLoadingGroups}
                >
                  <option value="">Personagem Independente</option>
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

          <label className={styles.field}>
            Descrição
            <textarea
              value={details.description}
              onChange={(event) => updateDetails({ description: event.target.value })}
              placeholder="Aparência física do personagem, monstro ou criatura"
            />
          </label>

          <label className={styles.field}>
            Sobre
            <textarea
              value={details.lore}
              onChange={(event) => updateDetails({ lore: event.target.value })}
              placeholder="Origem, história e contexto geral"
            />
          </label>

          <label className={styles.field}>
            Guia do Personagem
            <textarea
              value={details.guide}
              onChange={(event) => updateDetails({ guide: event.target.value })}
              placeholder="Como interpretar, manias, voz, postura e detalhes marcantes"
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

          {onGroupChange && (
            <div className={styles.groupSelectorView}>
              <GroupSelector
                groups={groups}
                value={groupId}
                onChange={onGroupChange}
                onManage={onManage}
                loading={isLoadingGroups}
              />
            </div>
          )}

          {contentSections.map((section) => (
            <div key={section.title} className={styles.textSection}>
              <div className={styles.divider} />
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <p className={styles.bodyText}>{section.body}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}