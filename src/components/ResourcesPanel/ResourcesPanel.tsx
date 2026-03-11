import type { Resource, ResourceReset } from '../../types/system/dnd'

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
    <section>
      <h2>Recursos</h2>

      <div>
        <button onClick={() => resetAll('short-rest')}>Descanso curto</button>
        <button onClick={() => resetAll('long-rest')}>Descanso longo</button>
      </div>

      <ul>
        {resources.map((resource, index) => (
          <li key={index}>
            {isEditMode ? (
              <>
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
                    style={{ width: '3.5rem' }}
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

                <button onClick={() => removeResource(index)}>Remover</button>
              </>
            ) : (
              <>
                <strong>{resource.name || '(sem nome)'}</strong>
                <span>{RESET_LABEL[resource.resetOn ?? 'long-rest']}</span>
              </>
            )}

            <button onClick={() => setCurrent(index, (resource.current ?? 0) - 1)}>
              −
            </button>
            <span>
              {resource.current ?? 0} / {resource.max ?? 0}
            </span>
            <button onClick={() => setCurrent(index, (resource.current ?? 0) + 1)}>
              +
            </button>
            <button onClick={() => resetResource(index)} title="Restaurar">
              ↺
            </button>
          </li>
        ))}
      </ul>

      {isEditMode && <button onClick={addResource}>+ Recurso</button>}
    </section>
  )
}