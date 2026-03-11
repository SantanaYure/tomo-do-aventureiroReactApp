// src/components/InventoryPanel/InventoryPanel.tsx
// Itens do inventário com quantidade, peso, equipado e moedas

import type { Character, Currency, InventoryItem } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './InventoryPanel.module.css'

const CURRENCY_LABEL: Record<keyof Currency, string> = {
  cp: 'PC', sp: 'PP', ep: 'PE', gp: 'PO', pp: 'PP (platina)',
}

const CURRENCY_ORDER: (keyof Currency)[] = ['cp', 'sp', 'ep', 'gp', 'pp']

function createItem(): InventoryItem {
  return {
    id: Date.now(),
    name: '',
    quantity: 1,
    weight: 0,
    equipped: false,
    description: '',
  }
}

function totalWeight(items: InventoryItem[]): number {
  return items.reduce((sum, item) => {
    return sum + (item.weight ?? 0) * (item.quantity ?? 1)
  }, 0)
}

interface InventoryPanelProps {
  inventory: InventoryItem[]
  character: Character
  isEditMode: boolean
  onChangeInventory: (updated: InventoryItem[]) => void
  onChangeCharacter: (updated: Character) => void
}

export function InventoryPanel({
  inventory,
  character,
  isEditMode,
  onChangeInventory,
  onChangeCharacter,
}: InventoryPanelProps) {
  function setItem(index: number, partial: Partial<InventoryItem>) {
    onChangeInventory(
      inventory.map((item, i) => (i === index ? { ...item, ...partial } : item))
    )
  }

  function addItem() {
    onChangeInventory([...inventory, createItem()])
  }

  function removeItem(index: number) {
    onChangeInventory(inventory.filter((_, i) => i !== index))
  }

  function setCurrency(key: keyof Currency, value: number) {
    onChangeCharacter({
      ...character,
      currency: { ...character.currency, [key]: Math.max(0, value) },
    })
  }

  const weight = totalWeight(inventory)

  return (
    <section className={panelStyles.panel}>
      <div className={panelStyles.panelHeader}>
        <h2 className={panelStyles.panelTitle}>Inventário</h2>
        <p className={styles.weightSummary}>Peso total: {weight.toFixed(1)} kg</p>
      </div>

      <div className={panelStyles.section}>
        <h3 className={panelStyles.sectionTitle}>Moedas</h3>
        <div className={styles.currencyGrid}>
        {CURRENCY_ORDER.map((key) => (
          <div className={styles.currencyCard} key={key}>
            <span className={styles.currencyLabel}>{CURRENCY_LABEL[key]}</span>
            {isEditMode ? (
              <input
                className={panelStyles.narrowInput}
                type="number"
                min={0}
                value={character.currency[key]}
                onChange={(e) => setCurrency(key, Number(e.target.value))}
              />
            ) : (
              <strong className={styles.currencyValue}>{character.currency[key]}</strong>
            )}
          </div>
        ))}
        </div>
      </div>

      <div className={panelStyles.section}>
        {inventory.length === 0 && !isEditMode ? (
          <p className={panelStyles.emptyState}>Nenhum item.</p>
        ) : (
          <div className={panelStyles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Equip.</th>
                  <th>Nome</th>
                  <th>Qtd</th>
                  <th>Peso (kg)</th>
                  {isEditMode && <th>Descrição</th>}
                  {isEditMode && <th></th>}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, i) => (
                  <tr key={String(item.id ?? i)}>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.equipped ?? false}
                        onChange={(e) => setItem(i, { equipped: e.target.checked })}
                      />
                    </td>

                    <td>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={item.name ?? ''}
                          placeholder="Nome do item"
                          onChange={(e) => setItem(i, { name: e.target.value })}
                        />
                      ) : (
                        <span>{item.name || '—'}</span>
                      )}
                    </td>

                    <td>
                      {isEditMode ? (
                        <input
                          className={styles.quantityInput}
                          type="number"
                          min={0}
                          value={item.quantity ?? 1}
                          onChange={(e) =>
                            setItem(i, { quantity: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <span>{item.quantity ?? 1}</span>
                      )}
                    </td>

                    <td>
                      {isEditMode ? (
                        <input
                          className={styles.weightInput}
                          type="number"
                          min={0}
                          step={0.1}
                          value={item.weight ?? 0}
                          onChange={(e) =>
                            setItem(i, { weight: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <span>{item.weight ?? 0}</span>
                      )}
                    </td>

                    {isEditMode && (
                      <td>
                        <input
                          className={styles.descriptionInput}
                          type="text"
                          value={String(item.description ?? '')}
                          placeholder="Descrição"
                          onChange={(e) =>
                            setItem(i, { description: e.target.value })
                          }
                        />
                      </td>
                    )}

                    {isEditMode && (
                      <td>
                        <button className={panelStyles.removeButton} onClick={() => removeItem(i)}>
                          Remover
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isEditMode && (
          <button className={panelStyles.addButton} onClick={addItem}>+ Item</button>
        )}
      </div>
    </section>
  )
}