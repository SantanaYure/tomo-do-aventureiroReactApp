// src/components/AttacksPanel/AttacksPanel.tsx
// Lista de ataques com nome, bônus, dano, tipo e alcance

import type { Attack } from '../../types/system/dnd'

function createAttack(): Attack {
  return {
    name: '',
    attackBonus: 0,
    damage: '',
    damageType: '',
    range: '',
    notes: '',
  }
}

function formatBonus(value?: number): string {
  if (value === undefined || value === null) return '—'
  return value >= 0 ? `+${value}` : `${value}`
}

interface AttacksPanelProps {
  attacks: Attack[]
  isEditMode: boolean
  onChangeAttacks: (updated: Attack[]) => void
}

export function AttacksPanel({
  attacks,
  isEditMode,
  onChangeAttacks,
}: AttacksPanelProps) {
  function setAttack(index: number, partial: Partial<Attack>) {
    onChangeAttacks(
      attacks.map((a, i) => (i === index ? { ...a, ...partial } : a))
    )
  }

  function addAttack() {
    onChangeAttacks([...attacks, createAttack()])
  }

  function removeAttack(index: number) {
    onChangeAttacks(attacks.filter((_, i) => i !== index))
  }

  if (attacks.length === 0 && !isEditMode) return null

  return (
    <section>
      <h2>Ataques</h2>

      {attacks.length === 0 ? (
        <p>Nenhum ataque cadastrado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Bônus</th>
              <th>Dano</th>
              <th>Tipo</th>
              <th>Alcance</th>
              {isEditMode && <th>Notas</th>}
              {isEditMode && <th></th>}
            </tr>
          </thead>
          <tbody>
            {attacks.map((attack, i) =>
              isEditMode ? (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      value={attack.name ?? ''}
                      placeholder="Nome"
                      onChange={(e) => setAttack(i, { name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={attack.attackBonus ?? 0}
                      onChange={(e) =>
                        setAttack(i, { attackBonus: Number(e.target.value) })
                      }
                      style={{ width: '3.5rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attack.damage ?? ''}
                      placeholder="1d8+3"
                      onChange={(e) => setAttack(i, { damage: e.target.value })}
                      style={{ width: '6rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attack.damageType ?? ''}
                      placeholder="Cortante"
                      onChange={(e) =>
                        setAttack(i, { damageType: e.target.value })
                      }
                      style={{ width: '7rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attack.range ?? ''}
                      placeholder="1,5m"
                      onChange={(e) => setAttack(i, { range: e.target.value })}
                      style={{ width: '5rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={attack.notes ?? ''}
                      placeholder="Observações"
                      onChange={(e) => setAttack(i, { notes: e.target.value })}
                    />
                  </td>
                  <td>
                    <button onClick={() => removeAttack(i)}>Remover</button>
                  </td>
                </tr>
              ) : (
                <tr key={i}>
                  <td>{attack.name || '—'}</td>
                  <td>{formatBonus(attack.attackBonus)}</td>
                  <td>{attack.damage || '—'}</td>
                  <td>{attack.damageType || '—'}</td>
                  <td>{attack.range || '—'}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      {isEditMode && (
        <button onClick={addAttack}>+ Ataque</button>
      )}
    </section>
  )
}