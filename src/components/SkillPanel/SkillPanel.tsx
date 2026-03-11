// src/components/SkillsPanel/SkillsPanel.tsx
// Lista as 18 perícias com valor calculado (mod do atributo + proficiência + mod extra)

import type { AttributeName, Character, SkillName } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './SkillPanel.module.css'
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
    <section className={panelStyles.panel}>
      <div className={styles.summaryRow}>
        <h2 className={panelStyles.panelTitle}>Perícias</h2>
        <p className={styles.summary}>Percepção passiva: {passivePerception}</p>
      </div>

      <ul className={styles.list}>
        {SKILL_ORDER.map((skill) => {
          const total = calcSkillTotal(skill)
          const { proficiency, misc } = character.skills[skill]
          const attrAbbr = SKILL_ATTR[skill].slice(0, 3).toUpperCase()

          return (
            <li className={styles.skillRow} key={skill}>
              <span className={styles.total}>{formatModifier(total)}</span>
              <div className={styles.skillInfo}>
                <span className={styles.skillName}>{SKILL_LABEL[skill]}</span>
                <span className={styles.skillAttribute}>({attrAbbr})</span>
              </div>

              {isEditMode ? (
                <div className={styles.skillControls}>
                  <button
                    className={styles.profButton}
                    title="Proficiência: clique para alternar"
                    onClick={() => setProficiency(skill, (proficiency + 1) % 3)}
                  >
                    {PROFICIENCY_LABEL[proficiency]}
                  </button>

                  <label className={styles.miscField}>
                    Mod Extra
                    <input
                      type="number"
                      value={misc}
                      onChange={(e) => setMisc(skill, Number(e.target.value))}
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.skillControls}>
                  <span className={panelStyles.badge} title="Proficiência">{PROFICIENCY_LABEL[proficiency]}</span>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {isEditMode && (
        <label className={styles.passiveField}>
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