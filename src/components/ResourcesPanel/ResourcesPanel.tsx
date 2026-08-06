import { memo, useCallback, useRef, useState } from 'react'
import type { DamagePart, Resource, ResourceOrigin, ResourceReset } from '../../types/system/dnd'
import { ManagedResourceControls } from '../ManagedResourceControls/ManagedResourceControls'
import { ResourceDots } from '../ResourceDots/ResourceDots'
import { NumberInput } from '../NumberInput/NumberInput'
import { DamagesEditor } from '../DamagesEditor/DamagesEditor'
import {
  restoreResource,
  restoreResourceFull,
  setResourceMax,
  spendResource,
} from '../../utils/manageableResource'
import { isRestBasedReset } from '../../utils/restRules'
import { rollDamages, type DamageRollSummary } from '../../utils/diceRoller'
import { RollResultBlock } from '../RollResultBlock/RollResultBlock'
import panelStyles from '../../styles/panel.module.css'
import styles from './ResourcesPanel.module.css'

const RESET_LABEL: Record<ResourceReset, string> = {
  'short-rest': 'Desc. curto',
  'long-rest': 'Desc. longo',
  manual: 'Manual',
  na: 'N/A',
}

const ORIGIN_OPTIONS: ResourceOrigin[] = [
  'class',
  'subclass',
  'species',
  'background',
  'feat',
  'magic-item',
  'homebrew',
]

const ORIGIN_LABEL: Record<ResourceOrigin, string> = {
  class: 'Classe',
  subclass: 'Subclasse',
  species: 'Espécie',
  background: 'Antecedente',
  feat: 'Talento',
  'magic-item': 'Item Mágico',
  homebrew: 'Homebrew',
}

function createResource(): Resource {
  return {
    // Id de verdade já na criação, como `createFeature()` faz do lado do
    // monstro. O fallback posicional do normalizador é só para ficha antiga.
    id: globalThis.crypto.randomUUID(),
    name: '',
    description: '',
    duration: '',
    range: '',
    action: '',
    current: 0,
    max: 0,
    resetOn: 'long-rest',
    customOrigin: '',
    allowCustomOrigin: false,
    castingTime: '',
    damages: [],
  }
}

function getResourceOriginLabel(resource: Resource): string {
  if (resource.allowCustomOrigin && resource.customOrigin?.trim()) {
    return resource.customOrigin.trim()
  }

  if (resource.origin) {
    return ORIGIN_LABEL[resource.origin]
  }

  return ''
}


interface ResourcesPanelProps {
  resources: Resource[]
  isEditMode: boolean
  onChangeResources: (updated: Resource[]) => void
}

