// src/components/InventoryPanel/InventoryPanel.tsx
import type { Character, Currency, InventoryItem } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './InventoryPanel.module.css'

const CURRENCY_LABEL: Record<keyof Currency, string> = { cp: 'PC', sp: 'PP', ep: 'PE', gp: 'PO', pp: 'PP (Platina)' }

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

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Inventário</h2>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-4)', textAlign: 'right', marginTop: '-var(--space-3)' }}>
        Peso total: {totalWeight(inventory).toFixed(1)} kg
      </p>

      {/* Moedas */}
      <div className={styles.coinsSection}>
        <div className={styles.coinsTitle}>Moedas</div>
        <div className={styles.coinsGrid}>
          {CURRENCY_ORDER.map((key) => (
            <div key={key} className={styles.coinBlock}>
              <span className={styles.coinLabel}>{CURRENCY_LABEL[key]}</span>
              {isEditMode
                ? <input className={styles.coinInput} type="number" min={0} value={character.currency[key]} onChange={(e) => setCurrency(key, Number(e.target.value))} />
                : <span className={styles.coinValue}>{character.currency[key]}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Itens */}
      {inventory.length === 0 && !isEditMode ? (
        <p className={panelStyles.emptyState}>Nenhum item.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.inventoryTable}>
            <thead>
              <tr>
                <th className={styles.equippedTd}>Equip.</th>
                <th className={styles.nameTd}>Nome</th>
                <th className={styles.qtyTd}>Qtd</th>
                <th className={styles.weightTd}>Peso (kg)</th>
                {isEditMode && <th>Descrição</th>}
                {isEditMode && <th></th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={String(item.id ?? i)}>
                  <td className={styles.equippedTd}>
                    <input type="checkbox" checked={item.equipped ?? false} onChange={(e) => setItem(i, { equipped: e.target.checked })} />
                  </td>
                  <td className={styles.nameTd}>
                    {isEditMode
                      ? <input type="text" value={item.name ?? ''} placeholder="Nome do item" onChange={(e) => setItem(i, { name: e.target.value })} />
                      : <span>{item.name || '—'}</span>}
                  </td>
                  <td className={styles.qtyTd}>
                    {isEditMode
                      ? <input type="number" min={0} value={item.quantity ?? 1} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                      : <span>{item.quantity ?? 1}</span>}
                  </td>
                  <td className={styles.weightTd}>
                    {isEditMode
                      ? <input type="number" min={0} step={0.1} value={item.weight ?? 0} onChange={(e) => setItem(i, { weight: Number(e.target.value) })} />
                      : <span>{item.weight ?? 0}</span>}
                  </td>
                  {isEditMode && <td><input type="text" value={String(item.description ?? '')} placeholder="Descrição" onChange={(e) => setItem(i, { description: e.target.value })} /></td>}
                  {isEditMode && <td><button className={panelStyles.removeButton} onClick={() => removeItem(i)}>✕</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditMode && <button className={panelStyles.addButton} onClick={addItem}>+ Item</button>}
    </section>
  )
}