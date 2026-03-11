import type { Resource, ResourceOrigin, ResourceReset } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './ResourcesPanel.module.css'

const RESET_LABEL: Record<ResourceReset, string> = {
  'short-rest': 'Desc. curto',
  'long-rest': 'Desc. longo',
  manual: 'Manual',
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

interface ResourcesPanelProps {
  resources: Resource[]
  isEditMode: boolean
  onChangeResources: (updated: Resource[]) => void
}

export function ResourcesPanel({
  resources,
  isEditMode,
  onChangeResources,
}: ResourcesPanelProps) {
  function setResource(index: number, partial: Partial<Resource>) {
    onChangeResources(
      resources.map((resource, currentIndex) =>
        currentIndex === index ? { ...resource, ...partial } : resource
      )
    )
  }

  function setCurrent(index: number, value: number) {
    const max = resources[index].max ?? 0
    setResource(index, { current: Math.min(max, Math.max(0, value)) })
  }

  function setMax(index: number, value: number) {
    const nextMax = Math.max(0, value)
    const current = resources[index].current ?? 0

    setResource(index, {
      max: nextMax,
      current: Math.min(nextMax, Math.max(0, current)),
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

  function resetAll(type: ResourceReset) {
    onChangeResources(
      resources.map((resource) =>
        resource.resetOn === type
          ? { ...resource, current: resource.max ?? 0 }
          : resource
      )
    )
  }

  if (resources.length === 0 && !isEditMode) return null

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Recursos</h2>

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
          onClick={() => resetAll('long-rest')}
        >
          Descanso longo
        </button>
      </div>

      <div className={styles.resourceList}>
        {resources.map((resource, index) => (
          <div key={index} className={styles.resourceCard}>
            <div>
              {isEditMode ? (
                <div className={styles.editStack}>
                  <input
                    className={styles.resourceNameInput}
                    type="text"
                    value={resource.name ?? ''}
                    placeholder="Nome do recurso"
                    onChange={(event) => setResource(index, { name: event.target.value })}
                  />

                  <div className={styles.editGrid}>
                    <label className={styles.metaField}>
                      Usos
                      <input
                        type="number"
                        min={0}
                        value={resource.max ?? 0}
                        onChange={(event) => setMax(index, Number(event.target.value))}
                      />
                    </label>

                    <label className={styles.metaField}>
                      Ação
                      <input
                        type="text"
                        value={resource.action ?? ''}
                        placeholder="Ação, bônus, reação..."
                        onChange={(event) =>
                          setResource(index, { action: event.target.value })
                        }
                      />
                    </label>

                    <label className={styles.metaField}>
                      Alcance
                      <input
                        type="text"
                        value={resource.range ?? ''}
                        placeholder="Toque, 9 m, pessoal..."
                        onChange={(event) =>
                          setResource(index, { range: event.target.value })
                        }
                      />
                    </label>

                    <label className={styles.metaField}>
                      Reset
                      <select
                        value={resource.resetOn ?? 'long-rest'}
                        onChange={(event) =>
                          setResource(index, {
                            resetOn: event.target.value as ResourceReset,
                          })
                        }
                      >
                        {(Object.keys(RESET_LABEL) as ResourceReset[]).map((key) => (
                          <option key={key} value={key}>
                            {RESET_LABEL[key]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className={styles.originRow}>
                    <label className={panelStyles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={resource.allowCustomOrigin ?? false}
                        onChange={(event) =>
                          setCustomOriginEnabled(index, event.target.checked)
                        }
                      />
                      Origem personalizada
                    </label>

                    {resource.allowCustomOrigin ? (
                      <input
                        className={styles.originInput}
                        type="text"
                        value={resource.customOrigin ?? ''}
                        placeholder="Digite a origem"
                        onChange={(event) =>
                          setResource(index, { customOrigin: event.target.value })
                        }
                      />
                    ) : (
                      <select
                        className={styles.originSelect}
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
                      className={`${panelStyles.removeButton} ${styles.removeAction}`}
                      onClick={() => removeResource(index)}
                    >
                      ✕
                    </button>
                  </div>

                  <textarea
                    className={styles.descriptionInput}
                    rows={3}
                    value={resource.description ?? ''}
                    placeholder="Descrição"
                    onChange={(event) =>
                      setResource(index, { description: event.target.value })
                    }
                  />
                </div>
              ) : (
                <div className={styles.readStack}>
                  <div className={styles.resourceHeader}>
                    <div className={styles.resourceName}>{resource.name || '(sem nome)'}</div>
                    <div className={styles.resourceReset}>{RESET_LABEL[resource.resetOn ?? 'long-rest']}</div>
                  </div>

                  <div className={styles.resourceMetaRow}>
                    {getResourceOriginLabel(resource) && (
                      <span className={styles.resourceMeta}>
                        Origem: {getResourceOriginLabel(resource)}
                      </span>
                    )}
                    {resource.action?.trim() && (
                      <span className={styles.resourceMeta}>Ação: {resource.action}</span>
                    )}
                    {resource.range?.trim() && (
                      <span className={styles.resourceMeta}>Alcance: {resource.range}</span>
                    )}
                  </div>

                  {resource.description?.trim() && (
                    <p className={styles.resourceDescription}>{resource.description}</p>
                  )}
                </div>
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
        ))}
      </div>

      {isEditMode && (
        <button type="button" className={panelStyles.addButton} onClick={addResource}>
          + Recurso
        </button>
      )}
    </section>
  )
}