function ResourcesPanelImpl({
  resources,
  isEditMode,
  onChangeResources,
}: ResourcesPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [rollResults, setRollResults] = useState<Map<string, DamageRollSummary>>(new Map())
  // Id estável da habilidade, não o índice: remover ou reordenar não pode fazer
  // o resultado de rolagem (nem o card recolhido) migrar para o vizinho. O
  // fallback posicional só entra se a ficha não passou pelo normalizador.
  // Os handlers abaixo são props dos cards memoizados, então precisam ser
  // estáveis entre renders — um handler novo a cada render invalidaria o memo
  // de todos os cards. Leem `resources` de uma ref.
  const resourcesRef = useRef(resources)
  resourcesRef.current = resources

  const resourceIds = resources.map((resource, index) => resource.id || `resource-${index}`)

  const handleRollDamage = useCallback((resourceId: string, damages: DamagePart[]) => {
    setRollResults((previous) => new Map(previous).set(resourceId, rollDamages(damages)))
  }, [])

  const clearRollResult = useCallback((resourceId: string) => {
    setRollResults((previous) => {
      if (!previous.has(resourceId)) return previous
      const next = new Map(previous)
      next.delete(resourceId)
      return next
    })
  }, [])

  const areAllCollapsed =
    resourceIds.length > 0 && resourceIds.every((resourceId) => collapsedIds.has(resourceId))

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  function toggleCollapseAll() {
    setCollapsedIds(areAllCollapsed ? new Set() : new Set(resourceIds))
  }

  const setResource = useCallback((index: number, partial: Partial<Resource>) => {
    onChangeResources(
      resourcesRef.current.map((resource, currentIndex) =>
        currentIndex === index ? { ...resource, ...partial } : resource,
      ),
    )
  }, [onChangeResources])

  const setMax = useCallback((index: number, value: number) => {
    const resource = resourcesRef.current[index]
    const next = setResourceMax(resource, value)

    setResource(index, {
      max: next.max,
      current: next.current,
    })
  }, [setResource])

  const setLevel = useCallback((index: number, value: string) => {
    setResource(index, {
      level: value.trim() ? Math.max(1, Math.trunc(Number(value))) : undefined,
    })
  }, [setResource])

  const setOrigin = useCallback((index: number, value: string) => {
    setResource(index, {
      origin: value ? (value as ResourceOrigin) : undefined,
    })
  }, [setResource])

  const setCustomOriginEnabled = useCallback((index: number, enabled: boolean) => {
    const resource = resourcesRef.current[index]

    setResource(index, {
      allowCustomOrigin: enabled,
      customOrigin:
        enabled && !(resource.customOrigin ?? '').trim() && resource.origin
          ? ORIGIN_LABEL[resource.origin]
          : resource.customOrigin ?? '',
    })
  }, [setResource])

  function addResource() {
    onChangeResources([...resources, createResource()])
  }

  const removeResource = useCallback((index: number) => {
    onChangeResources(resourcesRef.current.filter((_, currentIndex) => currentIndex !== index))
  }, [onChangeResources])

  const resetResource = useCallback((index: number) => {
    const next = restoreResourceFull(resourcesRef.current[index])
    setResource(index, { current: next.current })
  }, [setResource])

  const spendResourceUse = useCallback((index: number) => {
    const next = spendResource(resourcesRef.current[index])
    setResource(index, { current: next.current })
  }, [setResource])

  const restoreResourceUse = useCallback((index: number) => {
    const next = restoreResource(resourcesRef.current[index])
    setResource(index, { current: next.current })
  }, [setResource])


  if (resources.length === 0 && !isEditMode) return null

  return (
    <section className={panelStyles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={panelStyles.panelTitle}>Habilidades e Traços</h2>

        {!isEditMode && resources.length > 0 && (
          <button
            type="button"
            className={styles.toggleAllButton}
            onClick={toggleCollapseAll}
            aria-pressed={areAllCollapsed}
          >
            {areAllCollapsed ? 'Expandir tudo' : 'Recolher tudo'}
          </button>
        )}
      </div>

      <div className={styles.resourceList}>
        {resources.map((resource, index) => (
          <ResourceCard
            key={resourceIds[index]}
            resource={resource}
            index={index}
            resourceId={resourceIds[index]}
            isEditMode={isEditMode}
            isCollapsed={!isEditMode && collapsedIds.has(resourceIds[index])}
            rollResults={rollResults}
            onToggleCollapse={toggleCollapse}
            onChangeResource={setResource}
            onChangeMax={setMax}
            onChangeLevel={setLevel}
            onChangeOrigin={setOrigin}
            onChangeCustomOriginEnabled={setCustomOriginEnabled}
            onRemoveResource={removeResource}
            onRollDamage={handleRollDamage}
            onClearRoll={clearRollResult}
            onResetResource={resetResource}
            onSpendUse={spendResourceUse}
            onRestoreUse={restoreResourceUse}
          />
        ))}
      </div>

      {isEditMode && (
        <button type="button" className={panelStyles.addButton} onClick={addResource}>
          + Habilidade
        </button>
      )}
    </section>
  )
}

interface ResourceCardProps {
  resource: Resource
  index: number
  resourceId: string
  isEditMode: boolean
  isCollapsed: boolean
  rollResults: Map<string, DamageRollSummary>
  onToggleCollapse: (id: string) => void
  onChangeResource: (index: number, partial: Partial<Resource>) => void
  onChangeMax: (index: number, value: number) => void
  onChangeLevel: (index: number, value: string) => void
  onChangeOrigin: (index: number, value: string) => void
  onChangeCustomOriginEnabled: (index: number, enabled: boolean) => void
  onRemoveResource: (index: number) => void
  onRollDamage: (resourceId: string, damages: DamagePart[]) => void
  onClearRoll: (resourceId: string) => void
  onResetResource: (index: number) => void
  onSpendUse: (index: number) => void
  onRestoreUse: (index: number) => void
}

// Cada habilidade é memoizada: sem isso, digitar em uma re-renderiza todas —
// medido em 10 renders para uma tecla numa lista de 10.
const ResourceCard = memo(function ResourceCard({
  resource,
  index,
  resourceId,
  isEditMode,
  isCollapsed,
  rollResults,
  onToggleCollapse,
  onChangeResource,
  onChangeMax,
  onChangeLevel,
  onChangeOrigin,
  onChangeCustomOriginEnabled,
  onRemoveResource,
  onRollDamage,
  onClearRoll,
  onResetResource,
  onSpendUse,
  onRestoreUse,
}: ResourceCardProps) {
  return (
    <div className={styles.resourceCard}>
      {isEditMode ? (
        <div className={styles.editStack}>
          {/* Linha 1: Nome | Nível | Duração | Ação */}
          <div className={styles.editRow}>
            <input
              className={styles.resourceNameInput}
              type="text"
              value={resource.name ?? ''}
              placeholder="Nome da habilidade"
              onChange={(event) => onChangeResource(index, { name: event.target.value })}
            />
            <input
              className={styles.editFieldSm}
              type="number"
              min={1}
              value={resource.level ?? ''}
              placeholder="Nível"
              onChange={(event) => onChangeLevel(index, event.target.value)}
            />
            <input
              className={styles.editFieldMd}
              type="text"
              value={resource.duration ?? ''}
              placeholder="Duração"
              onChange={(event) => onChangeResource(index, { duration: event.target.value })}
            />
            <input
              className={styles.editFieldMd}
              type="text"
              value={resource.action ?? ''}
              placeholder="Ação"
              onChange={(event) => onChangeResource(index, { action: event.target.value })}
            />
          </div>

          {/* Linha 2: Alcance | Recuperação | Origem personalizada | Origem | ✕ */}
          <div className={styles.editRow}>
            <input
              className={styles.editFieldMd}
              type="text"
              value={resource.range ?? ''}
              placeholder="Alcance"
              onChange={(event) => onChangeResource(index, { range: event.target.value })}
            />
            <select
              className={styles.editFieldMd}
              value={resource.resetOn ?? 'long-rest'}
              onChange={(event) =>
                onChangeResource(index, { resetOn: event.target.value as ResourceReset })
              }
            >
              {(Object.keys(RESET_LABEL) as ResourceReset[]).map((key) => (
                <option key={key} value={key}>
                  {RESET_LABEL[key]}
                </option>
              ))}
            </select>
            <label className={panelStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={resource.allowCustomOrigin ?? false}
                onChange={(event) => onChangeCustomOriginEnabled(index, event.target.checked)}
              />
              Origem personalizada
            </label>
            {resource.allowCustomOrigin ? (
              <input
                className={styles.editFieldMd}
                type="text"
                value={resource.customOrigin ?? ''}
                placeholder="Digite a origem"
                onChange={(event) => onChangeResource(index, { customOrigin: event.target.value })}
              />
            ) : (
              <select
                className={styles.editFieldMd}
                value={resource.origin ?? ''}
                onChange={(event) => onChangeOrigin(index, event.target.value)}
              >
                <option value="">Origem</option>
                {ORIGIN_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {ORIGIN_LABEL[key]}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className={styles.removeAction}
              onClick={() => onRemoveResource(index)}
              aria-label={`Excluir habilidade ${resource.name?.trim() || `#${index + 1}`}`}
              title="Excluir habilidade"
            >
              ✕
            </button>
          </div>

          {/* Linha 3: Tempo de Conjuração */}
          <div className={styles.editRow}>
            <input
              className={styles.editFieldMd}
              type="text"
              value={resource.castingTime ?? ''}
              placeholder="Tempo de Conjuração"
              onChange={(event) => onChangeResource(index, { castingTime: event.target.value })}
            />
          </div>

          <textarea
            className={styles.descriptionInput}
            rows={3}
            value={resource.description ?? ''}
            placeholder="Descrição"
            onChange={(event) => onChangeResource(index, { description: event.target.value })}
          />

          <div className={styles.field}>
            <span className={styles.sectionLabel}>Danos</span>
            <DamagesEditor
              damages={resource.damages ?? []}
              onChange={(updated) => onChangeResource(index, { damages: updated })}
            />
          </div>

          <div className={styles.editRow}>
            <span className={styles.maxLabel}>Máximo de usos</span>
            <NumberInput
              className={styles.maxInput}
              min={0}
              value={resource.max ?? 0}
              onChange={(value) => onChangeMax(index, value)}
            />
            {(resource.max ?? 0) > 0 && (
              <ResourceDots
                current={resource.current ?? 0}
                max={resource.max ?? 0}
                itemName={resource.name ?? ''}
                resourceKind="habilidade"
                onSpend={() => onSpendUse(index)}
                onRestore={
                  isRestBasedReset(resource.resetOn)
                    ? undefined
                    : () => onRestoreUse(index)
                }
              />
            )}
            {(resource.max ?? 0) > 0 && !isRestBasedReset(resource.resetOn) && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => onResetResource(index)}
                disabled={(resource.current ?? 0) >= (resource.max ?? 0)}
                aria-label={`Restaurar todos os usos de habilidade: ${resource.name?.trim() || `#${index + 1}`}`}
              >
                ↺ Restaurar
              </button>
            )}
            {(resource.max ?? 0) > 0 && isRestBasedReset(resource.resetOn) && (
              <span className={styles.restHint}>
                Recupera no {resource.resetOn === 'short-rest' ? 'descanso curto' : 'descanso longo'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={styles.featureHeader}
            onClick={() => onToggleCollapse(resourceId)}
            aria-expanded={!isCollapsed}
          >
            <span className={styles.featureTitle}>
              {resource.name || '(sem nome)'}
            </span>
            <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
          </button>

          {(resource.max ?? 0) > 0 && (
            <div className={styles.usageRow}>
              <ManagedResourceControls
                current={resource.current ?? 0}
                max={resource.max ?? 0}
                itemName={resource.name ?? ''}
                resourceKind="habilidade"
                onSpend={() => onSpendUse(index)}
                onRestore={
                  isRestBasedReset(resource.resetOn)
                    ? undefined
                    : () => onRestoreUse(index)
                }
                onRestoreFull={
                  isRestBasedReset(resource.resetOn)
                    ? undefined
                    : () => onResetResource(index)
                }
                restoreFullText="Restaurar"
              />
            </div>
          )}

          {!isCollapsed && (
            <div className={styles.featureBody}>
              <div className={styles.resourceMetaRow}>
                {getResourceOriginLabel(resource) && (
                  <span className={styles.resourceMeta}>
                    Origem: {getResourceOriginLabel(resource)}
                  </span>
                )}
                {typeof resource.level === 'number' && Number.isFinite(resource.level) && (
                  <span className={styles.resourceMeta}>Nível: {resource.level}</span>
                )}
                {(resource.castingTime ?? '').trim() && (
                  <span className={styles.resourceMeta}>Tempo: {resource.castingTime}</span>
                )}
                {resource.duration?.trim() && (
                  <span className={styles.resourceMeta}>Duração: {resource.duration}</span>
                )}
                {resource.action?.trim() && (
                  <span className={styles.resourceMeta}>Ação: {resource.action}</span>
                )}
                {resource.range?.trim() && (
                  <span className={styles.resourceMeta}>Alcance: {resource.range}</span>
                )}
                <span className={styles.resourceMeta}>
                  {RESET_LABEL[resource.resetOn ?? 'long-rest']}
                </span>
              </div>

              {resource.description?.trim() && (
                <p className={styles.resourceDescription}>{resource.description}</p>
              )}

              {(resource.damages ?? []).length > 0 && (
                <div className={styles.rollArea}>
                  <button
                    type="button"
                    className={styles.rollBtn}
                    onClick={() => onRollDamage(resourceId, resource.damages ?? [])}
                  >
                    🎲 Rolar dano
                  </button>
                  {rollResults.has(resourceId) && (
                    <RollResultBlock
                      summary={rollResults.get(resourceId)!}
                      itemName={resource.name}
                      onClear={() => onClearRoll(resourceId)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
})

// Memoizado: os painéis recebem props estreitas e handlers estáveis da
// página, então a comparação rasa aborta o render quando a edição foi em
// outra parte da ficha.
export const ResourcesPanel = memo(ResourcesPanelImpl)
