// Arquivo: Skill.ts
// Descrição: perícia individual
// Tipo: interface/type

import type { SkillName } from './SkillName'

export interface Skill {
  proficiency: number
  misc: number
}

export type Skills = Record<SkillName, Skill>