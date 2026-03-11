// src/components/SkillsPanel/SkillsPanel.tsx
// Lista as 18 perícias com valor calculado (mod do atributo + proficiência + misc)

import type { AttributeName, Character, SkillName } from '../../types/system/dnd'
import {
  calcModifier,
  calcProficiencyBonus,
} from '../AttributesPanel/AttributesPanel'

// ─── mapeamento perícia → atributo ───────────────────────────────────────────

const SKILL_ATTR: Record<SkillName, AttributeName> = {
  athletics:      'Força',
  acrobatics:     'Destreza',
  sleightOfHand:  'Destreza',
  stealth:        'Destreza',
  arcana:         'Inteligência',
  history:        'Inteligência',
  investigation:  'Inteligência',
  nature:         'Inteligência',
  religion:       'Inteligência',
  animalHandling: 'Sabedoria',
  insight:        'Sabedoria',
  medicine:       'Sabedoria',
  perception:     'Sabedoria',
  survival:       'Sabedoria',
  deception:      'Carisma',
  intimidation:   'Carisma',
  performance:    'Carisma',
  persuasion:     'Carisma',
}

const SKILL_LABEL: Record<SkillName, string> = {
  athletics:      'Atletismo',
  acrobatics:     'Acrobacia',
  sleightOfHand:  'Prestidigitação',
  stealth:        'Furtividade',
  arcana:         'Arcanismo',
  history:        'História',
  investigation:  'Investigação',
  nature:         'Natureza',
  religion:       'Religião',
  animalHandling: 'Adestrar Animais',
  insight:        'Intuição',
  medicine:       'Medicina',
  perception:     'Percepção',
  survival:       'Sobrevivência',
  deception:      'Enganação',
  intimidation:   'Intimidação',
  performance:    'Atuação',
  persuasion:     'Persuasão',
}

// Ordem de exibição agrupada por atributo
const SKILL_ORDER: SkillName[] = [
  'athletics',
  'acrobatics', 'sleightOfHand', 'stealth',
  'arcana', 'history', 'investigation', 'nature', 'religion',
  'animalHandling', 'insight', 'medicine', 'perception', 'survival',
  'deception', 'intimidation', 'performance', 'persuasion',
]

const PROFICIENCY_LABEL: Record<number, string> = {
  0: '○',  // sem proficiência
  1: '◑',  // proficiente
  2: '●',  // expertise
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// ─── props ───────────────────────────────────────────────────────────────────

interface SkillsPanelProps {
  character: Character
  isEditMode: boolean
  onChangeCharacter: (updated: Character) => void
}

// ─── componente ──────────────────────────────────────────────────────────────

export function SkillsPanel({
  character,
  isEditMode,
  onChangeCharacter,
}: SkillsPanelProps) {
  const profBonus = calcProficiencyBonus(character.classes)

  function getAttrMod(attrName: AttributeName): number {
    const attr = character.attributes.find((a) => a.name === attrName)
    return attr ? calcModifier(attr.value) : 0
  }

  function calcSkillTotal(skill: SkillName): number {
    const attrMod = getAttrMod(SKILL_ATTR[skill])
    const { proficiency, misc } = character.skills[skill]
    return attrMod + proficiency * profBonus + misc
  }

  function setProficiency(skill: SkillName, value: number) {
    onChangeCharacter({
      ...character,
      skills: {
        ...character.skills,
        [skill]: { ...character.skills[skill], proficiency: value },
      },
    })
  }

  function setMisc(skill: SkillName, value: number) {
    onChangeCharacter({
      ...character,
      skills: {
        ...character.skills,
        [skill]: { ...character.skills[skill], misc: value },
      },
    })
  }

  // Percepção passiva = 10 + total de Percepção + bônus extra
  const passivePerception =
    10 + calcSkillTotal('perception') + character.passivePerceptionBonus

  return (
    <section>
      <h2>Perícias</h2>
      <p>Percepção passiva: {passivePerception}</p>

      <ul>
        {SKILL_ORDER.map((skill) => {
          const total = calcSkillTotal(skill)
          const { proficiency, misc } = character.skills[skill]
          const attrAbbr = SKILL_ATTR[skill].slice(0, 3).toUpperCase()

          return (
            <li key={skill}>
              <span>{formatModifier(total)}</span>
              <span>{SKILL_LABEL[skill]}</span>
              <span>({attrAbbr})</span>

              {isEditMode ? (
                <>
                  {/* Cicla entre 0 → 1 → 2 → 0 */}
                  <button
                    title="Proficiência: clique para alternar"
                    onClick={() => setProficiency(skill, (proficiency + 1) % 3)}
                  >
                    {PROFICIENCY_LABEL[proficiency]}
                  </button>

                  <label>
                    Misc
                    <input
                      type="number"
                      value={misc}
                      onChange={(e) => setMisc(skill, Number(e.target.value))}
                      style={{ width: '3rem' }}
                    />
                  </label>
                </>
              ) : (
                <span title="Proficiência">{PROFICIENCY_LABEL[proficiency]}</span>
              )}
            </li>
          )
        })}
      </ul>

      {isEditMode && (
        <label>
          Bônus extra à percepção passiva
          <input
            type="number"
            value={character.passivePerceptionBonus}
            onChange={(e) =>
              onChangeCharacter({
                ...character,
                passivePerceptionBonus: Number(e.target.value),
              })
            }
          />
        </label>
      )}
    </section>
  )
}