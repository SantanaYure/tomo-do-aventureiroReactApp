// src/components/AttacksPanel/AttacksPanel.tsx
// Lista de ataques com nome, bônus, dano, tipo e alcance

import type { Attack, Character } from '../../types/system/dnd'
import { findMatchingWeaponProficiency } from '../../utils/weaponCatalog'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'

function createAttack(): Attack {
  return {
    name: '',
    attackBonus: 0,
    attributeKey: '',
    useProficiency: false,
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

function getCalculatedAttackBonus(attack: Attack, character: Character): number | undefined {
  if (!attack.attributeKey) {
    return attack.attackBonus
  }

  const attribute = character.attributes.find((item) => item.name === attack.attributeKey)
  const attributeModifier = attribute ? calcModifier(attribute.value) : 0
  const matchedWeaponProficiency = findMatchingWeaponProficiency(
    attack.name ?? '',
    character.weaponProficiencies,
  )
  const proficiencyBonus =
    attack.useProficiency && matchedWeaponProficiency
      ? calcProficiencyBonus(character.classes)
      : 0

  return attributeModifier + proficiencyBonus
}

function getAttributeKey(
  rawValue: string,
  character: Character,
): Attack['attributeKey'] {
  const matchedAttribute = character.attributes.find((attribute) => attribute.name === rawValue)

  return matchedAttribute?.name ?? ''
}

interface AttacksPanelProps {
  attacks: Attack[]
  character: Character
  isEditMode: boolean
  onChangeAttacks: (updated: Attack[]) => void
}

export function AttacksPanel({
  attacks,
  character,
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
            {attacks.map((attack, i) => {
              const matchedWeaponProficiency = findMatchingWeaponProficiency(
                attack.name ?? '',
                character.weaponProficiencies,
              )
              const calculatedAttackBonus = getCalculatedAttackBonus(attack, character)

              return isEditMode ? (
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
                    <div>
                      <select
                        value={attack.attributeKey ?? ''}
                        onChange={(e) =>
                          setAttack(i, {
                            attributeKey: getAttributeKey(e.target.value, character),
                          })
                        }
                      >
                        <option value="">Manual</option>
                        {character.attributes.map((attribute) => (
                          <option key={attribute.name} value={attribute.name}>
                            {attribute.name}
                          </option>
                        ))}
                      </select>

                      {attack.attributeKey ? (
                        <>
                          <label>
                            Prof.
                            <input
                              type="checkbox"
                              checked={attack.useProficiency ?? false}
                              onChange={(e) =>
                                setAttack(i, { useProficiency: e.target.checked })
                              }
                            />
                          </label>
                          <strong>{formatBonus(calculatedAttackBonus)}</strong>
                          {attack.useProficiency && !matchedWeaponProficiency && (
                            <small>
                              Sem proficiência correspondente na ficha.
                            </small>
                          )}
                          {matchedWeaponProficiency && (
                            <small>Proficiência: {matchedWeaponProficiency}</small>
                          )}
                        </>
                      ) : (
                        <input
                          type="number"
                          value={attack.attackBonus ?? 0}
                          onChange={(e) =>
                            setAttack(i, { attackBonus: Number(e.target.value) })
                          }
                          style={{ width: '3.5rem' }}
                        />
                      )}
                    </div>
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
                  <td>{formatBonus(calculatedAttackBonus)}</td>
                  <td>{attack.damage || '—'}</td>
                  <td>{attack.damageType || '—'}</td>
                  <td>{attack.range || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {isEditMode && (
        <button onClick={addAttack}>+ Ataque</button>
      )}
    </section>
  )
}