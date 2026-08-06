import { useCallback, useRef, memo } from 'react'
// src/components/InventoryPanel/InventoryPanel.tsx
import type { Character, Currency, InventoryItem } from '../../types/system/dnd'
import { NumberInput } from '../NumberInput/NumberInput'
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

interface InventoryRowProps {
  item: InventoryItem
  index: number
  isEditMode: boolean
  onChangeItem: (index: number, partial: Partial<InventoryItem>) => void
  onRemoveItem: (index: number) => void
}

// Cada linha é memoizada: sem isso, digitar no item 3 de uma lista de 200
// re-renderiza os 200. Medido: ~13 nós de DOM por item.
const InventoryRow = memo(function InventoryRow({
  item,
  index,
  isEditMode,
  onChangeItem,
  onRemoveItem,
}: InventoryRowProps) {
  return (
    <tr>
      <td className={styles.equippedTd}>
        <input type="checkbox" checked={item.equipped ?? false} onChange={(e) => onChangeItem(index, { equipped: e.target.checked })} />
      </td>
      <td className={styles.nameTd}>
        {isEditMode
          ? <input type="text" value={item.name ?? ''} placeholder="Nome do item" onChange={(e) => onChangeItem(index, { name: e.target.value })} />
          : <span>{item.name || '—'}</span>}
      </td>
      <td className={styles.qtyTd}>
        {isEditMode
          ? <NumberInput min={0} value={item.quantity ?? 1} emptyValue={1} onChange={(value) => onChangeItem(index, { quantity: value })} />
          : <span>{item.quantity ?? 1}</span>}
      </td>
      <td className={styles.weightTd}>
        {isEditMode
          ? <NumberInput min={0} step={0.1} value={item.weight ?? 0} onChange={(value) => onChangeItem(index, { weight: value })} />
          : <span>{item.weight ?? 0}</span>}
      </td>
      {isEditMode && <td><input type="text" value={String(item.description ?? '')} placeholder="Descrição" onChange={(e) => onChangeItem(index, { description: e.target.value })} /></td>}
      {isEditMode && <td><button className={panelStyles.removeButton} onClick={() => onRemoveItem(index)}>✕</button></td>}
    </tr>
  )
})

function InventoryPanelImpl({
  inventory,
  character,
  isEditMode,
  onChangeInventory,
  onChangeCharacter,
}: InventoryPanelProps) {
  // Estáveis entre renders: são props das linhas memoizadas, e um handler novo
  // a cada render anularia o memo de todas elas. Leem `inventory` de uma ref
  // para não depender da identidade do array.
  const inventoryRef = useRef(inventory)
  inventoryRef.current = inventory

  const setItem = useCallback((index: number, partial: Partial<InventoryItem>) => {
    onChangeInventory(
      inventoryRef.current.map((item, i) => (i === index ? { ...item, ...partial } : item))
    )
  }, [onChangeInventory])

  function addItem() {
    onChangeInventory([...inventory, createItem()])
  }

  const removeItem = useCallback((index: number) => {
    onChangeInventory(inventoryRef.current.filter((_, i) => i !== index))
  }, [onChangeInventory])

  function setCurrency(key: keyof Currency, value: number) {
    onChangeCharacter({
      ...character,
      currency: { ...character.currency, [key]: Math.max(0, value) },
    })
  }

  return (
    <section className={panelStyles.panel}>
      <h2 className={panelStyles.panelTitle}>Inventário</h2>
      <p className={styles.weightNote}>
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
                ? <NumberInput className={styles.coinInput} min={0} value={character.currency[key]} onChange={(value) => setCurrency(key, value)} />
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
                <InventoryRow
                  key={String(item.id ?? i)}
                  item={item}
                  index={i}
                  isEditMode={isEditMode}
                  onChangeItem={setItem}
                  onRemoveItem={removeItem}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditMode && <button className={panelStyles.addButton} onClick={addItem}>+ Item</button>}
    </section>
  )
}

// Memoizado: os painéis recebem props estreitas e handlers estáveis da
// página, então a comparação rasa aborta o render quando a edição foi em
// outra parte da ficha.
export const InventoryPanel = memo(InventoryPanelImpl)
