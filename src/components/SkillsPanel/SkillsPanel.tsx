import type { KeyboardEvent } from 'react'
import type { AttributeName, Character, SkillName } from '../../types/system/dnd'
import panelStyles from '../../styles/panel.module.css'
import styles from './SkillsPanel.module.css'
import {
	calcModifier,
	calcProficiencyBonus,
} from '../AttributesPanel/AttributesPanel'

const SKILL_ATTR: Record<SkillName, AttributeName> = {
	athletics: 'Força',
	acrobatics: 'Destreza',
	sleightOfHand: 'Destreza',
	stealth: 'Destreza',
	arcana: 'Inteligência',
	history: 'Inteligência',
	investigation: 'Inteligência',
	nature: 'Inteligência',
	religion: 'Inteligência',
	animalHandling: 'Sabedoria',
	insight: 'Sabedoria',
	medicine: 'Sabedoria',
	perception: 'Sabedoria',
	survival: 'Sabedoria',
	deception: 'Carisma',
	intimidation: 'Carisma',
	performance: 'Carisma',
	persuasion: 'Carisma',
}

const SKILL_LABEL: Record<SkillName, string> = {
	athletics: 'Atletismo',
	acrobatics: 'Acrobacia',
	sleightOfHand: 'Prestidigitação',
	stealth: 'Furtividade',
	arcana: 'Arcanismo',
	history: 'História',
	investigation: 'Investigação',
	nature: 'Natureza',
	religion: 'Religião',
	animalHandling: 'Adestrar Animais',
	insight: 'Intuição',
	medicine: 'Medicina',
	perception: 'Percepção',
	survival: 'Sobrevivência',
	deception: 'Enganação',
	intimidation: 'Intimidação',
	performance: 'Atuação',
	persuasion: 'Persuasão',
}

const SKILL_ORDER: SkillName[] = [
	'athletics',
	'acrobatics',
	'sleightOfHand',
	'stealth',
	'arcana',
	'history',
	'investigation',
	'nature',
	'religion',
	'animalHandling',
	'insight',
	'medicine',
	'perception',
	'survival',
	'deception',
	'intimidation',
	'performance',
	'persuasion',
]

const PROFICIENCY_LABEL: Record<number, string> = {
	0: '○',
	1: '◑',
	2: '●',
}

const PROFICIENCY_DESCRIPTION: Record<number, string> = {
	0: 'sem proficiência',
	1: 'proficiente',
	2: 'expertise',
}

const ATTRIBUTE_ABBREVIATION: Record<AttributeName, string> = {
	Força: 'FOR',
	Destreza: 'DES',
	Constituição: 'CON',
	Inteligência: 'INT',
	Sabedoria: 'SAB',
	Carisma: 'CAR',
}

