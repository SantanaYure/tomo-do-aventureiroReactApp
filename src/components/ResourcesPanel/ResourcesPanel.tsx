import { useState } from 'react'
import type { Resource, ResourceOrigin, ResourceReset } from '../../types/system/dnd'
import { NumberInput } from '../NumberInput/NumberInput'
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

function getResourceCollapsedMeta(resource: Resource): string {
  const current = resource.current ?? 0
  const max = resource.max ?? 0

  if (max > 0) {
    return `${current}/${max} usos`
  }

  if (typeof resource.level === 'number' && Number.isFinite(resource.level)) {
    return `Nível ${resource.level}`
  }

  return ''
}

interface ResourcesPanelProps {
  resources: Resource[]
  isEditMode: boolean
  onChangeResources: (updated: Resource[]) => void
  onLongRest?: (updatedResources: Resource[]) => void
}

export function ResourcesPanel({
  resources,
  isEditMode,
  onChangeResources,
  onLongRest,
}: ResourcesPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const resourceIds = resources.map((_, index) => `resource-${index}`)
  const areAllCollapsed =
    resourceIds.length > 0 && resourceIds.every((resourceId) => collapsedIds.has(resourceId))

  function toggleCollapse(id: string) {
    setCollapsedIds((previous) => {
      const next = new Set(previous)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  function toggleCollapseAll() {
    setCollapsedIds(areAllCollapsed ? new Set() : new Set(resourceIds))
  }

  function setResource(index: number, partial: Partial<Resource>) {
    onChangeResources(
      resources.map((resource, currentIndex) =>
        currentIndex === index ? { ...resource, ...partial } : resource,
      ),
    )
  }

  function setCurrent(index: number, value: number) {
    const max = resources[index].max ?? 0
    setResource(index, { current: Math.min(max, Math.max(0, value)) })
  }

  function setMax(index: number, value: number) {
    const resource = resources[index]
    const nextMax = Math.max(0, value)
    const previousMax = resource.max ?? 0
    const current = Math.max(0, resource.current ?? 0)
    const nextCurrent =
      previousMax === 0 || current >= previousMax
        ? nextMax
        : Math.min(nextMax, current)

    setResource(index, {
      max: nextMax,
      current: nextCurrent,
    })
  }

  function setLevel(index: number, value: string) {
    setResource(index, {
      level: value.trim() ? Math.max(1, Math.trunc(Number(value))) : undefined,
    })
  }

  function setOrigin(index: number, value: string) {
    setResource(index, {
      origin: value ? (value as ResourceOrigin) : undefined,
    })
  }

  function setCustomOriginEnabled(index: number, enabled: boolean) {
    const resource = resources[index]

    setResource(index, {
      allowCustomOrigin: enabled,
      customOrigin:
        enabled && !(resource.customOrigin ?? '').trim() && resource.origin
          ? ORIGIN_LABEL[resource.origin]
          : resource.customOrigin ?? '',
    })
  }

  function addResource() {
    onChangeResources([...resources, createResource()])
  }

  function removeResource(index: number) {
    onChangeResources(resources.filter((_, currentIndex) => currentIndex !== index))
  }

  function resetResource(index: number) {
    const resource = resources[index]
    setResource(index, { current: resource.max ?? 0 })
  }

  function computeReset(type: ResourceReset): Resource[] {
    return resources.map((resource) =>
      resource.resetOn === type
        ? { ...resource, current: resource.max ?? 0 }
        : resource,
    )
  }

  function resetAll(type: ResourceReset) {
    onChangeResources(computeReset(type))
  }

  function handleLongRestClick() {
    const updated = computeReset('long-rest')
    if (onLongRest) {
      onLongRest(updated)
    } else {
      onChangeResources(updated)
    }
  }

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

      <div className={styles.restRow}>
        <button
          type="button"
          className={styles.restBtn}
          onClick={() => resetAll('short-rest')}
        >
          Descanso curto
        </button>

        <button
          type="button"
          className={styles.restBtn}
          onClick={handleLongRestClick}
        >
          Descanso longo
        </button>
      </div>

      <div className={styles.resourceList}>
        {resources.map((resource, index) => {
          const resourceId = resourceIds[index]
          const isCollapsed = !isEditMode && collapsedIds.has(resourceId)
          const collapsedMeta = getResourceCollapsedMeta(resource)

          return (
            <div key={resourceId} className={styles.resourceCard}>
              {isEditMode ? (
                <div className={styles.editStack}>
                  {/* Linha 1: Nome | Nível | Duração | Ação */}
                  <div className={styles.editRow}>
                    <input
                      className={styles.resourceNameInput}
                      type="text"
                      value={resource.name ?? ''}
                      placeholder="Nome do recurso"
                      onChange={(event) => setResource(index, { name: event.target.value })}
                    />
                    <input
                      className={styles.editFieldSm}
                      type="number"
                      min={1}
                      value={resource.level ?? ''}
                      placeholder="Nível"
                      onChange={(event) => setLevel(index, event.target.value)}
                    />
                    <input
                      className={styles.editFieldMd}
                      type="text"
                      value={resource.duration ?? ''}
                      placeholder="Duração"
                      onChange={(event) => setResource(index, { duration: event.target.value })}
                    />
                    <input
                      className={styles.editFieldMd}
                      type="text"
                      value={resource.action ?? ''}
                      placeholder="Ação"
                      onChange={(event) => setResource(index, { action: event.target.value })}
                    />
                  </div>

                  {/* Linha 2: Alcance | Recuperação | Origem personalizada | Origem | ✕ */}
                  <div className={styles.editRow}>
                    <input
                      className={styles.editFieldMd}
                      type="text"
                      value={resource.range ?? ''}
                      placeholder="Alcance"
                      onChange={(event) => setResource(index, { range: event.target.value })}
                    />
                    <select
                      className={styles.editFieldMd}
                      value={resource.resetOn ?? 'long-rest'}
                      onChange={(event) =>
                        setResource(index, { resetOn: event.target.value as ResourceReset })
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
                        onChange={(event) => setCustomOriginEnabled(index, event.target.checked)}
                      />
                      Origem personalizada
                    </label>
                    {resource.allowCustomOrigin ? (
                      <input
                        className={styles.editFieldMd}
                        type="text"
                        value={resource.customOrigin ?? ''}
                        placeholder="Digite a origem"
                        onChange={(event) => setResource(index, { customOrigin: event.target.value })}
                      />
                    ) : (
                      <select
                        className={styles.editFieldMd}
                        value={resource.origin ?? ''}
                        onChange={(event) => setOrigin(index, event.target.value)}
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
                      onClick={() => removeResource(index)}
                      aria-label={`Excluir recurso ${resource.name?.trim() || `#${index + 1}`}`}
                      title="Excluir recurso"
                    >
                      ✕
                    </button>
                  </div>

                  <textarea
                    className={styles.descriptionInput}
                    rows={3}
                    value={resource.description ?? ''}
                    placeholder="Descrição"
                    onChange={(event) => setResource(index, { description: event.target.value })}
                  />

                  <div className={styles.editRow}>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => setCurrent(index, (resource.current ?? 0) - 1)}
                    >
                      −
                    </button>
                    <span className={styles.counterVal}>
                      {resource.current ?? 0}
                      <span className={styles.counterMax}> / </span>
                    </span>
                    <NumberInput
                      className={styles.maxInput}
                      min={0}
                      value={resource.max ?? 0}
                      onChange={(value) => setMax(index, value)}
                    />
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => setCurrent(index, (resource.current ?? 0) + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className={styles.resetBtn}
                      onClick={() => resetResource(index)}
                    >
                      ↺ Restaurar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className={`${styles.resourceHeader} ${styles.featureHeader}`}
                    onClick={() => toggleCollapse(resourceId)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className={`${styles.resourceName} ${styles.featureTitle}`}>
                      {resource.name || '(sem nome)'}
                    </span>
                    {collapsedMeta && (
                      <span className={`${styles.resourceReset} ${styles.featureMeta}`}>
                        {collapsedMeta}
                      </span>
                    )}
                    <span className={styles.collapseIcon}>{isCollapsed ? '▸' : '▾'}</span>
                  </button>

                  {!isCollapsed && (
                    <div className={styles.featureBody}>
                      <div className={styles.readStack}>
                        <div className={styles.resourceMetaRow}>
                          {getResourceOriginLabel(resource) && (
                            <span className={styles.resourceMeta}>
                              Origem: {getResourceOriginLabel(resource)}
                            </span>
                          )}
                          {typeof resource.level === 'number' && Number.isFinite(resource.level) && (
                            <span className={styles.resourceMeta}>Nível: {resource.level}</span>
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
                      </div>

                      <div className={styles.counter}>
                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => setCurrent(index, (resource.current ?? 0) - 1)}
                        >
                          −
                        </button>

                        <span className={styles.counterVal}>
                          {resource.current ?? 0}
                          <span className={styles.counterMax}> / {resource.max ?? 0}</span>
                        </span>

                        <button
                          type="button"
                          className={styles.counterBtn}
                          onClick={() => setCurrent(index, (resource.current ?? 0) + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.resetBtn}
                        onClick={() => resetResource(index)}
                      >
                        ↺ Restaurar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {isEditMode && (
        <button type="button" className={panelStyles.addButton} onClick={addResource}>
          + Recurso
        </button>
      )}
    </section>
  )
}
