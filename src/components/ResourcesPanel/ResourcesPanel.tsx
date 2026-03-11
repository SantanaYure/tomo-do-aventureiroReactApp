import type { Resource, ResourceReset } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './ResourcesPanel.module.css'

const RESET_LABEL: Record<ResourceReset, string> = {
  'short-rest': 'Desc. curto',
  'long-rest': 'Desc. longo',
  manual: 'Manual',
}

function createResource(): Resource {
  return {
    name: '',
    current: 0,
    max: 0,
    resetOn: 'long-rest',
  }
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
                <>
                  <input
                    className={styles.resourceNameInput}
                    type="text"
                    value={resource.name ?? ''}
                    placeholder="Nome do recurso"
                    onChange={(event) => setResource(index, { name: event.target.value })}
                  />

                  <div className={styles.editRow}>
                    <label>
                      Máx
                      <input
                        type="number"
                        min={0}
                        value={resource.max ?? 0}
                        onChange={(event) => setMax(index, Number(event.target.value))}
                      />
                    </label>

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

                    <button
                      type="button"
                      className={panelStyles.removeButton}
                      onClick={() => removeResource(index)}
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.resourceName}>{resource.name || '(sem nome)'}</div>
                  <div className={styles.resourceReset}>{RESET_LABEL[resource.resetOn ?? 'long-rest']}</div>
                </>
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