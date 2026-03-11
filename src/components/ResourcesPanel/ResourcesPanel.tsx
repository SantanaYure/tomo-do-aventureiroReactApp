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
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Recursos</h2>
        <p className={styles.headerNote}>Controle rápido de usos, cargas e recargas.</p>
      </div>

      <div className={styles.resetActions}>
        <button className={panelStyles.ghostButton} onClick={() => resetAll('short-rest')}>
          Descanso curto
        </button>
        <button className={panelStyles.ghostButton} onClick={() => resetAll('long-rest')}>
          Descanso longo
        </button>
      </div>

      <ul className={styles.list}>
        {resources.map((resource, index) => (
          <li className={styles.item} key={index}>
            {isEditMode ? (
              <div className={styles.editFields}>
                <input
                  type="text"
                  value={resource.name ?? ''}
                  placeholder="Nome do recurso"
                  onChange={(event) =>
                    setResource(index, { name: event.target.value })
                  }
                />

                <label>
                  Máx
                  <input
                    type="number"
                    min={0}
                    value={resource.max ?? 0}
                    onChange={(event) =>
                      setResource(index, { max: Number(event.target.value) })
                    }
                    className={panelStyles.compactInput}
                  />
                </label>

                <label>
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

                <button className={panelStyles.removeButton} onClick={() => removeResource(index)}>
                  Remover
                </button>
              </div>
            ) : (
              <div className={styles.viewFields}>
                <strong className={styles.resourceName}>{resource.name || '(sem nome)'}</strong>
                <span className={styles.resourceReset}>{RESET_LABEL[resource.resetOn ?? 'long-rest']}</span>
              </div>
            )}

            <div className={styles.counterRow}>
              <div className={styles.counter}>
                <button onClick={() => setCurrent(index, (resource.current ?? 0) - 1)}>
                  −
                </button>
                <span className={styles.counterValue}>
                  {resource.current ?? 0} / {resource.max ?? 0}
                </span>
                <button onClick={() => setCurrent(index, (resource.current ?? 0) + 1)}>
                  +
                </button>
              </div>

              <div className={styles.itemActions}>
                <button className={panelStyles.ghostButton} onClick={() => resetResource(index)} title="Restaurar">
                  ↺ Restaurar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isEditMode && <button className={panelStyles.addButton} onClick={addResource}>+ Recurso</button>}
    </section>
  )
}