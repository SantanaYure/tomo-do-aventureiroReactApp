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
}

export interface CampaignCreature {
  id: string
  name: string
  monsterSheetId?: string | null
  avatar?: string | null
  hpCurrent: number
  hpMax: number
  hpTemp: number
  armorClass: number
  passivePerception?: number
  conditions: string[]
  addedAt: number
}

export interface CampaignMember {
  userId: string
  displayName: string
  photoURL?: string | null
  role: CampaignRole
  joinedAt: number
  characterSheetId?: string | null
  characterName?: string | null
  characterClass?: string | null
  characterAvatarUrl?: string | null
  vitals?: CharacterVitals | null
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
}
