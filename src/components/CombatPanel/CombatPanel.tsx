// src/components/CombatPanel/CombatPanel.tsx
// CA, iniciativa, HP (máx/atual/temp), velocidade, dados de vida e death saves

import type { Character } from '../../types/system/dnd'
import { calcModifier, calcProficiencyBonus } from '../AttributesPanel/AttributesPanel'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function getAttrMod(character: Character, name: string): number {
  const attr = character.attributes.find((a) => a.name === name)
  return attr ? calcModifier(attr.value) : 0
}

function calcAC(character: Character): number {
  const dexMod = getAttrMod(character, 'Destreza')
  return character.armorClassBase + dexMod
}

function calcInitiative(character: Character): number {
  return getAttrMod(character, 'Destreza') + character.initiativeBonusExtra
}

function totalHitDice(character: Character): string {
  return character.classes
    .map((c) => `${c.level}${c.hitDice.replace(/^\d+/, '')}`)
    .join(' + ')
}

// ─── props ───────────────────────────────────────────────────────────────────

interface CombatPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

// ─── componente ──────────────────────────────────────────────────────────────

export function CombatPanel({
  character,
  isEditMode,
  onChangeCharacter,
}: CombatPanelProps) {
  const ac = calcAC(character)
  const initiative = calcInitiative(character)
  const profBonus = calcProficiencyBonus(character.classes)

  function set<K extends keyof Character>(key: K, value: Character[K]) {
    onChangeCharacter({ ...character, [key]: value })
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }

  // HP atual nunca ultrapassa hpMax + hpTemp
  function setHpCurrent(value: number) {
    set('hpCurrent', clamp(value, 0, character.hpMax + character.hpTemp))
  }

  function setDeathSave(field: 'success' | 'failure', value: number) {
    onChangeCharacter({
      ...character,
      deathSaves: {
        ...character.deathSaves,
        [field]: clamp(value, 0, 3),
      },
    })
  }

  const isDowned = character.hpCurrent === 0

  return (
    <section>
      <h2>Combate</h2>

      {/* ── linha superior: CA / Iniciativa / Velocidade ── */}
      <div>
        <div>
          <span>CA</span>
          <strong>{ac}</strong>
          {isEditMode && (
            <label>
              Base
              <input
                type="number"
                value={character.armorClassBase}
                onChange={(e) => set('armorClassBase', Number(e.target.value))}
                style={{ width: '3.5rem' }}
              />
            </label>
          )}
        </div>

        <div>
          <span>Iniciativa</span>
          <strong>{formatModifier(initiative)}</strong>
          {isEditMode && (
            <label>
              Bônus extra
              <input
                type="number"
                value={character.initiativeBonusExtra}
                onChange={(e) =>
                  set('initiativeBonusExtra', Number(e.target.value))
                }
                style={{ width: '3.5rem' }}
              />
            </label>
          )}
        </div>

        <div>
          <span>Velocidade</span>
          {isEditMode ? (
            <input
              type="text"
              value={character.speed}
              onChange={(e) => set('speed', e.target.value)}
              style={{ width: '5rem' }}
            />
          ) : (
            <strong>{character.speed}</strong>
          )}
        </div>

        <div>
          <span>Proficiência</span>
          <strong>{formatModifier(profBonus)}</strong>
        </div>
      </div>

      {/* ── HP ── */}
      <div>
        <div>
          <span>HP Máximo</span>
          {isEditMode ? (
            <input
              type="number"
              min={0}
              value={character.hpMax}
              onChange={(e) => set('hpMax', Number(e.target.value))}
              style={{ width: '4rem' }}
            />
          ) : (
            <strong>{character.hpMax}</strong>
          )}
        </div>

        <div>
          <span>HP Atual</span>
          <button onClick={() => setHpCurrent(character.hpCurrent - 1)}>−</button>
          <strong>{character.hpCurrent}</strong>
          <button onClick={() => setHpCurrent(character.hpCurrent + 1)}>+</button>
        </div>

        <div>
          <span>HP Temporário</span>
          <button
            onClick={() =>
              set('hpTemp', Math.max(0, character.hpTemp - 1))
            }
          >
            −
          </button>
          <strong>{character.hpTemp}</strong>
          <button onClick={() => set('hpTemp', character.hpTemp + 1)}>+</button>
        </div>
      </div>

      {/* ── Dados de vida ── */}
      <div>
        <span>Dados de vida: {totalHitDice(character)}</span>
        <span>Gastos: </span>
        <button
          onClick={() =>
            set('hitDiceSpent', Math.max(0, character.hitDiceSpent - 1))
          }
        >
          −
        </button>
        <strong>{character.hitDiceSpent}</strong>
        <button
          onClick={() => {
            const total = character.classes.reduce((s, c) => s + c.level, 0)
            set('hitDiceSpent', Math.min(total, character.hitDiceSpent + 1))
          }}
        >
          +
        </button>
      </div>

      {/* ── Death saves — só aparece quando desmaiado ── */}
      {(isDowned || isEditMode) && (
        <div>
          <h3>Testes de morte</h3>

          <div>
            <span>Sucessos</span>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="checkbox"
                checked={character.deathSaves.success > i}
                onChange={(e) =>
                  setDeathSave('success', e.target.checked ? i + 1 : i)
                }
              />
            ))}
          </div>

          <div>
            <span>Falhas</span>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="checkbox"
                checked={character.deathSaves.failure > i}
                onChange={(e) =>
                  setDeathSave('failure', e.target.checked ? i + 1 : i)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Inspiração heroica ── */}
      <div>
        <span>Inspiração heroica</span>
        <button
          onClick={() =>
            set('heroicInspiration', Math.max(0, character.heroicInspiration - 1))
          }
        >
          −
        </button>
        <strong>{character.heroicInspiration}</strong>
        <button
          onClick={() => set('heroicInspiration', character.heroicInspiration + 1)}
        >
          +
        </button>
      </div>
    </section>
  )
}