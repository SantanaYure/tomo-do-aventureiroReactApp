import type { CharacterSheet } from '../system/dnd/CharacterSheet'

export type CampaignRole = 'dm' | 'player'

export interface CharacterVitals {
  hpCurrent: number
  hpMax: number
  hpTemp: number
  armorClass: number
  passivePerception: number
  heroicInspiration?: boolean
  conditions?: string[]
  deathSaves?: {
    successes: number
    failures: number
  }
  spellSlots?: Record<string, { current: number; max: number }>
  /** Modificador de iniciativa calculado a partir da ficha (DES + bônus extra). */
  initiativeBonus?: number
}

export interface CampaignCreature {
  id: string
  name: string
  monsterSheetId?: string | null
  ownerId?: string | null
  avatar?: string | null
  hpCurrent: number
  hpMax: number
  hpTemp: number
  armorClass: number
  passivePerception?: number
  conditions: string[]
  /** Modificador somado ao d20 na rolagem de iniciativa. */
  initiativeBonus?: number
  /** Resultado da iniciativa no combate atual; null = ainda não rolou. */
  initiative?: number | null
  addedAt: number
}

export interface CampaignMember {
  userId: string
  displayName: string
  photoURL?: string | null
  role: CampaignRole
  canManageHeroes?: boolean
  joinedAt: number
  characterSheetId?: string | null
  characterName?: string | null
  characterClass?: string | null
  characterAvatarUrl?: string | null
  vitals?: CharacterVitals | null
  /**
   * Resultado da iniciativa no combate atual. Fica fora de `vitals` porque a
   * sincronização com a ficha reescreve `vitals` inteiro.
   */
  initiative?: number | null
}

/** Estado do rastreador de combate da mesa. */
export interface CampaignCombat {
  round: number
  /** Id do participante com o turno ativo (ver `combatantId`). */
  activeId: string | null
}

export interface Campaign {
  id: string
  name: string
  description?: string
  system: 'dnd5e_2024'
  dmId: string
  dmName: string
  inviteCode: string
  memberIds: string[]
  bannerUrl?: string | null
  creatures?: CampaignCreature[]
  combat?: CampaignCombat | null
  createdAt: number
  updatedAt: number
  archived?: boolean
}


export interface CreateCampaignDTO {
  name: string
  description?: string
  bannerUrl?: string | null
}

export interface JoinCampaignDTO {
  inviteCode: string
  characterSheetId?: string | null
  characterName?: string | null
  characterClass?: string | null
  characterAvatarUrl?: string | null
  characterSheetData?: CharacterSheet | null
}