function formatModifier(modifier: number): string {
	return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function parseNumberInput(rawValue: string, fallback = 0): number {
	const parsed = Number(rawValue)
	return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeSkillProficiency(value: number): number {
	if (value <= 0) return 0
	if (value === 1) return 1
	return 2
}

interface SkillsPanelProps {
	character: Character
	isEditMode: boolean
	onChangeCharacter: (updated: Character) => void
}

export function SkillsPanel({
	character,
	isEditMode,
	onChangeCharacter,
}: SkillsPanelProps) {
	const profBonus = calcProficiencyBonus(character.classes)
	const skillColumns: SkillName[][] = [
		SKILL_ORDER.slice(0, 6),
		SKILL_ORDER.slice(6, 12),
		SKILL_ORDER.slice(12, 18),
	]

	function getAttrMod(attrName: AttributeName): number {
		const attribute = character.attributes.find((entry) => entry.name === attrName)
		return attribute ? calcModifier(attribute.value) : 0
	}

	function calcSkillTotal(skill: SkillName): number {
		const attrMod = getAttrMod(SKILL_ATTR[skill])
		const { proficiency, misc } = character.skills[skill]
		return attrMod + normalizeSkillProficiency(proficiency) * profBonus + misc
	}

	function setProficiency(skill: SkillName, value: number) {
		onChangeCharacter({
			...character,
			skills: {
				...character.skills,
				[skill]: {
					...character.skills[skill],
					proficiency: normalizeSkillProficiency(value),
				},
			},
		})
	}

	function setMisc(skill: SkillName, value: number) {
		onChangeCharacter({
			...character,
			skills: {
				...character.skills,
				[skill]: {
					...character.skills[skill],
					misc: value,
				},
			},
		})
	}

	function handleProficiencyKeyDown(
		event: KeyboardEvent<HTMLSpanElement>,
		skill: SkillName,
		currentProficiency: number,
	) {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return
		}

		event.preventDefault()
		setProficiency(skill, (currentProficiency + 1) % 3)
	}

	const passivePerception =
		10 + calcSkillTotal('perception') + character.passivePerceptionBonus

	return (
		<section className={panelStyles.panel}>
			<div className={panelStyles.panelHeader}>
				<h2 className={panelStyles.panelTitle}>Perícias</h2>
				<p className={panelStyles.panelSubtitle}>
					Bônus de proficiência: {formatModifier(profBonus)}
				</p>
			</div>

			<div className={styles.skillGrid}>
				{skillColumns.map((column, columnIndex) => (
					<div className={styles.skillList} key={columnIndex}>
						{column.map((skill) => {
							const total = calcSkillTotal(skill)
							const proficiency = normalizeSkillProficiency(character.skills[skill].proficiency)
							const misc = character.skills[skill].misc
							const attribute = SKILL_ATTR[skill]
							const attributeAbbreviation = ATTRIBUTE_ABBREVIATION[attribute]

							return (
								<div className={styles.skillRow} key={skill}>
									<span
										aria-label={`Proficiência em ${SKILL_LABEL[skill]}: ${PROFICIENCY_DESCRIPTION[proficiency]}`}
										aria-pressed={isEditMode ? proficiency > 0 : undefined}
										className={`${styles.profIcon}${isEditMode ? ` ${styles.profIconClickable}` : ''}`}
										role={isEditMode ? 'button' : undefined}
										tabIndex={isEditMode ? 0 : undefined}
										title={isEditMode ? 'Clique para alternar proficiência' : PROFICIENCY_DESCRIPTION[proficiency]}
										onClick={isEditMode ? () => setProficiency(skill, (proficiency + 1) % 3) : undefined}
										onKeyDown={
											isEditMode
												? (event) => handleProficiencyKeyDown(event, skill, proficiency)
												: undefined
										}
									>
										{PROFICIENCY_LABEL[proficiency]}
									</span>

									<div className={styles.skillLabelGroup}>
										<span className={styles.skillName}>{SKILL_LABEL[skill]}</span>
										<span className={styles.skillAttr}>({attributeAbbreviation})</span>
									</div>

									<div className={styles.skillValueGroup}>
										{isEditMode ? (
											<input
												type="number"
												aria-label={`Modificador extra de ${SKILL_LABEL[skill]}`}
												className={styles.miscInput}
												title="Modificador extra"
												value={misc}
												onChange={(event) => setMisc(skill, parseNumberInput(event.target.value, 0))}
											/>
										) : null}

										<strong className={styles.skillBonus}>{formatModifier(total)}</strong>
									</div>
								</div>
							)
						})}
					</div>
				))}
			</div>

			<div className={styles.passiveRow}>
				<span className={styles.passiveLabel}>Percepção passiva</span>

				<div className={styles.passiveValues}>
					<strong className={styles.passiveValue}>{passivePerception}</strong>

					{isEditMode ? (
						<input
							type="number"
							aria-label="Bônus extra à percepção passiva"
							className={styles.passiveBonusInput}
							title="Bônus extra à percepção passiva"
							value={character.passivePerceptionBonus}
							onChange={(event) =>
								onChangeCharacter({
									...character,
									passivePerceptionBonus: parseNumberInput(event.target.value, 0),
								})
							}
						/>
					) : null}
				</div>
			</div>
		</section>
	)
}